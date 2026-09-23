using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WinCapture.DTOs.Files;
using WinCapture.Models;
using WinCapture.Services;

namespace WinCapture.Controllers;

[ApiController]
[Route("api/files")]
[Authorize]
public sealed class FilesController(IFileService fileService) : ControllerBase
{
    private int UserId =>
        int.TryParse(User.FindFirst("sub")?.Value, out var userId)
            ? userId
            : throw new UnauthorizedAccessException(
                "The authenticated user ID is missing or invalid.");

    private UserRole UserRole =>
        User.IsInRole(UserRole.Admin.ToString())
            ? UserRole.Admin
            : UserRole.User;

    [HttpPost]
    [Authorize(Roles = "User")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<FileResponse>> Upload(IFormFile file)
    {
        var response = await fileService.UploadAsync(file, UserId);

        return Created($"/api/files/{response.Id}", response);
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<FileResponse>>> GetGallery()
    {
        return Ok(await fileService.GetGalleryAsync(UserId));
    }

    [HttpGet("{id:long}")]
    public async Task<ActionResult<FileResponse>> Get(long id)
    {
        return Ok(await fileService.GetAsync(id, UserId, UserRole));
    }

    [HttpPut("{id:long}")]
    [Authorize(Roles = "User,Admin")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<FileResponse>> Replace(
        long id,
        IFormFile file)
    {
        var response = await fileService.ReplaceAsync(id,file,UserId,UserRole);
        return Ok(response);
    }

    [HttpGet("{id:long}/download")]
    public async Task<IActionResult> Download(long id)
    {
        var result = await fileService.DownloadAsync(id,UserId,UserRole);
        return File(result.Content,result.ContentType,result.DownloadName,enableRangeProcessing: true);
    }

    [HttpDelete("{id:long}")]
    public async Task<IActionResult> Delete(long id)
    {
        await fileService.DeleteAsync(
            id,
            UserId,
            UserRole);

        return NoContent();
    }
}
