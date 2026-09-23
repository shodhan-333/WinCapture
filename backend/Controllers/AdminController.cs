using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WinCapture.DTOs.Albums;
using WinCapture.DTOs.Files;
using WinCapture.Services;

namespace WinCapture.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "Admin")]
public sealed class AdminController(
    IFileService fileService,
    IAlbumService albumService) : ControllerBase
{
    [HttpGet("files")]
    public async Task<ActionResult<IReadOnlyList<FileResponse>>>
        GetFiles()
    {
        return Ok(
            await fileService.GetAllAsync());
    }

    [HttpGet("albums")]
    public async Task<ActionResult<IReadOnlyList<AlbumResponse>>>
        GetAlbums()
    {
        return Ok(
            await albumService.GetAllForAdminAsync());
    }
}