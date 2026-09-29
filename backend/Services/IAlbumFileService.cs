using Microsoft.AspNetCore.Http;
using WinCapture.DTOs.Files;
using WinCapture.Models;

namespace WinCapture.Services;

public interface IAlbumFileService
{
    Task<FileResponse> UploadAsync(
        long albumId,
        IFormFile file,
        User currentUser,
        UserRole role);

    Task<IReadOnlyList<FileResponse>> GetAsync(
        long albumId,
        User currentUser,
        UserRole role);

    Task<FileResponse> GetOneAsync(
        long albumId,
        long fileId,
        User currentUser,
        UserRole role);

    Task<FileDownloadResult> DownloadAsync(
        long albumId,
        long fileId,
        User currentUser,
        UserRole role);

    Task DeleteAsync(
        long albumId,
        long fileId,
        User currentUser,
        UserRole role);
}