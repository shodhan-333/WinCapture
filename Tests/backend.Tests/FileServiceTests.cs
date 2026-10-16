using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Moq;
using WinCapture.Exceptions;
using WinCapture.Models;
using WinCapture.Repositories;
using WinCapture.Services;
using WinCapture.Validators;
using Xunit;

namespace WinCapture.Tests;

public sealed class FileServiceTests
{
    private const int UserId = 12;
    private readonly Mock<IStorageService> _storage = new();
    private readonly Mock<IFileRepository> _files = new();
    private readonly Mock<IAlbumRepository> _albums = new();
    private readonly FileService _service;

    public FileServiceTests()
    {
        _service = new FileService(
            new FileValidator(),
            _storage.Object,
            _files.Object,
            _albums.Object,
            Mock.Of<ILogger<FileService>>());
    }

    [Fact]
    public async Task GetAsync_AllowsSharedViewerAndDoesNotGrantManagement()
    {
        var file = AlbumFile();
        _files.Setup(repository => repository.GetByIdAsync(file.Id)).ReturnsAsync(file);
        _files.Setup(repository => repository.GetFavoriteAsync(UserId, file.Id)).ReturnsAsync((Favorite?)null);
        _albums.Setup(repository => repository.GetByIdAsync(file.AlbumId!.Value)).ReturnsAsync(Album());
        _albums.Setup(repository => repository.GetAccessAsync(file.AlbumId!.Value, UserId))
            .ReturnsAsync(new AlbumAccess { CanView = true, CanDownload = false });

        var response = await _service.GetAsync(file.Id, UserId, UserRole.User);

        Assert.False(response.CanManage);
        Assert.False(response.IsFavorite);
    }

    [Fact]
    public async Task GetAsync_HidesAlbumFileWhenAlbumIsMissing()
    {
        var file = AlbumFile();
        _files.Setup(repository => repository.GetByIdAsync(file.Id)).ReturnsAsync(file);
        _albums.Setup(repository => repository.GetByIdAsync(file.AlbumId!.Value))
            .ReturnsAsync((Album?)null);

        await Assert.ThrowsAsync<ForbiddenException>(
            () => _service.GetAsync(file.Id, UserId, UserRole.User));
    }

    [Fact]
    public async Task GetAsync_AllowsAdminWithoutAlbumLookup()
    {
        var file = AlbumFile();
        _files.Setup(repository => repository.GetByIdAsync(file.Id)).ReturnsAsync(file);
        _files.Setup(repository => repository.GetFavoriteAsync(99, file.Id))
            .ReturnsAsync((Favorite?)null);

        var result = await _service.GetAsync(file.Id, 99, UserRole.Admin);

        Assert.True(result.CanManage);
        _albums.Verify(repository => repository.GetByIdAsync(It.IsAny<long>()), Times.Never);
    }

    [Fact]
    public async Task GetAsync_RejectsUserWithoutAlbumViewPermission()
    {
        var file = AlbumFile();
        _files.Setup(repository => repository.GetByIdAsync(file.Id)).ReturnsAsync(file);
        _albums.Setup(repository => repository.GetByIdAsync(file.AlbumId!.Value)).ReturnsAsync(Album());
        _albums.Setup(repository => repository.GetAccessAsync(file.AlbumId!.Value, UserId))
            .ReturnsAsync(new AlbumAccess { CanView = false });

        await Assert.ThrowsAsync<ForbiddenException>(
            () => _service.GetAsync(file.Id, UserId, UserRole.User));
    }

    [Fact]
    public async Task AddFavoriteAsync_AllowsSharedViewer()
    {
        var file = AlbumFile();
        _files.Setup(repository => repository.GetByIdAsync(file.Id)).ReturnsAsync(file);
        _files.Setup(repository => repository.GetFavoriteAsync(UserId, file.Id)).ReturnsAsync((Favorite?)null);
        _albums.Setup(repository => repository.GetByIdAsync(file.AlbumId!.Value)).ReturnsAsync(Album());
        _albums.Setup(repository => repository.GetAccessAsync(file.AlbumId!.Value, UserId))
            .ReturnsAsync(new AlbumAccess { CanView = true });

        await _service.AddFavoriteAsync(file.Id, UserId, UserRole.User);

        _files.Verify(repository => repository.AddFavoriteAsync(
            It.Is<Favorite>(favorite => favorite.UserId == UserId && favorite.FileId == file.Id)),
            Times.Once);
    }

    [Fact]
    public async Task ReplaceAsync_DoesNotAllowSharedViewerToMutateFile()
    {
        var file = AlbumFile();
        _files.Setup(repository => repository.GetByIdAsync(file.Id)).ReturnsAsync(file);
        _albums.Setup(repository => repository.GetByIdAsync(file.AlbumId!.Value)).ReturnsAsync(Album());
        _albums.Setup(repository => repository.GetAccessAsync(file.AlbumId!.Value, UserId))
            .ReturnsAsync(new AlbumAccess { CanView = true });

        await Assert.ThrowsAsync<ForbiddenException>(
            () => _service.ReplaceAsync(file.Id, TextFile(), UserId, UserRole.User));

        _storage.Verify(storage => storage.SaveAsync(It.IsAny<IFormFile>()), Times.Never);
    }

    [Fact]
    public async Task DeleteAsync_DoesNotAllowSharedViewerToDeleteFile()
    {
        var file = AlbumFile();
        _files.Setup(repository => repository.GetByIdAsync(file.Id)).ReturnsAsync(file);
        _albums.Setup(repository => repository.GetByIdAsync(file.AlbumId!.Value)).ReturnsAsync(Album());
        _albums.Setup(repository => repository.GetAccessAsync(file.AlbumId!.Value, UserId))
            .ReturnsAsync(new AlbumAccess { CanView = true });

        await Assert.ThrowsAsync<ForbiddenException>(
            () => _service.DeleteAsync(file.Id, UserId, UserRole.User));

        _storage.Verify(storage => storage.DeleteAsync(It.IsAny<string>()), Times.Never);
        _files.Verify(repository => repository.DeleteAsync(It.IsAny<FileMetadata>()), Times.Never);
    }

    [Fact]
    public async Task DownloadAsync_RejectsSharedViewerWithoutDownloadPermission()
    {
        var file = AlbumFile();
        _files.Setup(repository => repository.GetByIdAsync(file.Id)).ReturnsAsync(file);
        _albums.Setup(repository => repository.GetByIdAsync(file.AlbumId!.Value)).ReturnsAsync(Album());
        _albums.Setup(repository => repository.GetAccessAsync(file.AlbumId!.Value, UserId))
            .ReturnsAsync(new AlbumAccess { CanView = true, CanDownload = false });

        await Assert.ThrowsAsync<ForbiddenException>(
            () => _service.DownloadAsync(file.Id, UserId, UserRole.User));

        _storage.Verify(storage => storage.GetAsync(It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task UploadAsync_CleansUpBlobWhenMetadataSaveFails()
    {
        _storage.Setup(storage => storage.SaveAsync(It.IsAny<IFormFile>())).ReturnsAsync("stored.txt");
        _storage.Setup(storage => storage.DeleteAsync("stored.txt")).Returns(Task.CompletedTask);
        _files.Setup(repository => repository.AddAsync(It.IsAny<FileMetadata>()))
            .ThrowsAsync(new InvalidOperationException("database unavailable"));

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _service.UploadAsync(TextFile(), UserId));

        _storage.Verify(storage => storage.DeleteAsync("stored.txt"), Times.Once);
    }

    [Fact]
    public async Task UploadAsync_SavesMetadataAndReturnsPersonalFileUrls()
    {
        _storage.Setup(storage => storage.SaveAsync(It.IsAny<IFormFile>())).ReturnsAsync("stored.txt");
        FileMetadata? saved = null;
        _files.Setup(repository => repository.AddAsync(It.IsAny<FileMetadata>()))
            .Callback<FileMetadata>(metadata => saved = metadata)
            .Returns(Task.CompletedTask);

        var response = await _service.UploadAsync(TextFile(), UserId);

        Assert.NotNull(saved);
        Assert.Equal(UserId, saved.UploadedBy);
        Assert.Equal("new.txt", saved.OriginalFileName);
        Assert.Equal("stored.txt", saved.StoredFileName);
        Assert.Equal($"/api/files/{saved.Id}", response.Url);
        Assert.Equal($"/api/files/{saved.Id}/download", response.DownloadUrl);
        Assert.True(response.CanManage);
        Assert.False(response.IsFavorite);
    }

    [Fact]
    public async Task UploadAsync_DoesNotStoreAnInvalidFile()
    {
        var invalid = new FormFile(new MemoryStream(), 0, 0, "file", "empty.txt")
        {
            Headers = new HeaderDictionary(),
            ContentType = "text/plain"
        };

        await Assert.ThrowsAsync<BadRequestException>(() => _service.UploadAsync(invalid, UserId));

        _storage.Verify(storage => storage.SaveAsync(It.IsAny<IFormFile>()), Times.Never);
        _files.Verify(repository => repository.AddAsync(It.IsAny<FileMetadata>()), Times.Never);
    }

    [Fact]
    public async Task ReplaceAsync_UpdatesOwnedFileAndBestEffortDeletesOldBlob()
    {
        var file = new FileMetadata
        {
            Id = 51,
            UploadedBy = UserId,
            StoredFileName = "old.txt",
            OriginalFileName = "old.txt",
            ContentType = "text/plain",
            FileSize = 3
        };
        _files.Setup(repository => repository.GetByIdAsync(file.Id)).ReturnsAsync(file);
        _files.Setup(repository => repository.UpdateAsync(file)).Returns(Task.CompletedTask);
        _files.Setup(repository => repository.GetFavoriteAsync(UserId, file.Id))
            .ReturnsAsync(new Favorite { UserId = UserId, FileId = file.Id });
        _storage.Setup(storage => storage.SaveAsync(It.IsAny<IFormFile>())).ReturnsAsync("new.txt");
        _storage.Setup(storage => storage.DeleteAsync("old.txt"))
            .ThrowsAsync(new StorageException("Cleanup failed.", new IOException()));

        var response = await _service.ReplaceAsync(file.Id, TextFile(), UserId, UserRole.User);

        Assert.Equal("new.txt", file.StoredFileName);
        Assert.Equal("new.txt", response.OriginalFileName);
        Assert.True(response.IsFavorite);
        Assert.True(response.CanManage);
        _files.Verify(repository => repository.UpdateAsync(file), Times.Once);
    }

    [Fact]
    public async Task GetAsync_ReturnsNotFoundForMissingFile()
    {
        _files.Setup(repository => repository.GetByIdAsync(909)).ReturnsAsync((FileMetadata?)null);

        await Assert.ThrowsAsync<NotFoundException>(
            () => _service.GetAsync(909, UserId, UserRole.User));
    }

    [Fact]
    public async Task GetAsync_AllowsOwnerToReadPersonalFile()
    {
        var file = new FileMetadata
        {
            Id = 10,
            UploadedBy = UserId,
            OriginalFileName = "mine.txt",
            StoredFileName = "stored.txt",
            ContentType = "text/plain"
        };
        _files.Setup(repository => repository.GetByIdAsync(file.Id)).ReturnsAsync(file);
        _files.Setup(repository => repository.GetFavoriteAsync(UserId, file.Id))
            .ReturnsAsync((Favorite?)null);

        var result = await _service.GetAsync(file.Id, UserId, UserRole.User);

        Assert.True(result.CanManage);
        Assert.Equal("/api/files/10", result.Url);
    }

    [Fact]
    public async Task DownloadAsync_ReturnsContentForPersonalOwner()
    {
        var file = new FileMetadata
        {
            Id = 14,
            UploadedBy = UserId,
            StoredFileName = "stored.txt",
            OriginalFileName = "download.txt",
            ContentType = "text/plain"
        };
        var stream = new MemoryStream([1, 2, 3]);
        _files.Setup(repository => repository.GetByIdAsync(file.Id)).ReturnsAsync(file);
        _storage.Setup(storage => storage.GetAsync(file.StoredFileName)).ReturnsAsync(stream);

        var result = await _service.DownloadAsync(file.Id, UserId, UserRole.User);

        Assert.Same(stream, result.Content);
        Assert.Equal("text/plain", result.ContentType);
        Assert.Equal("download.txt", result.DownloadName);
    }

    [Fact]
    public async Task DownloadAsync_AllowsSharedMemberWithDownloadPermission()
    {
        var file = AlbumFile();
        var stream = new MemoryStream([7]);
        _files.Setup(repository => repository.GetByIdAsync(file.Id)).ReturnsAsync(file);
        _albums.Setup(repository => repository.GetByIdAsync(file.AlbumId!.Value)).ReturnsAsync(Album());
        _albums.Setup(repository => repository.GetAccessAsync(file.AlbumId.GetValueOrDefault(), UserId))
            .ReturnsAsync(new AlbumAccess { CanView = true, CanDownload = true });
        _storage.Setup(storage => storage.GetAsync(file.StoredFileName)).ReturnsAsync(stream);

        var result = await _service.DownloadAsync(file.Id, UserId, UserRole.User);

        Assert.Same(stream, result.Content);
    }

    [Fact]
    public async Task DownloadAsync_ThrowsWhenAlbumWasDeleted()
    {
        var file = AlbumFile();
        _files.Setup(repository => repository.GetByIdAsync(file.Id)).ReturnsAsync(file);
        _albums.Setup(repository => repository.GetByIdAsync(file.AlbumId!.Value))
            .ReturnsAsync((Album?)null);

        await Assert.ThrowsAsync<ForbiddenException>(
            () => _service.DownloadAsync(file.Id, UserId, UserRole.User));

        _storage.Verify(storage => storage.GetAsync(It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task DeleteAsync_RemovesMetadataWhenStorageCleanupFails()
    {
        var file = new FileMetadata { Id = 15, UploadedBy = UserId, StoredFileName = "stored.txt" };
        _files.Setup(repository => repository.GetByIdAsync(file.Id)).ReturnsAsync(file);
        _storage.Setup(storage => storage.DeleteAsync(file.StoredFileName))
            .ThrowsAsync(new StorageException("Storage unavailable.", new IOException()));

        _files.Setup(repository => repository.DeleteAsync(file)).Returns(Task.CompletedTask);
        var cleanupComplete = await _service.DeleteAsync(file.Id, UserId, UserRole.User);

        Assert.False(cleanupComplete);
        _files.Verify(repository => repository.DeleteAsync(file), Times.Once);
    }

    [Fact]
    public async Task DeleteAsync_RemovesBlobAndMetadataForOwner()
    {
        var file = new FileMetadata { Id = 16, UploadedBy = UserId, StoredFileName = "owned.txt" };
        _files.Setup(repository => repository.GetByIdAsync(file.Id)).ReturnsAsync(file);
        _storage.Setup(storage => storage.DeleteAsync(file.StoredFileName)).Returns(Task.CompletedTask);
        _files.Setup(repository => repository.DeleteAsync(file)).Returns(Task.CompletedTask);

        var cleanupComplete = await _service.DeleteAsync(file.Id, UserId, UserRole.User);

        Assert.True(cleanupComplete);
        _storage.Verify(storage => storage.DeleteAsync(file.StoredFileName), Times.Once);
        _files.Verify(repository => repository.DeleteAsync(file), Times.Once);
    }

    [Fact]
    public async Task AddFavoriteAsync_IsIdempotentForExistingFavorite()
    {
        var file = new FileMetadata { Id = 30, UploadedBy = UserId };
        _files.Setup(repository => repository.GetByIdAsync(file.Id)).ReturnsAsync(file);
        _files.Setup(repository => repository.GetFavoriteAsync(UserId, file.Id))
            .ReturnsAsync(new Favorite { UserId = UserId, FileId = file.Id });

        await _service.AddFavoriteAsync(file.Id, UserId, UserRole.User);

        _files.Verify(repository => repository.AddFavoriteAsync(It.IsAny<Favorite>()), Times.Never);
    }

    [Fact]
    public async Task AddFavoriteAsync_RejectsUnownedPersonalFile()
    {
        _files.Setup(repository => repository.GetByIdAsync(30))
            .ReturnsAsync(new FileMetadata { Id = 30, UploadedBy = UserId + 1 });

        await Assert.ThrowsAsync<ForbiddenException>(
            () => _service.AddFavoriteAsync(30, UserId, UserRole.User));
        _files.Verify(repository => repository.AddFavoriteAsync(It.IsAny<Favorite>()), Times.Never);
    }

    [Fact]
    public async Task AddFavoriteAsync_ThrowsWhenFileDoesNotExist()
    {
        _files.Setup(repository => repository.GetByIdAsync(404)).ReturnsAsync((FileMetadata?)null);

        await Assert.ThrowsAsync<NotFoundException>(
            () => _service.AddFavoriteAsync(404, UserId, UserRole.User));
    }

    [Fact]
    public async Task RemoveFavoriteAsync_IsNoOpWhenFavoriteDoesNotExist()
    {
        _files.Setup(repository => repository.GetFavoriteAsync(UserId, 77)).ReturnsAsync((Favorite?)null);

        await _service.RemoveFavoriteAsync(77, UserId);

        _files.Verify(repository => repository.DeleteFavoriteAsync(It.IsAny<Favorite>()), Times.Never);
    }

    [Fact]
    public async Task RemoveFavoriteAsync_DeletesExistingFavorite()
    {
        var favorite = new Favorite { UserId = UserId, FileId = 77 };
        _files.Setup(repository => repository.GetFavoriteAsync(UserId, 77)).ReturnsAsync(favorite);

        await _service.RemoveFavoriteAsync(77, UserId);

        _files.Verify(repository => repository.DeleteFavoriteAsync(favorite), Times.Once);
    }

    [Fact]
    public async Task GetGalleryAsync_MapsFavoriteIdsAndPersonalUrls()
    {
        var files = new[]
        {
            new FileMetadata
            {
                Id = 1,
                UploadedBy = UserId,
                OriginalFileName = "favorite.txt",
                ContentType = "text/plain",
                FileSize = 8
            },
            new FileMetadata
            {
                Id = 2,
                UploadedBy = UserId,
                OriginalFileName = "other.txt",
                ContentType = "text/plain",
                FileSize = 5
            }
        };
        _files.Setup(repository => repository.GetByUserIdAsync(UserId)).ReturnsAsync(files);
        _files.Setup(repository => repository.GetFavoriteFileIdsByUserIdAsync(UserId))
            .ReturnsAsync(new long[] { 1 });

        var result = await _service.GetGalleryAsync(UserId);

        Assert.Equal(2, result.Count);
        Assert.True(result.Single(file => file.Id == 1).IsFavorite);
        Assert.False(result.Single(file => file.Id == 2).IsFavorite);
        Assert.All(result, file => Assert.True(file.CanManage));
        Assert.Equal("/api/files/1/download", result[0].DownloadUrl);
    }

    [Fact]
    public async Task GetFavoritesAsync_FiltersFilesWithoutViewAccess()
    {
        var visible = new FileMetadata { Id = 1, UploadedBy = UserId };
        var revokedAlbumFile = new FileMetadata { Id = 2, AlbumId = 20, UploadedBy = 31 };
        var missingAlbumFile = new FileMetadata { Id = 3, AlbumId = 30, UploadedBy = 31 };
        _files.Setup(repository => repository.GetFavoriteFilesByUserIdAsync(UserId))
            .ReturnsAsync(new[] { visible, revokedAlbumFile, missingAlbumFile });
        _albums.Setup(repository => repository.GetByIdAsync(20)).ReturnsAsync(Album());
        _albums.Setup(repository => repository.GetAccessAsync(20, UserId))
            .ReturnsAsync(new AlbumAccess { CanView = false });
        _albums.Setup(repository => repository.GetByIdAsync(30)).ReturnsAsync((Album?)null);

        var result = await _service.GetFavoritesAsync(UserId, UserRole.User);

        var file = Assert.Single(result);
        Assert.Equal(visible.Id, file.Id);
        Assert.True(file.IsFavorite);
        Assert.True(file.CanManage);
    }

    [Fact]
    public async Task AdminFileQueries_MapUploaderAndOptionalAlbumDetails()
    {
        var album = Album();
        album.AlbumName = "Admin album";
        var personalFile = new FileMetadata
        {
            Id = 101,
            OriginalFileName = "personal.txt",
            ContentType = "text/plain",
            FileSize = 8,
            UploadedBy = UserId,
            UploadedAt = DateTime.UtcNow,
            User = new User { Id = UserId, Name = "Uploader" }
        };
        var albumFile = new FileMetadata
        {
            Id = 102,
            OriginalFileName = "album.txt",
            ContentType = "text/plain",
            FileSize = 5,
            UploadedBy = album.CreatedBy,
            AlbumId = album.Id,
            UploadedAt = DateTime.UtcNow,
            User = album.Owner,
            Album = album
        };
        _files.Setup(repository => repository.GetAllAsync())
            .ReturnsAsync(new[] { personalFile, albumFile });
        _files.Setup(repository => repository.GetAdminFilesByUploaderIdAsync(UserId))
            .ReturnsAsync(new[] { personalFile });

        var all = await _service.GetAllAsync();
        var uploaded = await _service.GetAdminFilesByUploaderIdAsync(UserId);

        Assert.Equal(2, all.Count);
        Assert.Null(all[0].AlbumName);
        Assert.Equal("Uploader", all[0].UploaderName);
        Assert.Equal("Admin album", all[1].AlbumName);
        Assert.Equal(album.Id, all[1].AlbumId);
        Assert.Equal("personal.txt", Assert.Single(uploaded).OriginalFileName);
    }

    private static FileMetadata AlbumFile() => new()
    {
        Id = 7,
        AlbumId = 20,
        UploadedBy = 31,
        StoredFileName = "stored.txt",
        OriginalFileName = "original.txt",
        ContentType = "text/plain",
        FileSize = 4
    };

    private static Album Album() => new()
    {
        Id = 20,
        CreatedBy = 31,
        AlbumName = "Shared",
        Owner = new User { Id = 31, Name = "Owner" }
    };

    private static FormFile TextFile()
    {
        var content = System.Text.Encoding.UTF8.GetBytes("valid text");
        var file = new FormFile(new MemoryStream(content), 0, content.Length, "file", "new.txt")
        {
            Headers = new HeaderDictionary()
        };
        file.ContentType = "text/plain";
        return file;
    }
}
