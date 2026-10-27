using Moq;
using WinCapture.DTOs.Albums;
using WinCapture.DTOs.Common;
using WinCapture.Exceptions;
using WinCapture.Models;
using WinCapture.Repositories;
using WinCapture.Services;
using Xunit;

namespace WinCapture.Tests;

public sealed class AlbumServiceTests
{
    private const int OwnerId = 4;
    private readonly Mock<IAlbumRepository> _albums = new();
    private readonly Mock<IUserRepository> _users = new();
    private readonly Mock<IFileRepository> _files = new();
    private readonly Mock<IStorageService> _storage = new();
    private readonly AlbumService _service;

    public AlbumServiceTests()
    {
        _service = new AlbumService(
            _albums.Object,
            _users.Object,
            _files.Object,
            _storage.Object,
            Mock.Of<Microsoft.Extensions.Logging.ILogger<AlbumService>>());
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public async Task CreateAsync_RejectsBlankName(string name)
    {
        await Assert.ThrowsAsync<BadRequestException>(
            () => _service.CreateAsync(new CreateAlbumRequest(name), Owner()));

        _albums.Verify(repository => repository.AddAsync(It.IsAny<Album>()), Times.Never);
    }

    [Fact]
    public async Task CreateAsync_RejectsNameLongerThanDatabaseLimit()
    {
        await Assert.ThrowsAsync<BadRequestException>(() => _service.CreateAsync(
            new CreateAlbumRequest(new string('a', 201)),
            Owner()));

        _albums.Verify(repository => repository.AddAsync(It.IsAny<Album>()), Times.Never);
    }

    [Fact]
    public async Task CreateAsync_TrimsNameAndAssociatesOwner()
    {
        _albums.Setup(repository => repository.AddAsync(It.IsAny<Album>()))
            .Returns(Task.CompletedTask);

        var result = await _service.CreateAsync(new CreateAlbumRequest("  Trips  "), Owner());

        Assert.Equal("Trips", result.AlbumName);
        Assert.Equal(OwnerId, result.OwnerId);
        Assert.Equal("Owner", result.OwnerName);
    }

    [Fact]
    public async Task GetAsync_RejectsMemberWithoutViewPermission()
    {
        var album = SharedAlbum();
        _albums.Setup(repository => repository.GetByIdAsync(album.Id)).ReturnsAsync(album);
        _albums.Setup(repository => repository.GetAccessAsync(album.Id, 15))
            .ReturnsAsync(new AlbumAccess { CanView = false });

        await Assert.ThrowsAsync<ForbiddenException>(
            () => _service.GetAsync(album.Id, new User { Id = 15 }, UserRole.User));
    }

    [Fact]
    public async Task GetAsync_AllowsMemberWithViewPermission()
    {
        var album = SharedAlbum();
        _albums.Setup(repository => repository.GetByIdAsync(album.Id)).ReturnsAsync(album);
        _albums.Setup(repository => repository.GetAccessAsync(album.Id, 15))
            .ReturnsAsync(new AlbumAccess { CanView = true, CanDownload = false });

        var result = await _service.GetAsync(album.Id, new User { Id = 15 }, UserRole.User);

        Assert.Equal(album.Id, result.Id);
    }

    [Fact]
    public async Task GetAsync_AllowsAdminWithoutMemberAccess()
    {
        var album = SharedAlbum();
        _albums.Setup(repository => repository.GetByIdAsync(album.Id)).ReturnsAsync(album);

        var result = await _service.GetAsync(album.Id, new User { Id = 99 }, UserRole.Admin);

        Assert.Equal(album.Id, result.Id);
        _albums.Verify(repository => repository.GetAccessAsync(It.IsAny<long>(), It.IsAny<int>()), Times.Never);
    }

    [Fact]
    public async Task GetAsync_ThrowsWhenAlbumDoesNotExist()
    {
        _albums.Setup(repository => repository.GetByIdAsync(404)).ReturnsAsync((Album?)null);

        await Assert.ThrowsAsync<NotFoundException>(
            () => _service.GetAsync(404, Owner(), UserRole.User));
    }

    [Fact]
    public async Task CanDownloadAsync_UsesDownloadPermissionSeparatelyFromViewPermission()
    {
        var album = SharedAlbum();
        _albums.Setup(repository => repository.GetByIdAsync(album.Id)).ReturnsAsync(album);
        _albums.Setup(repository => repository.GetAccessAsync(album.Id, 15))
            .ReturnsAsync(new AlbumAccess { CanView = true, CanDownload = false });

        var canDownload = await _service.CanDownloadAsync(
            album.Id,
            new User { Id = 15 },
            UserRole.User);

        Assert.False(canDownload);
    }

    [Fact]
    public async Task CanDownloadAsync_UsesSharedDownloadPermission()
    {
        var album = SharedAlbum();
        _albums.Setup(repository => repository.GetByIdAsync(album.Id)).ReturnsAsync(album);
        _albums.Setup(repository => repository.GetAccessAsync(album.Id, 15))
            .ReturnsAsync(new AlbumAccess { CanView = true, CanDownload = true });

        Assert.True(await _service.CanDownloadAsync(
            album.Id,
            new User { Id = 15 },
            UserRole.User));
    }

    [Fact]
    public async Task CanDownloadAsync_ThrowsWhenAlbumDoesNotExist()
    {
        _albums.Setup(repository => repository.GetByIdAsync(404)).ReturnsAsync((Album?)null);

        await Assert.ThrowsAsync<NotFoundException>(() => _service.CanDownloadAsync(
            404,
            new User { Id = 15 },
            UserRole.User));
    }

    [Fact]
    public async Task DeleteAsync_RemovesAlbumMetadataAndLogsCleanupFailure()
    {
        var album = OwnedAlbum();
        var albumFile = new FileMetadata { StoredFileName = "blob.txt" };
        _albums.Setup(repository => repository.GetByIdAsync(album.Id)).ReturnsAsync(album);
        _files.Setup(repository => repository.GetByAlbumIdAsync(album.Id))
            .ReturnsAsync(new[] { albumFile });
        _storage.Setup(storage => storage.DeleteAsync("blob.txt"))
            .ThrowsAsync(new StorageException("Storage failure.", new IOException()));

        _albums.Setup(repository => repository.DeleteAsync(album)).Returns(Task.CompletedTask);
        await _service.DeleteAsync(album.Id, Owner(), UserRole.User);

        _albums.Verify(repository => repository.DeleteAsync(album), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_TrimsNameAndRecordsEditor()
    {
        var album = OwnedAlbum();
        _albums.Setup(repository => repository.GetByIdAsync(album.Id)).ReturnsAsync(album);
        _albums.Setup(repository => repository.UpdateAsync(album)).Returns(Task.CompletedTask);

        var result = await _service.UpdateAsync(album.Id, new UpdateAlbumRequest("  Summer  "), Owner(), UserRole.User);

        Assert.Equal("Summer", result.AlbumName);
        Assert.Equal(OwnerId, album.UpdatedBy);
        Assert.NotNull(album.UpdatedAt);
        _albums.Verify(repository => repository.UpdateAsync(album), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_RejectsSharedViewerEvenWhenTheyCanView()
    {
        var album = SharedAlbum();
        _albums.Setup(repository => repository.GetByIdAsync(album.Id)).ReturnsAsync(album);
        _albums.Setup(repository => repository.GetAccessAsync(album.Id, 15))
            .ReturnsAsync(new AlbumAccess { CanView = true });

        await Assert.ThrowsAsync<ForbiddenException>(() => _service.UpdateAsync(
            album.Id, new UpdateAlbumRequest("Changed"), new User { Id = 15 }, UserRole.User));

        _albums.Verify(repository => repository.UpdateAsync(It.IsAny<Album>()), Times.Never);
    }

    [Fact]
    public async Task AddMemberAsync_NormalizesEmailAndStoresRequestedPermissions()
    {
        var album = OwnedAlbum();
        var member = new User { Id = 25, Email = "member@example.com", Name = "Member" };
        _albums.Setup(repository => repository.GetByIdAsync(album.Id)).ReturnsAsync(album);
        _albums.Setup(repository => repository.GetAccessAsync(album.Id, member.Id)).ReturnsAsync((AlbumAccess?)null);
        _albums.Setup(repository => repository.AddAccessAsync(It.IsAny<AlbumAccess>())).Returns(Task.CompletedTask);
        _users.Setup(repository => repository.GetByEmailAsync(member.Email)).ReturnsAsync(member);

        await _service.AddMemberAsync(
            album.Id,
            new AddAlbumMemberRequest(" MEMBER@EXAMPLE.COM ", true, true),
            Owner(),
            UserRole.User);

        _users.Verify(repository => repository.GetByEmailAsync("member@example.com"), Times.Once);
        _albums.Verify(repository => repository.AddAccessAsync(It.Is<AlbumAccess>(access =>
            access.AlbumId == album.Id && access.UserId == member.Id && access.CanView &&
            access.CanDownload && access.GrantedBy == OwnerId)), Times.Once);
    }

    [Fact]
    public async Task AddMemberAsync_RejectsDownloadWithoutViewPermission()
    {
        var album = OwnedAlbum();
        _albums.Setup(repository => repository.GetByIdAsync(album.Id)).ReturnsAsync(album);

        await Assert.ThrowsAsync<BadRequestException>(() => _service.AddMemberAsync(
            album.Id,
            new AddAlbumMemberRequest("member@example.com", false, true),
            Owner(),
            UserRole.User));

        _users.Verify(repository => repository.GetByEmailAsync(It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task AddMemberAsync_RejectsUnknownAccount()
    {
        var album = OwnedAlbum();
        _albums.Setup(repository => repository.GetByIdAsync(album.Id)).ReturnsAsync(album);
        _users.Setup(repository => repository.GetByEmailAsync("new@example.com"))
            .ReturnsAsync((User?)null);

        await Assert.ThrowsAsync<NotFoundException>(() => _service.AddMemberAsync(
            album.Id,
            new AddAlbumMemberRequest("new@example.com", true, false),
            Owner(),
            UserRole.User));

        _albums.Verify(repository => repository.AddAccessAsync(It.IsAny<AlbumAccess>()), Times.Never);
    }

    [Fact]
    public async Task AddMemberAsync_RejectsAddingOwnerAsMember()
    {
        var album = OwnedAlbum();
        _albums.Setup(repository => repository.GetByIdAsync(album.Id)).ReturnsAsync(album);
        _users.Setup(repository => repository.GetByEmailAsync(Owner().Email)).ReturnsAsync(Owner());

        await Assert.ThrowsAsync<BadRequestException>(() => _service.AddMemberAsync(
            album.Id,
            new AddAlbumMemberRequest(Owner().Email, true, false),
            Owner(),
            UserRole.User));

        _albums.Verify(repository => repository.AddAccessAsync(It.IsAny<AlbumAccess>()), Times.Never);
    }

    [Fact]
    public async Task AddMemberAsync_RejectsExistingMember()
    {
        var album = OwnedAlbum();
        var member = new User { Id = 25, Email = "member@example.com" };
        _albums.Setup(repository => repository.GetByIdAsync(album.Id)).ReturnsAsync(album);
        _albums.Setup(repository => repository.GetAccessAsync(album.Id, member.Id))
            .ReturnsAsync(new AlbumAccess());
        _users.Setup(repository => repository.GetByEmailAsync(member.Email)).ReturnsAsync(member);

        await Assert.ThrowsAsync<BadRequestException>(() => _service.AddMemberAsync(
            album.Id,
            new AddAlbumMemberRequest(member.Email, true, false),
            Owner(),
            UserRole.User));

        _albums.Verify(repository => repository.AddAccessAsync(It.IsAny<AlbumAccess>()), Times.Never);
    }

    [Fact]
    public async Task UpdateMemberAsync_UpdatesViewAndDownloadPermissions()
    {
        var album = OwnedAlbum();
        var access = new AlbumAccess { AlbumId = album.Id, UserId = 25, CanView = true, CanDownload = false };
        _albums.Setup(repository => repository.GetByIdAsync(album.Id)).ReturnsAsync(album);
        _albums.Setup(repository => repository.GetAccessAsync(album.Id, access.UserId)).ReturnsAsync(access);
        _albums.Setup(repository => repository.UpdateAccessAsync(access)).Returns(Task.CompletedTask);

        await _service.UpdateMemberAsync(
            album.Id, access.UserId, new UpdateAlbumMemberRequest(true, true), Owner(), UserRole.User);

        Assert.True(access.CanView);
        Assert.True(access.CanDownload);
        _albums.Verify(repository => repository.UpdateAccessAsync(access), Times.Once);
    }

    [Fact]
    public async Task UpdateMemberAsync_RejectsDownloadWithoutViewPermission()
    {
        var album = OwnedAlbum();
        _albums.Setup(repository => repository.GetByIdAsync(album.Id)).ReturnsAsync(album);

        await Assert.ThrowsAsync<BadRequestException>(() => _service.UpdateMemberAsync(
            album.Id,
            25,
            new UpdateAlbumMemberRequest(false, true),
            Owner(),
            UserRole.User));

        _albums.Verify(repository => repository.GetAccessAsync(It.IsAny<long>(), It.IsAny<int>()), Times.Never);
    }

    [Fact]
    public async Task UpdateMemberAsync_ThrowsWhenMemberAccessDoesNotExist()
    {
        var album = OwnedAlbum();
        _albums.Setup(repository => repository.GetByIdAsync(album.Id)).ReturnsAsync(album);
        _albums.Setup(repository => repository.GetAccessAsync(album.Id, 25))
            .ReturnsAsync((AlbumAccess?)null);

        await Assert.ThrowsAsync<NotFoundException>(() => _service.UpdateMemberAsync(
            album.Id,
            25,
            new UpdateAlbumMemberRequest(true, false),
            Owner(),
            UserRole.User));
    }

    [Fact]
    public async Task RemoveMemberAsync_DeletesGrantedAccess()
    {
        var album = OwnedAlbum();
        var access = new AlbumAccess { AlbumId = album.Id, UserId = 25 };
        _albums.Setup(repository => repository.GetByIdAsync(album.Id)).ReturnsAsync(album);
        _albums.Setup(repository => repository.GetAccessAsync(album.Id, access.UserId)).ReturnsAsync(access);
        _albums.Setup(repository => repository.DeleteAccessAsync(access)).Returns(Task.CompletedTask);

        await _service.RemoveMemberAsync(album.Id, access.UserId, Owner(), UserRole.User);

        _albums.Verify(repository => repository.DeleteAccessAsync(access), Times.Once);
    }

    [Fact]
    public async Task RemoveMemberAsync_ThrowsWhenMemberAccessDoesNotExist()
    {
        var album = OwnedAlbum();
        _albums.Setup(repository => repository.GetByIdAsync(album.Id)).ReturnsAsync(album);
        _albums.Setup(repository => repository.GetAccessAsync(album.Id, 25))
            .ReturnsAsync((AlbumAccess?)null);

        await Assert.ThrowsAsync<NotFoundException>(() => _service.RemoveMemberAsync(
            album.Id,
            25,
            Owner(),
            UserRole.User));

        _albums.Verify(repository => repository.DeleteAccessAsync(It.IsAny<AlbumAccess>()), Times.Never);
    }

    [Fact]
    public async Task GetMembersAsync_MapsMemberPermissionsAndIdentity()
    {
        var album = OwnedAlbum();
        var access = new AlbumAccess
        {
            AlbumId = album.Id,
            UserId = 25,
            User = new User { Id = 25, Name = "Member", Email = "member@example.com" },
            CanView = true,
            CanDownload = true
        };
        _albums.Setup(repository => repository.GetByIdAsync(album.Id)).ReturnsAsync(album);
        _albums.Setup(repository => repository.GetAccessListAsync(album.Id)).ReturnsAsync(new[] { access });

        var result = await _service.GetMembersAsync(album.Id, Owner(), UserRole.User);

        var member = Assert.Single(result);
        Assert.Equal("Member", member.Name);
        Assert.Equal("member@example.com", member.Email);
        Assert.True(member.CanView);
        Assert.True(member.CanDownload);
    }

    [Fact]
    public async Task CanDownloadAsync_AllowsAlbumOwnerAndAdmin()
    {
        var album = OwnedAlbum();
        _albums.Setup(repository => repository.GetByIdAsync(album.Id)).ReturnsAsync(album);

        Assert.True(await _service.CanDownloadAsync(album.Id, Owner(), UserRole.User));
        Assert.True(await _service.CanDownloadAsync(album.Id, new User { Id = 99 }, UserRole.Admin));
        _albums.Verify(repository => repository.GetAccessAsync(It.IsAny<long>(), It.IsAny<int>()), Times.Never);
    }

    [Fact]
    public async Task DeleteAsync_RemovesMetadataThenAttemptsAllBlobCleanups()
    {
        var album = OwnedAlbum();
        _albums.Setup(repository => repository.GetByIdAsync(album.Id)).ReturnsAsync(album);
        _files.Setup(repository => repository.GetByAlbumIdAsync(album.Id))
            .ReturnsAsync(new[] { new FileMetadata { StoredFileName = "first" }, new FileMetadata { StoredFileName = "second" } });
        _storage.Setup(storage => storage.DeleteAsync(It.IsAny<string>())).Returns(Task.CompletedTask);
        _albums.Setup(repository => repository.DeleteAsync(album)).Returns(Task.CompletedTask);

        await _service.DeleteAsync(album.Id, Owner(), UserRole.User);

        _storage.Verify(storage => storage.DeleteAsync("first"), Times.Once);
        _storage.Verify(storage => storage.DeleteAsync("second"), Times.Once);
        _albums.Verify(repository => repository.DeleteAsync(album), Times.Once);
    }

    [Fact]
    public async Task Album_list_methods_MapRepositoryResultsAndPreservePaging()
    {
        var album = OwnedAlbum();
        var page = new PagedResponse<Album>([album], 3, 2, 1, 3);
        _albums.Setup(repository => repository.GetAccessibleByUserIdAsync(OwnerId)).ReturnsAsync([album]);
        _albums.Setup(repository => repository.GetPagedAccessibleByUserIdAsync(OwnerId, It.IsAny<PaginationQuery>()))
            .ReturnsAsync(page);
        _albums.Setup(repository => repository.GetOwnedByUserIdAsync(OwnerId)).ReturnsAsync([album]);
        _albums.Setup(repository => repository.GetPagedOwnedByUserIdAsync(OwnerId, It.IsAny<PaginationQuery>()))
            .ReturnsAsync(page);
        _albums.Setup(repository => repository.GetPagedSharedWithUserIdAsync(OwnerId, It.IsAny<PaginationQuery>()))
            .ReturnsAsync(page);
        _albums.Setup(repository => repository.GetAllAsync()).ReturnsAsync([album]);
        _albums.Setup(repository => repository.GetPagedAllAsync(It.IsAny<PaginationQuery>())).ReturnsAsync(page);

        var accessible = await _service.GetAccessibleAsync(Owner());
        var accessiblePage = await _service.GetAccessiblePageAsync(Owner(), new PaginationQuery());
        var owned = await _service.GetOwnedByUserAsync(OwnerId);
        var ownedPage = await _service.GetOwnedByUserPageAsync(OwnerId, new PaginationQuery());
        var sharedPage = await _service.GetSharedWithUserPageAsync(OwnerId, new PaginationQuery());
        var all = await _service.GetAllForAdminAsync();
        var allPage = await _service.GetAllForAdminPageAsync(new PaginationQuery());

        Assert.Equal("Owned", Assert.Single(accessible).AlbumName);
        Assert.Equal("Owner", Assert.Single(accessiblePage.Items).OwnerName);
        Assert.Equal("Owned", Assert.Single(owned).AlbumName);
        Assert.Equal(page.TotalItems, ownedPage.TotalItems);
        Assert.Equal(page.Page, sharedPage.Page);
        Assert.Equal("Owner", Assert.Single(all).OwnerName);
        Assert.Equal(page.PageSize, allPage.PageSize);
    }

    [Fact]
    public async Task GetForUploadAsync_AllowsAdminAndRejectsSharedViewerWithoutManagementAccess()
    {
        var album = SharedAlbum();
        _albums.Setup(repository => repository.GetByIdAsync(album.Id)).ReturnsAsync(album);
        _albums.Setup(repository => repository.GetAccessAsync(album.Id, 15))
            .ReturnsAsync(new AlbumAccess { CanView = true });

        Assert.Same(album, await _service.GetForUploadAsync(album.Id, new User { Id = 99 }, UserRole.Admin));
        await Assert.ThrowsAsync<ForbiddenException>(() => _service.GetForUploadAsync(
            album.Id, new User { Id = 15 }, UserRole.User));
    }

    [Fact]
    public async Task GetAsync_RejectsMemberWithoutAnAccessEntry()
    {
        var album = SharedAlbum();
        _albums.Setup(repository => repository.GetByIdAsync(album.Id)).ReturnsAsync(album);
        _albums.Setup(repository => repository.GetAccessAsync(album.Id, 15)).ReturnsAsync((AlbumAccess?)null);

        await Assert.ThrowsAsync<ForbiddenException>(() => _service.GetAsync(
            album.Id, new User { Id = 15 }, UserRole.User));
    }

    [Fact]
    public async Task AddMemberAsync_AllowsSharingWithoutPermissions()
    {
        var album = OwnedAlbum();
        var member = new User { Id = 25, Email = "member@example.com" };
        _albums.Setup(repository => repository.GetByIdAsync(album.Id)).ReturnsAsync(album);
        _albums.Setup(repository => repository.GetAccessAsync(album.Id, member.Id)).ReturnsAsync((AlbumAccess?)null);
        _albums.Setup(repository => repository.AddAccessAsync(It.IsAny<AlbumAccess>())).Returns(Task.CompletedTask);
        _users.Setup(repository => repository.GetByEmailAsync(member.Email)).ReturnsAsync(member);

        await _service.AddMemberAsync(album.Id,
            new AddAlbumMemberRequest(member.Email, false, false), Owner(), UserRole.User);

        _albums.Verify(repository => repository.AddAccessAsync(It.Is<AlbumAccess>(access =>
            !access.CanView && !access.CanDownload)), Times.Once);
    }

    [Fact]
    public async Task UpdateMemberAsync_CanKeepViewAccessWithoutDownloadPermission()
    {
        var album = OwnedAlbum();
        var access = new AlbumAccess { AlbumId = album.Id, UserId = 25, CanView = false, CanDownload = true };
        _albums.Setup(repository => repository.GetByIdAsync(album.Id)).ReturnsAsync(album);
        _albums.Setup(repository => repository.GetAccessAsync(album.Id, access.UserId)).ReturnsAsync(access);
        _albums.Setup(repository => repository.UpdateAccessAsync(access)).Returns(Task.CompletedTask);

        await _service.UpdateMemberAsync(album.Id, access.UserId,
            new UpdateAlbumMemberRequest(true, false), Owner(), UserRole.User);

        Assert.True(access.CanView);
        Assert.False(access.CanDownload);
    }

    [Fact]
    public async Task CanDownloadAsync_ReturnsFalseWhenMemberHasNoAccessEntry()
    {
        var album = SharedAlbum();
        _albums.Setup(repository => repository.GetByIdAsync(album.Id)).ReturnsAsync(album);
        _albums.Setup(repository => repository.GetAccessAsync(album.Id, 15)).ReturnsAsync((AlbumAccess?)null);

        Assert.False(await _service.CanDownloadAsync(album.Id, new User { Id = 15 }, UserRole.User));
    }

    private static User Owner() => new()
    {
        Id = OwnerId,
        Name = "Owner",
        Email = "owner@example.com"
    };

    private static Album OwnedAlbum() => new()
    {
        Id = 11,
        CreatedBy = OwnerId,
        AlbumName = "Owned",
        Owner = Owner()
    };

    private static Album SharedAlbum() => new()
    {
        Id = 22,
        CreatedBy = OwnerId,
        AlbumName = "Shared",
        Owner = Owner()
    };
}
