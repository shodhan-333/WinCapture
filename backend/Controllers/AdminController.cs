using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WinCapture.DTOs.Files;
using WinCapture.Services;

namespace WinCapture.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "Admin")]
public sealed class AdminController(IFileService fileService) : ControllerBase
{
    [HttpGet("files")]
    public async Task<ActionResult<IReadOnlyList<FileResponse>>> GetFiles()
    {
        return Ok(await fileService.GetAllAsync());
    }
}
