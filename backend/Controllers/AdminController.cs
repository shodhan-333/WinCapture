using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WinCapture.DTOs.Common;
using WinCapture.DTOs.Albums;
using WinCapture.DTOs.Files;
using WinCapture.Exceptions;
using WinCapture.Services;

namespace WinCapture.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "WinCapture.Admin")]
public sealed class AdminController(IFileService fileService, IAlbumService albumService) : ControllerBase
{
    // Gets the mapped WinCapture user ID for retrieving the current admin's own resources.
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

    // Returns files uploaded by all users for admin management.
    [HttpGet("files")]
    [ProducesResponseType<PagedResponse<AdminFileResponse>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResponse<AdminFileResponse>>> GetFiles(
        [FromQuery] PaginationQuery pagination)
    {
        return Ok(await fileService.GetAllPageAsync(pagination));
    }

    // Returns albums across all users for admin management.
    [HttpGet("albums")]
    [ProducesResponseType<PagedResponse<AlbumResponse>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResponse<AlbumResponse>>> GetAlbums(
        [FromQuery] PaginationQuery pagination)
    {
        return Ok(await albumService.GetAllForAdminPageAsync(pagination));
    }

    // Returns only the albums owned by the current admin.
    [HttpGet("albums/mine")]
    [ProducesResponseType<PagedResponse<AlbumResponse>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResponse<AlbumResponse>>> GetMyAlbums(
        [FromQuery] PaginationQuery pagination)
    {
        return Ok(await albumService.GetOwnedByUserPageAsync(UserId, pagination));
    }

    // Returns only the files uploaded by the current admin.
    [HttpGet("files/mine")]
    [ProducesResponseType<PagedResponse<AdminFileResponse>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResponse<AdminFileResponse>>> GetMyFiles(
        [FromQuery] PaginationQuery pagination)
    {
        return Ok(await fileService.GetAdminFilesByUploaderIdPageAsync(UserId, pagination));
    }
}