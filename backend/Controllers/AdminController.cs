using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WinCapture.DTOs.Albums;
using WinCapture.DTOs.Files;
using WinCapture.Services;

namespace WinCapture.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "WinCapture.Admin")]
public sealed class AdminController(
    IFileService fileService,
    IAlbumService albumService) : ControllerBase
{
    [HttpGet("files")]
    [ProducesResponseType<IReadOnlyList<FileResponse>>(
        StatusCodes.Status200OK)]
    public async Task<ActionResult<
        IReadOnlyList<FileResponse>>>
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
}