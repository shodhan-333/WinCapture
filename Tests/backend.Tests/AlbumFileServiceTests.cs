using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Moq;
using WinCapture.DTOs.Albums;
using WinCapture.Exceptions;
using WinCapture.Models;
using WinCapture.Repositories;
using WinCapture.Services;
using WinCapture.Validators;
using Xunit;

namespace WinCapture.Tests;

public sealed class AlbumFileServiceTests
{
    private const long AlbumId = 31;
    private const long FileId = 42;
    private const int OwnerId = 8;
    private readonly Mock<IStorageService> _storage = new();
    private readonly Mock<IFileRepository> _files = new();
    private readonly Mock<IAlbumService> _albums = new();
    private readonly AlbumFileService _service;

    public AlbumFileServiceTests()
    {
        _service = new AlbumFileService(
            new FileValidator(),
            _storage.Object,
            _files.Object,
            _albums.Object,
            Mock.Of<ILogger<AlbumFileService>>());
    }

    [Fact]
    public async Task ReplaceAsync_UpdatesMetadataThenRemovesOldBlob()
    {
        var album = new Album { Id = AlbumId, CreatedBy = OwnerId };
        var file = ExistingFile();
        FileMetadata? savedMetadata = null;
        _albums.Setup(service => service.GetForUploadAsync(AlbumId, It.IsAny<User>(), UserRole.User))
            .ReturnsAsync(album);
        _files.Setup(repository => repository.GetByIdAsync(FileId)).ReturnsAsync(file);
        _files.Setup(repository => repository.UpdateAsync(It.IsAny<FileMetadata>()))
            .Callback<FileMetadata>(metadata => savedMetadata = metadata)
            .Returns(Task.CompletedTask);
        _files.Setup(repository => repository.GetFavoriteAsync(OwnerId, FileId))
            .ReturnsAsync((Favorite?)null);
        _storage.Setup(service => service.SaveAsync(It.IsAny<IFormFile>())).ReturnsAsync("new.txt");
        _storage.Setup(service => service.DeleteAsync("old.txt")).Returns(Task.CompletedTask);

        var response = await _service.ReplaceAsync(
            AlbumId,
            FileId,
            TextFile(),
            new User { Id = OwnerId },
            UserRole.User);

        Assert.NotNull(savedMetadata);
        Assert.Equal("new.txt", savedMetadata.StoredFileName);
        Assert.Equal("replacement.txt", savedMetadata.OriginalFileName);
        Assert.Equal("text/plain", savedMetadata.ContentType);
        Assert.Equal(10, savedMetadata.FileSize);
        Assert.Equal($"/api/albums/{AlbumId}/files/{FileId}", response.Url);
        Assert.True(response.CanManage);
        _storage.Verify(service => service.DeleteAsync("old.txt"), Times.Once);
    }

    [Fact]
    public async Task ReplaceAsync_CleansUpNewBlobWhenMetadataUpdateFails()
    {
        _albums.Setup(service => service.GetForUploadAsync(AlbumId, It.IsAny<User>(), UserRole.User))
            .ReturnsAsync(new Album { Id = AlbumId, CreatedBy = OwnerId });
        _files.Setup(repository => repository.GetByIdAsync(FileId)).ReturnsAsync(ExistingFile());
        _files.Setup(repository => repository.UpdateAsync(It.IsAny<FileMetadata>()))
            .ThrowsAsync(new InvalidOperationException("database unavailable"));
        _storage.Setup(service => service.SaveAsync(It.IsAny<IFormFile>())).ReturnsAsync("new.txt");
        _storage.Setup(service => service.DeleteAsync("new.txt")).Returns(Task.CompletedTask);

        await Assert.ThrowsAsync<InvalidOperationException>(() => _service.ReplaceAsync(
            AlbumId,
            FileId,
            TextFile(),
            new User { Id = OwnerId },
            UserRole.User));

        _storage.Verify(service => service.DeleteAsync("new.txt"), Times.Once);
        _storage.Verify(service => service.DeleteAsync("old.txt"), Times.Never);
    }

    [Fact]
    public async Task ReplaceAsync_RejectsFileFromAnotherAlbum()
    {
        _albums.Setup(service => service.GetForUploadAsync(AlbumId, It.IsAny<User>(), UserRole.User))
            .ReturnsAsync(new Album { Id = AlbumId, CreatedBy = OwnerId });
        _files.Setup(repository => repository.GetByIdAsync(FileId))
            .ReturnsAsync(new FileMetadata { Id = FileId, AlbumId = AlbumId + 1 });

        await Assert.ThrowsAsync<NotFoundException>(() => _service.ReplaceAsync(
            AlbumId,
            FileId,
            TextFile(),
            new User { Id = OwnerId },
            UserRole.User));

        _storage.Verify(service => service.SaveAsync(It.IsAny<IFormFile>()), Times.Never);
    }

    [Fact]
    public async Task ReplaceAsync_ThrowsWhenFileIsMissing()
    {
        _albums.Setup(service => service.GetForUploadAsync(AlbumId, It.IsAny<User>(), UserRole.User))
            .ReturnsAsync(new Album { Id = AlbumId, CreatedBy = OwnerId });
        _files.Setup(repository => repository.GetByIdAsync(FileId)).ReturnsAsync((FileMetadata?)null);

        await Assert.ThrowsAsync<NotFoundException>(() => _service.ReplaceAsync(
            AlbumId,
            FileId,
            TextFile(),
            new User { Id = OwnerId },
            UserRole.User));

        _storage.Verify(service => service.SaveAsync(It.IsAny<IFormFile>()), Times.Never);
    }

    [Fact]
    public async Task UploadAsync_SavesMetadataAndBuildsAlbumFileUrls()
    {
        _albums.Setup(service => service.GetForUploadAsync(AlbumId, It.IsAny<User>(), UserRole.User))
            .ReturnsAsync(new Album { Id = AlbumId, CreatedBy = OwnerId });
        _storage.Setup(service => service.SaveAsync(It.IsAny<IFormFile>())).ReturnsAsync("blob.txt");
        FileMetadata? saved = null;
        _files.Setup(repository => repository.AddAsync(It.IsAny<FileMetadata>()))
            .Callback<FileMetadata>(metadata => saved = metadata)
            .Returns(Task.CompletedTask);

        var response = await _service.UploadAsync(AlbumId, TextFile(), new User { Id = OwnerId }, UserRole.User);

        Assert.NotNull(saved);
        Assert.Equal(AlbumId, saved.AlbumId);
        Assert.Equal(OwnerId, saved.UploadedBy);
        Assert.Equal($"/api/albums/{AlbumId}/files/{saved.Id}", response.Url);
        Assert.Equal($"/api/albums/{AlbumId}/files/{saved.Id}/download", response.DownloadUrl);
        Assert.True(response.CanManage);
        Assert.False(response.IsFavorite);
    }

    [Fact]
    public async Task UploadAsync_CleansBlobWhenMetadataInsertFails()
    {
        _albums.Setup(service => service.GetForUploadAsync(AlbumId, It.IsAny<User>(), UserRole.User))
            .ReturnsAsync(new Album { Id = AlbumId, CreatedBy = OwnerId });
        _storage.Setup(service => service.SaveAsync(It.IsAny<IFormFile>())).ReturnsAsync("blob.txt");
        _storage.Setup(service => service.DeleteAsync("blob.txt")).Returns(Task.CompletedTask);
        _files.Setup(repository => repository.AddAsync(It.IsAny<FileMetadata>()))
            .ThrowsAsync(new InvalidOperationException("database unavailable"));

        await Assert.ThrowsAsync<InvalidOperationException>(() => _service.UploadAsync(
            AlbumId, TextFile(), new User { Id = OwnerId }, UserRole.User));

        _storage.Verify(service => service.DeleteAsync("blob.txt"), Times.Once);
    }

    [Fact]
    public async Task UploadAsync_PreservesMetadataFailureWhenBlobCleanupAlsoFails()
    {
        var databaseFailure = new InvalidOperationException("database unavailable");
        _albums.Setup(service => service.GetForUploadAsync(AlbumId, It.IsAny<User>(), UserRole.User))
            .ReturnsAsync(new Album { Id = AlbumId, CreatedBy = OwnerId });
        _storage.Setup(service => service.SaveAsync(It.IsAny<IFormFile>())).ReturnsAsync("blob.txt");
        _storage.Setup(service => service.DeleteAsync("blob.txt"))
            .ThrowsAsync(new StorageException("cleanup unavailable", new IOException()));
        _files.Setup(repository => repository.AddAsync(It.IsAny<FileMetadata>()))
            .ThrowsAsync(databaseFailure);

        var thrown = await Assert.ThrowsAsync<InvalidOperationException>(() => _service.UploadAsync(
            AlbumId,
            TextFile(),
            new User { Id = OwnerId },
            UserRole.User));

        Assert.Same(databaseFailure, thrown);
    }

    [Fact]
    public async Task GetAsync_MapsFavoriteStatusForEachFile()
    {
        _albums.Setup(service => service.GetAsync(AlbumId, It.IsAny<User>(), UserRole.User))
            .ReturnsAsync(new AlbumResponse(AlbumId, "Trips", OwnerId, "Owner", DateTime.UtcNow, null));
        _files.Setup(repository => repository.GetByAlbumIdAsync(AlbumId))
            .ReturnsAsync(new[] { ExistingFile(), new FileMetadata { Id = 43, AlbumId = AlbumId } });
        _files.Setup(repository => repository.GetFavoriteFileIdsByUserIdAsync(OwnerId))
            .ReturnsAsync(new long[] { FileId });

        var result = await _service.GetAsync(AlbumId, new User { Id = OwnerId }, UserRole.User);

        Assert.Equal(2, result.Count);
        Assert.True(result.Single(file => file.Id == FileId).IsFavorite);
        Assert.False(result.Single(file => file.Id == 43).IsFavorite);
        Assert.All(result, file => Assert.True(file.CanManage));
    }

    [Fact]
    public async Task GetOneAsync_HidesFilesThatBelongToAnotherAlbum()
    {
        _albums.Setup(service => service.GetAsync(AlbumId, It.IsAny<User>(), UserRole.User))
            .ReturnsAsync(new AlbumResponse(AlbumId, "Trips", OwnerId, "Owner", DateTime.UtcNow, null));
        _files.Setup(repository => repository.GetByIdAsync(FileId))
            .ReturnsAsync(new FileMetadata { Id = FileId, AlbumId = AlbumId + 1 });

        await Assert.ThrowsAsync<NotFoundException>(() => _service.GetOneAsync(
            AlbumId, FileId, new User { Id = OwnerId }, UserRole.User));

        _files.Verify(repository => repository.GetFavoriteAsync(It.IsAny<int>(), It.IsAny<long>()), Times.Never);
    }

    [Fact]
    public async Task PreviewAsync_HidesFilesThatBelongToAnotherAlbum()
    {
        _albums.Setup(service => service.GetAsync(AlbumId, It.IsAny<User>(), UserRole.User))
            .ReturnsAsync(new AlbumResponse(AlbumId, "Trips", OwnerId, "Owner", DateTime.UtcNow, null));
        _files.Setup(repository => repository.GetByIdAsync(FileId))
            .ReturnsAsync(new FileMetadata { Id = FileId, AlbumId = AlbumId + 1 });

        await Assert.ThrowsAsync<NotFoundException>(() => _service.PreviewAsync(
            AlbumId,
            FileId,
            new User { Id = OwnerId },
            UserRole.User));

        _storage.Verify(service => service.GetAsync(It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task PreviewAsync_ReturnsContentAfterAlbumViewCheck()
    {
        var file = ExistingFile();
        var stream = new MemoryStream([9, 8]);
        _albums.Setup(service => service.GetAsync(AlbumId, It.IsAny<User>(), UserRole.User))
            .ReturnsAsync(new AlbumResponse(AlbumId, "Trips", OwnerId, "Owner", DateTime.UtcNow, null));
        _files.Setup(repository => repository.GetByIdAsync(FileId)).ReturnsAsync(file);
        _storage.Setup(service => service.GetAsync(file.StoredFileName)).ReturnsAsync(stream);

        var result = await _service.PreviewAsync(AlbumId, FileId, new User { Id = 20 }, UserRole.User);

        Assert.Same(stream, result.Content);
        Assert.Equal(file.OriginalFileName, result.DownloadName);
    }

    [Fact]
    public async Task DownloadAsync_RejectsWhenAlbumPermissionDoesNotAllowDownload()
    {
        _albums.Setup(service => service.CanDownloadAsync(AlbumId, It.IsAny<User>(), UserRole.User))
            .ReturnsAsync(false);

        await Assert.ThrowsAsync<ForbiddenException>(() => _service.DownloadAsync(
            AlbumId, FileId, new User { Id = 20 }, UserRole.User));

        _files.Verify(repository => repository.GetByIdAsync(It.IsAny<long>()), Times.Never);
        _storage.Verify(service => service.GetAsync(It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task DownloadAsync_ReturnsBlobAfterDownloadPermissionCheck()
    {
        var file = ExistingFile();
        var stream = new MemoryStream([1]);
        _albums.Setup(service => service.CanDownloadAsync(AlbumId, It.IsAny<User>(), UserRole.User))
            .ReturnsAsync(true);
        _files.Setup(repository => repository.GetByIdAsync(FileId)).ReturnsAsync(file);
        _storage.Setup(service => service.GetAsync(file.StoredFileName)).ReturnsAsync(stream);

        var result = await _service.DownloadAsync(AlbumId, FileId, new User { Id = 20 }, UserRole.User);

        Assert.Same(stream, result.Content);
        Assert.Equal("text/plain", result.ContentType);
    }

    [Fact]
    public async Task DeleteAsync_DeletesBlobBeforeMetadata()
    {
        var file = ExistingFile();
        _albums.Setup(service => service.GetForUploadAsync(AlbumId, It.IsAny<User>(), UserRole.User))
            .ReturnsAsync(new Album { Id = AlbumId, CreatedBy = OwnerId });
        _files.Setup(repository => repository.GetByIdAsync(FileId)).ReturnsAsync(file);
        _storage.Setup(service => service.DeleteAsync(file.StoredFileName)).Returns(Task.CompletedTask);
        _files.Setup(repository => repository.DeleteAsync(file)).Returns(Task.CompletedTask);

        var cleanupComplete = await _service.DeleteAsync(AlbumId, FileId, new User { Id = OwnerId }, UserRole.User);

        Assert.True(cleanupComplete);
        _storage.Verify(service => service.DeleteAsync(file.StoredFileName), Times.Once);
        _files.Verify(repository => repository.DeleteAsync(file), Times.Once);
    }

    [Fact]
    public async Task DeleteAsync_RemovesMetadataWhenBlobCleanupFails()
    {
        var file = ExistingFile();
        _albums.Setup(service => service.GetForUploadAsync(AlbumId, It.IsAny<User>(), UserRole.User))
            .ReturnsAsync(new Album { Id = AlbumId, CreatedBy = OwnerId });
        _files.Setup(repository => repository.GetByIdAsync(FileId)).ReturnsAsync(file);
        _storage.Setup(service => service.DeleteAsync(file.StoredFileName))
            .ThrowsAsync(new StorageException("storage unavailable", new IOException()));

        var cleanupComplete = await _service.DeleteAsync(
            AlbumId,
            FileId,
            new User { Id = OwnerId },
            UserRole.User);

        Assert.False(cleanupComplete);
        _files.Verify(repository => repository.DeleteAsync(file), Times.Once);
    }

    [Fact]
    public async Task RemoveFromAlbumAsync_DetachesFileAndKeepsBlob()
    {
        var file = ExistingFile();
        _albums.Setup(service => service.GetForUploadAsync(AlbumId, It.IsAny<User>(), UserRole.User))
            .ReturnsAsync(new Album { Id = AlbumId, CreatedBy = OwnerId });
        _files.Setup(repository => repository.GetByIdAsync(FileId)).ReturnsAsync(file);
        _files.Setup(repository => repository.UpdateAsync(file)).Returns(Task.CompletedTask);

        await _service.RemoveFromAlbumAsync(AlbumId, FileId, new User { Id = OwnerId }, UserRole.User);

        Assert.Null(file.AlbumId);
        _files.Verify(repository => repository.UpdateAsync(file), Times.Once);
        _files.Verify(repository => repository.DeleteAsync(It.IsAny<FileMetadata>()), Times.Never);
        _storage.Verify(service => service.DeleteAsync(It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task RemoveFromAlbumAsync_RequiresAlbumManagementPermission()
    {
        _albums.Setup(service => service.GetForUploadAsync(AlbumId, It.IsAny<User>(), UserRole.User))
            .ThrowsAsync(new ForbiddenException("Only the album owner or an Admin can manage this album."));

        await Assert.ThrowsAsync<ForbiddenException>(() =>
            _service.RemoveFromAlbumAsync(AlbumId, FileId, new User { Id = 20 }, UserRole.User));

        _files.Verify(repository => repository.GetByIdAsync(It.IsAny<long>()), Times.Never);
        _files.Verify(repository => repository.UpdateAsync(It.IsAny<FileMetadata>()), Times.Never);
    }

    private static FileMetadata ExistingFile() => new()
    {
        Id = FileId,
        AlbumId = AlbumId,
        UploadedBy = OwnerId,
        StoredFileName = "old.txt",
        OriginalFileName = "previous.txt",
        ContentType = "text/plain",
        FileSize = 5
    };

    private static FormFile TextFile()
    {
        var content = System.Text.Encoding.UTF8.GetBytes("new file!!");
        var file = new FormFile(new MemoryStream(content), 0, content.Length, "file", "replacement.txt")
        {
            Headers = new HeaderDictionary()
        };
        file.ContentType = "text/plain";
        return file;
    }
}
