using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WinCapture.DTOs.Common;
using WinCapture.DTOs.Files;
using WinCapture.Exceptions;
using WinCapture.Models;
using WinCapture.Services;
using WinCapture.Validators;

namespace WinCapture.Controllers;

[ApiController]
[Route("api/files")]
[Authorize]
public sealed class FilesController(IFileService fileService) : ControllerBase
{
    // Allows space for multipart form data beyond the maximum file size.
    private const long RequestOverhead = 1024L * 1024L;

    private const long MaximumRequestSize = FileValidator.MaximumFileSize + RequestOverhead;

    // Gets the mapped WinCapture user ID from the authenticated user's claims.
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

    // Gets the WinCapture role from the authenticated user's Entra app roles.
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

    // Uploads a new file for the current user and returns its location.
    [HttpPost]
    [Authorize(Roles = "WinCapture.User,WinCapture.Admin")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(MaximumRequestSize)]
    [RequestFormLimits(MultipartBodyLengthLimit = MaximumRequestSize)]
    [ProducesResponseType<FileResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status413PayloadTooLarge)]
    public async Task<ActionResult<FileResponse>> Upload(IFormFile file)
    {
        var response = await fileService.UploadAsync(file, UserId);

        return Created($"/api/files/{response.Id}", response);
    }

    // Returns the files available in the current user's gallery.
    [HttpGet]
    [ProducesResponseType<PagedResponse<FileResponse>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResponse<FileResponse>>> GetGallery(
        [FromQuery] PaginationQuery pagination)
    {
        return Ok(await fileService.GetGalleryPageAsync(UserId, pagination));
    }

    // Returns the current user's favorite files according to their WinCapture role.
    [HttpGet("favorites")]
    [ProducesResponseType<PagedResponse<FileResponse>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResponse<FileResponse>>> GetFavorites(
        [FromQuery] PaginationQuery pagination)
    {
        return Ok(await fileService.GetFavoritesPageAsync(UserId, CurrentUserRole, pagination));
    }

    // Adds the specified file to the current user's favorites.
    [HttpPut("{id:long}/favorite")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AddFavorite(long id)
    {
        await fileService.AddFavoriteAsync(id, UserId, CurrentUserRole);

        return NoContent();
    }

    // Removes the specified file from the current user's favorites.
    [HttpDelete("{id:long}/favorite")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> RemoveFavorite(long id)
    {
        await fileService.RemoveFavoriteAsync(id, UserId);

        return NoContent();
    }

    // Retrieves a file after the service checks the current user's access permissions.
    [HttpGet("{id:long}")]
    [ProducesResponseType<FileResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<FileResponse>> Get(long id)
    {
        return Ok(await fileService.GetAsync(id, UserId, CurrentUserRole));
    }

    // Replaces an existing file while enforcing the configured request-size limit.
    [HttpPut("{id:long}")]
    [Authorize(Roles = "WinCapture.User,WinCapture.Admin")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(MaximumRequestSize)]
    [RequestFormLimits(MultipartBodyLengthLimit = MaximumRequestSize)]
    [ProducesResponseType<FileResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status413PayloadTooLarge)]
    public async Task<ActionResult<FileResponse>> Replace(long id, IFormFile file)
    {
        var response = await fileService.ReplaceAsync(id, file, UserId, CurrentUserRole);

        return Ok(response);
    }

    // Returns the file content with its download filename.
    [HttpGet("{id:long}/download")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Download(long id)
    {
        var result = await fileService.DownloadAsync(id, UserId, CurrentUserRole);

        return File(result.Content, result.ContentType, result.DownloadName);
    }

    // Deletes the specified file after the service checks the current user's permissions.
    [HttpDelete("{id:long}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(long id)
    {
        var storageCleanupComplete = await fileService.DeleteAsync(id, UserId, CurrentUserRole);
        return Ok(new { storageCleanupComplete });
    }
}
