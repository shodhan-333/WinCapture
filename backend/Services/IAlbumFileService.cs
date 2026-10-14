using Microsoft.AspNetCore.Http;
using WinCapture.DTOs.Files;
using WinCapture.DTOs.Common;
using WinCapture.Models;

namespace WinCapture.Services;

public interface IAlbumFileService
{
    // Uploads a file to the specified album.
    Task<FileResponse> UploadAsync(
        long albumId,
        IFormFile file,
        User currentUser,
        UserRole role);

    // Replaces an existing file in the specified album.
    Task<FileResponse> ReplaceAsync(
        long albumId,
        long fileId,
        IFormFile file,
        User currentUser,
        UserRole role);

    // Returns the files in an album with their favorite status and management permissions.
    Task<IReadOnlyList<FileResponse>> GetAsync(
        long albumId,
        User currentUser,
        UserRole role);

    Task<PagedResponse<FileResponse>> GetPageAsync(
        long albumId,
        User currentUser,
        UserRole role,
        PaginationQuery pagination);

    // Retrieves a specific file from an album.
    Task<FileResponse> GetOneAsync(
        long albumId,
        long fileId,
        User currentUser,
        UserRole role);

    // Returns the file content for preview.
    Task<FileDownloadResult> PreviewAsync(
        long albumId,
        long fileId,
        User currentUser,
        UserRole role);

    // Returns the file content for download.
    Task<FileDownloadResult> DownloadAsync(
        long albumId,
        long fileId,
        User currentUser,
        UserRole role);

    // Deletes a file from the specified album.
    Task DeleteAsync(
        long albumId,
        long fileId,
        User currentUser,
        UserRole role);
}