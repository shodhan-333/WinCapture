using Microsoft.AspNetCore.Http;
using WinCapture.DTOs.Files;
using WinCapture.Models;

namespace WinCapture.Services;

public interface IFileService
{
    Task<FileResponse> UploadAsync(IFormFile file, int userId);
    Task<FileResponse> ReplaceAsync(long fileId, IFormFile file, int userId, UserRole userRole);
    Task<IReadOnlyList<FileResponse>> GetGalleryAsync(int userId);
    Task<FileResponse> GetAsync(long fileId, int userId, UserRole userRole);
    Task<FileDownloadResult> DownloadAsync(long fileId, int userId, UserRole userRole);
    Task DeleteAsync(long fileId, int userId, UserRole userRole);
    Task<IReadOnlyList<FileResponse>> GetAllAsync();
}
