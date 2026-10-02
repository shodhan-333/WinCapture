using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WinCapture.DTOs.Albums;
using WinCapture.DTOs.Files;
using WinCapture.Exceptions;
using WinCapture.Models;
using WinCapture.Services;
using WinCapture.Validators;

namespace WinCapture.Controllers;

[ApiController]
[Route("api/albums")]
[Authorize]
public sealed class AlbumsController(
    IAlbumService albumService,
    IAlbumFileService albumFileService) : ControllerBase
{
    private const long RequestOverhead =
        1024L * 1024L;

    private const long MaximumRequestSize =
        FileValidator.MaximumFileSize +
        RequestOverhead;

    private int UserId
    {
        get
        {
            var value =
                User.FindFirst("wincapture_user_id")?.Value;

            if (!int.TryParse(
                    value,
                    out var userId) ||
                userId <= 0)
            {
                throw new UnauthorizedException(
                    "The authenticated user ID is missing or invalid.");
            }

            return userId;
        }
    }

    private UserRole CurrentUserRole
    {
        get
        {
            if (User.IsInRole("WinCapture.Admin"))
            {
                return UserRole.Admin;
            }

            if (User.IsInRole("WinCapture.User"))
            {
                return UserRole.User;
            }

            throw new ForbiddenException(
                "The authenticated user role is missing or invalid.");
        }
    }

    private User CurrentUser =>
        new()
        {
            Id = UserId,

            Name =
                User.FindFirst("name")?.Value
                ?? string.Empty,

            Email =
                User.FindFirst("email")?.Value
                ?? User.FindFirst("preferred_username")?.Value
                ?? string.Empty,

            Role = CurrentUserRole
        };

    [HttpPost]
    [Authorize(Roles = "WinCapture.User,WinCapture.Admin")]
    public async Task<ActionResult<AlbumResponse>> Create(
        CreateAlbumRequest request)
    {
        var user = CurrentUser;

        var response =
            await albumService.CreateAsync(
                request,
                user);

        return Created(
            $"/api/albums/{response.Id}",
            response);
    }

    [HttpGet]
    [Authorize(Roles = "WinCapture.User,WinCapture.Admin")]
    public async Task<ActionResult<
        IReadOnlyList<AlbumResponse>>>
        GetAll()
    {
        var user = CurrentUser;

        return Ok(
            await albumService.GetAccessibleAsync(
                user,
                CurrentUserRole));
    }

    [HttpGet("{id:long}")]
    [Authorize(Roles = "WinCapture.User,WinCapture.Admin")]
    public async Task<ActionResult<AlbumResponse>> Get(
        long id)
    {
        var user = CurrentUser;

        return Ok(
            await albumService.GetAsync(
                id,
                user,
                CurrentUserRole));
    }

    [HttpPut("{id:long}")]
    [Authorize(Roles = "WinCapture.User,WinCapture.Admin")]
    public async Task<ActionResult<AlbumResponse>> Update(
        long id,
        UpdateAlbumRequest request)
    {
        var user = CurrentUser;

        return Ok(
            await albumService.UpdateAsync(
                id,
                request,
                user,
                CurrentUserRole));
    }

    [HttpDelete("{id:long}")]
    [Authorize(Roles = "WinCapture.User,WinCapture.Admin")]
    public async Task<IActionResult> Delete(
        long id)
    {
        var user = CurrentUser;

        await albumService.DeleteAsync(
            id,
            user,
            CurrentUserRole);

        return NoContent();
    }

    [HttpPost("{id:long}/files")]
    [Authorize(Roles = "WinCapture.User,WinCapture.Admin")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(MaximumRequestSize)]
    [RequestFormLimits(
        MultipartBodyLengthLimit = MaximumRequestSize)]
    public async Task<ActionResult<FileResponse>> UploadFile(
        long id,
        IFormFile file)
    {
        var user = CurrentUser;

        var response =
            await albumFileService.UploadAsync(
                id,
                file,
                user,
                CurrentUserRole);

        return Created(
            response.Url,
            response);
    }

    [HttpGet("{id:long}/files")]
    [Authorize(Roles = "WinCapture.User,WinCapture.Admin")]
    public async Task<ActionResult<
        IReadOnlyList<FileResponse>>>
        GetFiles(long id)
    {
        var user = CurrentUser;

        return Ok(
            await albumFileService.GetAsync(
                id,
                user,
                CurrentUserRole));
    }

    [HttpGet("{id:long}/files/{fileId:long}")]
    [Authorize(Roles = "WinCapture.User,WinCapture.Admin")]
    public async Task<ActionResult<FileResponse>> GetFile(
        long id,
        long fileId)
    {
        var user = CurrentUser;

        return Ok(
            await albumFileService.GetOneAsync(
                id,
                fileId,
                user,
                CurrentUserRole));
    }

    [HttpGet(
        "{id:long}/files/{fileId:long}/download")]
    [Authorize(Roles = "WinCapture.User,WinCapture.Admin")]
    public async Task<IActionResult> DownloadFile(
        long id,
        long fileId)
    {
        var user = CurrentUser;

        var result =
            await albumFileService.DownloadAsync(
                id,
                fileId,
                user,
                CurrentUserRole);

        return File(
            result.Content,
            result.ContentType,
            result.DownloadName);
    }

    [HttpDelete("{id:long}/files/{fileId:long}")]
    [Authorize(Roles = "WinCapture.User,WinCapture.Admin")]
    public async Task<IActionResult> DeleteFile(
        long id,
        long fileId)
    {
        var user = CurrentUser;

        await albumFileService.DeleteAsync(
            id,
            fileId,
            user,
            CurrentUserRole);

        return NoContent();
    }

    [HttpGet("{id:long}/members")]
    [Authorize(Roles = "WinCapture.User,WinCapture.Admin")]
    public async Task<ActionResult<
        IReadOnlyList<AlbumMemberResponse>>>
        GetMembers(long id)
    {
        var user = CurrentUser;

        return Ok(
            await albumService.GetMembersAsync(
                id,
                user,
                CurrentUserRole));
    }

    [HttpPost("{id:long}/members")]
    [Authorize(Roles = "WinCapture.User,WinCapture.Admin")]
    public async Task<IActionResult> AddMember(
        long id,
        AddAlbumMemberRequest request)
    {
        var user = CurrentUser;

        await albumService.AddMemberAsync(
            id,
            request,
            user,
            CurrentUserRole);

        return NoContent();
    }

    [HttpPut("{id:long}/members/{userId:int}")]
    [Authorize(Roles = "WinCapture.User,WinCapture.Admin")]
    public async Task<IActionResult> UpdateMember(
        long id,
        int userId,
        UpdateAlbumMemberRequest request)
    {
        var user = CurrentUser;

        await albumService.UpdateMemberAsync(
            id,
            userId,
            request,
            user,
            CurrentUserRole);

        return NoContent();
    }

    [HttpDelete("{id:long}/members/{userId:int}")]
    [Authorize(Roles = "WinCapture.User,WinCapture.Admin")]
    public async Task<IActionResult> RemoveMember(
        long id,
        int userId)
    {
        var user = CurrentUser;

        await albumService.RemoveMemberAsync(
            id,
            userId,
            user,
            CurrentUserRole);

        return NoContent();
    }
}