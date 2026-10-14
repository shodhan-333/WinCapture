using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using WinCapture.Controllers;
using WinCapture.DTOs.Albums;
using WinCapture.DTOs.Auth;
using WinCapture.DTOs.Common;
using WinCapture.DTOs.Files;
using WinCapture.Exceptions;
using WinCapture.Models;
using WinCapture.Services;
using Xunit;

namespace WinCapture.Tests.Controllers;

public sealed class ControllerTests
{
    private static readonly FileResponse FileResponse = new(
        5, "photo.png", "image/png", 12, DateTime.UtcNow, "/api/files/5", "/api/files/5/download");
    private static readonly AlbumResponse AlbumResponse = new(8, "Trip", 3, "Ari", DateTime.UtcNow, null);

    [Fact]
    public async Task File_read_and_mutation_actions_forward_identity_and_return_expected_statuses()
    {
        var service = new Mock<IFileService>();
        service.Setup(x => x.UploadAsync(It.IsAny<IFormFile>(), 3)).ReturnsAsync(FileResponse);
        service.Setup(x => x.GetGalleryPageAsync(3, It.IsAny<PaginationQuery>()))
            .ReturnsAsync(Page(new[] { FileResponse }));
        service.Setup(x => x.GetFavoritesPageAsync(3, UserRole.User, It.IsAny<PaginationQuery>()))
            .ReturnsAsync(Page(new[] { FileResponse }));
        service.Setup(x => x.GetAsync(5, 3, UserRole.User)).ReturnsAsync(FileResponse);
        service.Setup(x => x.DownloadAsync(5, 3, UserRole.User))
            .ReturnsAsync(new FileDownloadResult(new MemoryStream([1]), "image/png", "photo.png"));
        service.Setup(x => x.ReplaceAsync(5, It.IsAny<IFormFile>(), 3, UserRole.User)).ReturnsAsync(FileResponse);

        var controller = WithUser(new FilesController(service.Object), 3, "WinCapture.User");
        var upload = await controller.Upload(Mock.Of<IFormFile>());
        var gallery = await controller.GetGallery(new PaginationQuery());
        var favorites = await controller.GetFavorites(new PaginationQuery());
        var get = await controller.Get(5);
        var download = await controller.Download(5);
        var replace = await controller.Replace(5, Mock.Of<IFormFile>());
        var added = await controller.AddFavorite(5);
        var removed = await controller.RemoveFavorite(5);
        var deleted = await controller.Delete(5);

        Assert.IsType<CreatedResult>(upload.Result);
        Assert.IsType<OkObjectResult>(gallery.Result);
        Assert.IsType<OkObjectResult>(favorites.Result);
        Assert.IsType<OkObjectResult>(get.Result);
        Assert.IsAssignableFrom<FileStreamResult>(download);
        Assert.IsType<OkObjectResult>(replace.Result);
        Assert.IsType<NoContentResult>(added);
        Assert.IsType<NoContentResult>(removed);
        Assert.IsType<NoContentResult>(deleted);
        service.Verify(x => x.AddFavoriteAsync(5, 3, UserRole.User), Times.Once);
        service.Verify(x => x.RemoveFavoriteAsync(5, 3), Times.Once);
        service.Verify(x => x.DeleteAsync(5, 3, UserRole.User), Times.Once);
    }

    [Fact]
    public async Task File_controller_rejects_missing_user_claim_and_missing_role()
    {
        var service = new Mock<IFileService>();
        var missingId = WithUser(new FilesController(service.Object), null, "WinCapture.User");
        await Assert.ThrowsAsync<UnauthorizedException>(() => missingId.GetGallery(new PaginationQuery()));
        var invalidId = WithUser(new FilesController(service.Object), 0, "WinCapture.User");
        await Assert.ThrowsAsync<UnauthorizedException>(() => invalidId.GetGallery(new PaginationQuery()));

        var missingRole = WithUser(new FilesController(service.Object), 3, null);
        await Assert.ThrowsAsync<ForbiddenException>(() => missingRole.GetFavorites(new PaginationQuery()));
        service.VerifyNoOtherCalls();
    }

    [Fact]
    public void Auth_me_returns_current_user_and_falls_back_to_email_claim()
    {
        var controller = WithUser(new AuthController(), 7, "WinCapture.Admin", email: "admin@example.test");

        var result = controller.Me();
        var response = Assert.IsType<OkObjectResult>(result.Result);
        var currentUser = Assert.IsType<CurrentUserResponse>(response.Value);

        Assert.Equal(7, currentUser.UserId);
        Assert.Equal(string.Empty, currentUser.Name);
        Assert.Equal("admin@example.test", currentUser.Email);
        Assert.Equal("Admin", currentUser.Role);
        Assert.Equal("Microsoft Entra ID", currentUser.AuthenticationType);
    }

    [Fact]
    public void Auth_me_rejects_invalid_user_id_and_missing_application_role()
    {
        var missingId = WithUser(new AuthController(), null, "WinCapture.User");
        Assert.Throws<UnauthorizedException>(() => missingId.Me());

        var missingRole = WithUser(new AuthController(), 7, null);
        Assert.Throws<ForbiddenException>(() => missingRole.Me());
    }

    [Fact]
    public async Task Admin_actions_keep_global_and_personal_queries_separate()
    {
        var files = new Mock<IFileService>();
        var albums = new Mock<IAlbumService>();
        files.Setup(x => x.GetAllPageAsync(It.IsAny<PaginationQuery>()))
            .ReturnsAsync(Page(Array.Empty<AdminFileResponse>()));
        files.Setup(x => x.GetAdminFilesByUploaderIdPageAsync(3, It.IsAny<PaginationQuery>()))
            .ReturnsAsync(Page(Array.Empty<AdminFileResponse>()));
        albums.Setup(x => x.GetAllForAdminPageAsync(It.IsAny<PaginationQuery>()))
            .ReturnsAsync(Page(Array.Empty<AlbumResponse>()));
        albums.Setup(x => x.GetOwnedByUserPageAsync(3, It.IsAny<PaginationQuery>()))
            .ReturnsAsync(Page(Array.Empty<AlbumResponse>()));
        var controller = WithUser(new AdminController(files.Object, albums.Object), 3, "WinCapture.Admin");

        Assert.IsType<OkObjectResult>((await controller.GetFiles(new PaginationQuery())).Result);
        Assert.IsType<OkObjectResult>((await controller.GetAlbums(new PaginationQuery())).Result);
        Assert.IsType<OkObjectResult>((await controller.GetMyFiles(new PaginationQuery())).Result);
        Assert.IsType<OkObjectResult>((await controller.GetMyAlbums(new PaginationQuery())).Result);

        files.Verify(x => x.GetAllPageAsync(It.IsAny<PaginationQuery>()), Times.Once);
        albums.Verify(x => x.GetAllForAdminPageAsync(It.IsAny<PaginationQuery>()), Times.Once);
        files.Verify(x => x.GetAdminFilesByUploaderIdPageAsync(3, It.IsAny<PaginationQuery>()), Times.Once);
        albums.Verify(x => x.GetOwnedByUserPageAsync(3, It.IsAny<PaginationQuery>()), Times.Once);
    }

    [Fact]
    public async Task Admin_actions_require_a_valid_mapped_user_id_for_personal_queries()
    {
        var files = new Mock<IFileService>();
        var albums = new Mock<IAlbumService>();
        var controller = WithUser(new AdminController(files.Object, albums.Object), 0, "WinCapture.Admin");

        await Assert.ThrowsAsync<UnauthorizedException>(() => controller.GetMyFiles(new PaginationQuery()));
        await Assert.ThrowsAsync<UnauthorizedException>(() => controller.GetMyAlbums(new PaginationQuery()));

        files.VerifyNoOtherCalls();
        albums.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task File_favorites_forward_admin_role()
    {
        var files = new Mock<IFileService>();
        files.Setup(service => service.GetFavoritesPageAsync(3, UserRole.Admin, It.IsAny<PaginationQuery>()))
            .ReturnsAsync(Page(Array.Empty<FileResponse>()));
        var controller = WithUser(new FilesController(files.Object), 3, "WinCapture.Admin");

        var result = await controller.GetFavorites(new PaginationQuery());

        Assert.IsType<OkObjectResult>(result.Result);
        files.Verify(service => service.GetFavoritesPageAsync(3, UserRole.Admin, It.IsAny<PaginationQuery>()), Times.Once);
    }

    [Fact]
    public async Task Album_actions_build_user_context_and_delegate_permissions()
    {
        var albums = new Mock<IAlbumService>();
        var albumFiles = new Mock<IAlbumFileService>();
        albums.Setup(x => x.CreateAsync(It.IsAny<CreateAlbumRequest>(), It.Is<User>(u =>
            u.Id == 3 && u.Name == "Ari" && u.Email == "ari@example.test" && u.Role == UserRole.User)))
            .ReturnsAsync(AlbumResponse);
        albums.Setup(x => x.GetAccessiblePageAsync(It.IsAny<User>(), It.IsAny<PaginationQuery>()))
            .ReturnsAsync(Page(new[] { AlbumResponse }));
        albums.Setup(x => x.GetOwnedByUserPageAsync(3, It.IsAny<PaginationQuery>()))
            .ReturnsAsync(Page(new[] { AlbumResponse }));
        albums.Setup(x => x.GetAsync(8, It.IsAny<User>(), UserRole.User)).ReturnsAsync(AlbumResponse);
        albums.Setup(x => x.UpdateAsync(8, It.IsAny<UpdateAlbumRequest>(), It.IsAny<User>(), UserRole.User))
            .ReturnsAsync(AlbumResponse);
        albums.Setup(x => x.GetMembersAsync(8, It.IsAny<User>(), UserRole.User)).ReturnsAsync(Array.Empty<AlbumMemberResponse>());
        albums.Setup(x => x.DeleteAsync(8, It.IsAny<User>(), UserRole.User)).Returns(Task.CompletedTask);
        albums.Setup(x => x.AddMemberAsync(8, It.IsAny<AddAlbumMemberRequest>(), It.IsAny<User>(), UserRole.User)).Returns(Task.CompletedTask);
        albums.Setup(x => x.UpdateMemberAsync(8, 4, It.IsAny<UpdateAlbumMemberRequest>(), It.IsAny<User>(), UserRole.User)).Returns(Task.CompletedTask);
        albums.Setup(x => x.RemoveMemberAsync(8, 4, It.IsAny<User>(), UserRole.User)).Returns(Task.CompletedTask);
        albumFiles.Setup(x => x.UploadAsync(8, It.IsAny<IFormFile>(), It.IsAny<User>(), UserRole.User)).ReturnsAsync(FileResponse);
        albumFiles.Setup(x => x.ReplaceAsync(8, 5, It.IsAny<IFormFile>(), It.IsAny<User>(), UserRole.User)).ReturnsAsync(FileResponse);
        albumFiles.Setup(x => x.GetPageAsync(8, It.IsAny<User>(), UserRole.User, It.IsAny<PaginationQuery>()))
            .ReturnsAsync(Page(new[] { FileResponse }));
        albumFiles.Setup(x => x.GetOneAsync(8, 5, It.IsAny<User>(), UserRole.User)).ReturnsAsync(FileResponse);
        albumFiles.Setup(x => x.PreviewAsync(8, 5, It.IsAny<User>(), UserRole.User))
            .ReturnsAsync(new FileDownloadResult(new MemoryStream([1]), "image/png", "photo.png"));
        albumFiles.Setup(x => x.DownloadAsync(8, 5, It.IsAny<User>(), UserRole.User))
            .ReturnsAsync(new FileDownloadResult(new MemoryStream([1]), "image/png", "photo.png"));
        albumFiles.Setup(x => x.DeleteAsync(8, 5, It.IsAny<User>(), UserRole.User)).Returns(Task.CompletedTask);

        var controller = WithUser(new AlbumsController(albums.Object, albumFiles.Object), 3, "WinCapture.User", "Ari", "ari@example.test");

        Assert.IsType<CreatedResult>((await controller.Create(new CreateAlbumRequest("Trip"))).Result);
        Assert.IsType<OkObjectResult>((await controller.GetAll(new PaginationQuery())).Result);
        Assert.IsType<OkObjectResult>((await controller.GetOwnedByCurrentUser(new PaginationQuery())).Result);
        Assert.IsType<OkObjectResult>((await controller.Get(8)).Result);
        Assert.IsType<OkObjectResult>((await controller.Update(8, new UpdateAlbumRequest("New"))).Result);
        Assert.IsType<NoContentResult>(await controller.Delete(8));
        Assert.IsType<CreatedResult>((await controller.UploadFile(8, Mock.Of<IFormFile>())).Result);
        Assert.IsType<OkObjectResult>((await controller.ReplaceFile(8, 5, Mock.Of<IFormFile>())).Result);
        Assert.IsType<OkObjectResult>((await controller.GetFiles(8, new PaginationQuery())).Result);
        Assert.IsType<OkObjectResult>((await controller.GetFile(8, 5)).Result);
        Assert.IsAssignableFrom<FileStreamResult>(await controller.PreviewFile(8, 5));
        Assert.IsAssignableFrom<FileStreamResult>(await controller.DownloadFile(8, 5));
        Assert.IsType<NoContentResult>(await controller.DeleteFile(8, 5));
        Assert.IsType<OkObjectResult>((await controller.GetMembers(8)).Result);
        Assert.IsType<NoContentResult>(await controller.AddMember(8, new AddAlbumMemberRequest("x@test", true, false)));
        Assert.IsType<NoContentResult>(await controller.UpdateMember(8, 4, new UpdateAlbumMemberRequest(true, true)));
        Assert.IsType<NoContentResult>(await controller.RemoveMember(8, 4));

        albums.Verify(x => x.CreateAsync(It.IsAny<CreateAlbumRequest>(), It.Is<User>(u => u.Id == 3)), Times.Once);
        albums.Verify(x => x.RemoveMemberAsync(8, 4, It.IsAny<User>(), UserRole.User), Times.Once);
        albumFiles.Verify(x => x.ReplaceAsync(8, 5, It.IsAny<IFormFile>(), It.IsAny<User>(), UserRole.User), Times.Once);
    }

    [Fact]
    public async Task Album_controller_rejects_missing_identity_and_role_claims()
    {
        var albums = new Mock<IAlbumService>();
        var files = new Mock<IAlbumFileService>();
        var missingId = WithUser(new AlbumsController(albums.Object, files.Object), null, "WinCapture.User");
        await Assert.ThrowsAsync<UnauthorizedException>(() => missingId.GetOwnedByCurrentUser(new PaginationQuery()));

        var missingRole = WithUser(new AlbumsController(albums.Object, files.Object), 3, null);
        await Assert.ThrowsAsync<ForbiddenException>(() => missingRole.GetAll(new PaginationQuery()));

        albums.VerifyNoOtherCalls();
        files.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Album_controller_defaults_optional_identity_claims_and_forwards_admin_role()
    {
        var albums = new Mock<IAlbumService>();
        albums.Setup(service => service.GetAccessiblePageAsync(It.Is<User>(user =>
                user.Id == 3 &&
                user.Name == string.Empty &&
                user.Email == string.Empty &&
                user.Role == UserRole.Admin), It.IsAny<PaginationQuery>()))
            .ReturnsAsync(Page(Array.Empty<AlbumResponse>()));
        var controller = WithUser(new AlbumsController(albums.Object, Mock.Of<IAlbumFileService>()), 3, "WinCapture.Admin");

        var result = await controller.GetAll(new PaginationQuery());

        Assert.IsType<OkObjectResult>(result.Result);
        albums.Verify(service => service.GetAccessiblePageAsync(It.Is<User>(user =>
            user.Id == 3 && user.Role == UserRole.Admin), It.IsAny<PaginationQuery>()), Times.Once);
    }

    private static PagedResponse<T> Page<T>(IReadOnlyList<T> items)
    {
        return new PagedResponse<T>(items, items.Count, 1, 10, Math.Max(1, items.Count));
    }

    private static T WithUser<T>(T controller, int? userId, string? role, string? name = null, string? email = null)
        where T : ControllerBase
    {
        var claims = new List<Claim>();
        if (userId is not null)
        {
            claims.Add(new Claim("wincapture_user_id", userId.Value.ToString()));
        }

        if (role is not null)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        if (name is not null)
        {
            claims.Add(new Claim("name", name));
        }

        if (email is not null)
        {
            claims.Add(new Claim("email", email));
        }

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(claims, "test"))
            }
        };
        return controller;
    }
}
