using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WinCapture.DTOs.Albums;
using WinCapture.DTOs.Files;
using WinCapture.Exceptions;
using WinCapture.Services;

namespace WinCapture.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "WinCapture.Admin")]
public sealed class AdminController(
    IFileService fileService,
    IAlbumService albumService) : ControllerBase
{
    private int UserId
    {
        get
        {
            var value = User.FindFirst("wincapture_user_id")?.Value;
            if (!int.TryParse(value, out var userId) || userId <= 0)
            {
                throw new UnauthorizedException(
                    "The authenticated user ID is missing or invalid.");
            }

            return userId;
        }
    }

    [HttpGet("files")]
    [ProducesResponseType<IReadOnlyList<AdminFileResponse>>(
        StatusCodes.Status200OK)]
    public async Task<ActionResult<
        IReadOnlyList<AdminFileResponse>>>
        GetFiles()
    {
        return Ok(
            await fileService.GetAllAsync());
    }

    [HttpGet("albums")]
    [ProducesResponseType<IReadOnlyList<AlbumResponse>>(
        StatusCodes.Status200OK)]
    public async Task<ActionResult<
        IReadOnlyList<AlbumResponse>>>
        GetAlbums()
    {
        return Ok(
            await albumService.GetAllForAdminAsync());
    }

    [HttpGet("albums/mine")]
    [ProducesResponseType<IReadOnlyList<AlbumResponse>>(
        StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<AlbumResponse>>>
        GetMyAlbums()
    {
        return Ok(await albumService.GetOwnedByUserAsync(UserId));
    }

    [HttpGet("files/mine")]
    [ProducesResponseType<IReadOnlyList<AdminFileResponse>>(
        StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<AdminFileResponse>>>
        GetMyFiles()
    {
        return Ok(await fileService.GetAdminFilesByUploaderIdAsync(UserId));
    }
}
