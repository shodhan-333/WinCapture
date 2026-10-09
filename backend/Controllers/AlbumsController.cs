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
public sealed class AlbumsController(IAlbumService albumService, IAlbumFileService albumFileService) : ControllerBase
{
    // Allows space for multipart form data beyond the maximum file size.
    private const long RequestOverhead = 1024L * 1024L;

    private const long MaximumRequestSize = FileValidator.MaximumFileSize + RequestOverhead;

    // Gets the local WinCapture user ID mapped to the authenticated Entra account.
    private int UserId
    {
        get
        {
            var value = User.FindFirst("wincapture_user_id")?.Value;

            if (!int.TryParse(value, out var userId) || userId <= 0)
            {
                throw new UnauthorizedException("The authenticated user ID is missing or invalid.");
            }

            return userId;
        }
    }

    // Maps the authenticated Entra app role to the role used by WinCapture services.
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

            throw new ForbiddenException("The authenticated user role is missing or invalid.");
        }
    }

    // Builds the user context required by the album services from the authenticated claims.
    private User CurrentUser =>
        new()
        {
            Id = UserId,
            Name = User.FindFirst("name")?.Value ?? string.Empty,
            Email = User.FindFirst("email")?.Value
                ?? User.FindFirst("preferred_username")?.Value
                ?? string.Empty,
            Role = CurrentUserRole
        };

    // Creates an album for the current user and returns its location.
    [HttpPost]
    [Authorize(Roles = "WinCapture.User,WinCapture.Admin")]
    public async Task<ActionResult<AlbumResponse>> Create(CreateAlbumRequest request)
    {
        var user = CurrentUser;
        var response = await albumService.CreateAsync(request, user);

        return Created($"/api/albums/{response.Id}", response);
    }

    // Returns the albums the current user is allowed to access, including shared albums.
    [HttpGet]
    [Authorize(Roles = "WinCapture.User,WinCapture.Admin")]
    public async Task<ActionResult<IReadOnlyList<AlbumResponse>>> GetAll()
    {
        var user = CurrentUser;

        return Ok(await albumService.GetAccessibleAsync(user));
    }

    // Returns only the albums owned by the current user.
    [HttpGet("mine")]
    [Authorize(Roles = "WinCapture.User,WinCapture.Admin")]
    public async Task<ActionResult<IReadOnlyList<AlbumResponse>>> GetOwnedByCurrentUser()
    {
        return Ok(await albumService.GetOwnedByUserAsync(UserId));
    }

    // Retrieves an album using the current user's identity and role for access checks.
    [HttpGet("{id:long}")]
    [Authorize(Roles = "WinCapture.User,WinCapture.Admin")]
    public async Task<ActionResult<AlbumResponse>> Get(long id)
    {
        var user = CurrentUser;

        return Ok(await albumService.GetAsync(id, user, CurrentUserRole));
    }

    // Passes the current user's identity and role to the service when updating an album.
    [HttpPut("{id:long}")]
    [Authorize(Roles = "WinCapture.User,WinCapture.Admin")]
    public async Task<ActionResult<AlbumResponse>> Update(long id, UpdateAlbumRequest request)
    {
        var user = CurrentUser;

        return Ok(await albumService.UpdateAsync(id, request, user, CurrentUserRole));
    }

    // Delegates album deletion and access checks to the album service.
    [HttpDelete("{id:long}")]
    [Authorize(Roles = "WinCapture.User,WinCapture.Admin")]
    public async Task<IActionResult> Delete(long id)
    {
        var user = CurrentUser;

        await albumService.DeleteAsync(id, user, CurrentUserRole);

        return NoContent();
    }

    // Uploads a file to the specified album within the configured request-size limit.
    [HttpPost("{id:long}/files")]
    [Authorize(Roles = "WinCapture.User,WinCapture.Admin")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(MaximumRequestSize)]
    [RequestFormLimits(MultipartBodyLengthLimit = MaximumRequestSize)]
    public async Task<ActionResult<FileResponse>> UploadFile(long id, IFormFile file)
    {
        var user = CurrentUser;
        var response = await albumFileService.UploadAsync(id, file, user, CurrentUserRole);

        return Created(response.Url, response);
    }

    // Replaces a file in the specified album while enforcing the configured request-size limit.
    [HttpPut("{id:long}/files/{fileId:long}")]
    [Authorize(Roles = "WinCapture.User,WinCapture.Admin")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(MaximumRequestSize)]
    [RequestFormLimits(MultipartBodyLengthLimit = MaximumRequestSize)]
    public async Task<ActionResult<FileResponse>> ReplaceFile(long id, long fileId, IFormFile file)
    {
        var response = await albumFileService.ReplaceAsync(id, fileId, file, CurrentUser, CurrentUserRole);

        return Ok(response);
    }

    // Returns the files in an album after applying the current user's access rules.
    [HttpGet("{id:long}/files")]
    [Authorize(Roles = "WinCapture.User,WinCapture.Admin")]
    public async Task<ActionResult<IReadOnlyList<FileResponse>>> GetFiles(long id)
    {
        var user = CurrentUser;

        return Ok(await albumFileService.GetAsync(id, user, CurrentUserRole));
    }

    // Retrieves a specific file using the current user's access context.
    [HttpGet("{id:long}/files/{fileId:long}")]
    [Authorize(Roles = "WinCapture.User,WinCapture.Admin")]
    public async Task<ActionResult<FileResponse>> GetFile(long id, long fileId)
    {
        var user = CurrentUser;

        return Ok(await albumFileService.GetOneAsync(id, fileId, user, CurrentUserRole));
    }

    // Returns the file content for in-browser preview without setting a download filename.
    [HttpGet("{id:long}/files/{fileId:long}/preview")]
    [Authorize(Roles = "WinCapture.User,WinCapture.Admin")]
    public async Task<IActionResult> PreviewFile(long id, long fileId)
    {
        var user = CurrentUser;
        var result = await albumFileService.PreviewAsync(id, fileId, user, CurrentUserRole);

        return File(result.Content, result.ContentType);
    }

    // Returns the file content with its download filename.
    [HttpGet("{id:long}/files/{fileId:long}/download")]
    [Authorize(Roles = "WinCapture.User,WinCapture.Admin")]
    public async Task<IActionResult> DownloadFile(long id, long fileId)
    {
        var user = CurrentUser;
        var result = await albumFileService.DownloadAsync(id, fileId, user, CurrentUserRole);

        return File(result.Content, result.ContentType, result.DownloadName);
    }

    // Delegates file deletion and album access checks to the album file service.
    [HttpDelete("{id:long}/files/{fileId:long}")]
    [Authorize(Roles = "WinCapture.User,WinCapture.Admin")]
    public async Task<IActionResult> DeleteFile(long id, long fileId)
    {
        var user = CurrentUser;

        await albumFileService.DeleteAsync(id, fileId, user, CurrentUserRole);

        return NoContent();
    }

    // Returns the members of an album according to the current user's access permissions.
    [HttpGet("{id:long}/members")]
    [Authorize(Roles = "WinCapture.User,WinCapture.Admin")]
    public async Task<ActionResult<IReadOnlyList<AlbumMemberResponse>>> GetMembers(long id)
    {
        var user = CurrentUser;

        return Ok(await albumService.GetMembersAsync(id, user, CurrentUserRole));
    }

    // Adds an album member using the current user's identity and role.
    [HttpPost("{id:long}/members")]
    [Authorize(Roles = "WinCapture.User,WinCapture.Admin")]
    public async Task<IActionResult> AddMember(long id, AddAlbumMemberRequest request)
    {
        var user = CurrentUser;

        await albumService.AddMemberAsync(id, request, user, CurrentUserRole);

        return NoContent();
    }

    // Updates an album member's permissions through the album service.
    [HttpPut("{id:long}/members/{userId:int}")]
    [Authorize(Roles = "WinCapture.User,WinCapture.Admin")]
    public async Task<IActionResult> UpdateMember(long id, int userId, UpdateAlbumMemberRequest request)
    {
        var user = CurrentUser;

        await albumService.UpdateMemberAsync(id, userId, request, user, CurrentUserRole);

        return NoContent();
    }

    // Removes an album member through the album service.
    [HttpDelete("{id:long}/members/{userId:int}")]
    [Authorize(Roles = "WinCapture.User,WinCapture.Admin")]
    public async Task<IActionResult> RemoveMember(long id, int userId)
    {
        var user = CurrentUser;

        await albumService.RemoveMemberAsync(id, userId, user, CurrentUserRole);

        return NoContent();
    }
}