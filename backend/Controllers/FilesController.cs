using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WinCapture.DTOs.Files;
using WinCapture.Exceptions;
using WinCapture.Models;
using WinCapture.Services;
using WinCapture.Validators;

namespace WinCapture.Controllers;

[ApiController]
[Route("api/files")]
[Authorize]
public sealed class FilesController(
    IFileService fileService) : ControllerBase
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
                User.FindFirst(
                    "wincapture_user_id")
                ?.Value;

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

    private UserRole UserRole
    {
        get
        {
            if (User.IsInRole(
                    "WinCapture.Admin"))
            {
                return UserRole.Admin;
            }

            if (User.IsInRole(
                    "WinCapture.User"))
            {
                return UserRole.User;
            }

            throw new ForbiddenException(
                "The authenticated user role is missing or invalid.");
        }
    }

    [HttpPost]
    [Authorize(Roles = "WinCapture.User")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(MaximumRequestSize)]
    [RequestFormLimits(
        MultipartBodyLengthLimit =
            MaximumRequestSize)]
    [ProducesResponseType<FileResponse>(
        StatusCodes.Status201Created)]
    [ProducesResponseType(
        StatusCodes.Status400BadRequest)]
    [ProducesResponseType(
        StatusCodes.Status413PayloadTooLarge)]
    public async Task<ActionResult<FileResponse>> Upload(
        IFormFile file)
    {
        var response =
            await fileService.UploadAsync(
                file,
                UserId);

        return Created(
            $"/api/files/{response.Id}",
            response);
    }

    [HttpGet]
    [ProducesResponseType<
        IReadOnlyList<FileResponse>>(
            StatusCodes.Status200OK)]
    public async Task<ActionResult<
        IReadOnlyList<FileResponse>>>
        GetGallery()
    {
        return Ok(
            await fileService.GetGalleryAsync(
                UserId));
    }

    [HttpGet("favorites")]
    [ProducesResponseType<
        IReadOnlyList<FileResponse>>(
            StatusCodes.Status200OK)]
    public async Task<ActionResult<
        IReadOnlyList<FileResponse>>>
        GetFavorites()
    {
        return Ok(
            await fileService.GetFavoritesAsync(
                UserId,
                UserRole));
    }

    [HttpPut("{id:long}/favorite")]
    [ProducesResponseType(
        StatusCodes.Status204NoContent)]
    [ProducesResponseType(
        StatusCodes.Status403Forbidden)]
    [ProducesResponseType(
        StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AddFavorite(
        long id)
    {
        await fileService.AddFavoriteAsync(
            id,
            UserId,
            UserRole);

        return NoContent();
    }

    [HttpDelete("{id:long}/favorite")]
    [ProducesResponseType(
        StatusCodes.Status204NoContent)]
    public async Task<IActionResult> RemoveFavorite(
        long id)
    {
        await fileService.RemoveFavoriteAsync(
            id,
            UserId);

        return NoContent();
    }

    [HttpGet("{id:long}")]
    [ProducesResponseType<FileResponse>(
        StatusCodes.Status200OK)]
    [ProducesResponseType(
        StatusCodes.Status403Forbidden)]
    [ProducesResponseType(
        StatusCodes.Status404NotFound)]
    public async Task<ActionResult<FileResponse>> Get(
        long id)
    {
        return Ok(
            await fileService.GetAsync(
                id,
                UserId,
                UserRole));
    }

    [HttpPut("{id:long}")]
    [Authorize(Roles = "WinCapture.User,WinCapture.Admin")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(MaximumRequestSize)]
    [RequestFormLimits(
        MultipartBodyLengthLimit =
            MaximumRequestSize)]
    [ProducesResponseType<FileResponse>(
        StatusCodes.Status200OK)]
    [ProducesResponseType(
        StatusCodes.Status400BadRequest)]
    [ProducesResponseType(
        StatusCodes.Status403Forbidden)]
    [ProducesResponseType(
        StatusCodes.Status404NotFound)]
    [ProducesResponseType(
        StatusCodes.Status413PayloadTooLarge)]
    public async Task<ActionResult<FileResponse>> Replace(
        long id,
        IFormFile file)
    {
        var response =
            await fileService.ReplaceAsync(
                id,
                file,
                UserId,
                UserRole);

        return Ok(response);
    }

    [HttpGet("{id:long}/download")]
    [ProducesResponseType(
        StatusCodes.Status200OK)]
    [ProducesResponseType(
        StatusCodes.Status403Forbidden)]
    [ProducesResponseType(
        StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Download(
        long id)
    {
        var result =
            await fileService.DownloadAsync(
                id,
                UserId,
                UserRole);

        return File(
            result.Content,
            result.ContentType,
            result.DownloadName);
    }

    [HttpDelete("{id:long}")]
    [ProducesResponseType(
        StatusCodes.Status204NoContent)]
    [ProducesResponseType(
        StatusCodes.Status403Forbidden)]
    [ProducesResponseType(
        StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(
        long id)
    {
        await fileService.DeleteAsync(
            id,
            UserId,
            UserRole);

        return NoContent();
    }
}