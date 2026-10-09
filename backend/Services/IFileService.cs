using Microsoft.AspNetCore.Http;
using WinCapture.DTOs.Files;
using WinCapture.Models;

namespace WinCapture.Services;

public interface IFileService
{
    // Uploads a file for the specified user.
    Task<FileResponse> UploadAsync(
        IFormFile file,
        int userId);

    // Replaces an existing file after checking the user's permissions.
    Task<FileResponse> ReplaceAsync(
        long fileId,
        IFormFile file,
        int userId,
        UserRole userRole);

    // Returns the files uploaded by the specified user.
    Task<IReadOnlyList<FileResponse>> GetGalleryAsync(
        int userId);

    // Retrieves a file after checking the user's access permissions.
    Task<FileResponse> GetAsync(
        long fileId,
        int userId,
        UserRole userRole);

    // Returns the file content for download after checking access permissions.
    Task<FileDownloadResult> DownloadAsync(
        long fileId,
        int userId,
        UserRole userRole);

    // Deletes a file after checking the user's management permissions.
    Task DeleteAsync(
        long fileId,
        int userId,
        UserRole userRole);

    // Returns all files with uploader and album details for admin management.
    Task<IReadOnlyList<AdminFileResponse>> GetAllAsync();

    // Returns the files uploaded by the specified admin.
    Task<IReadOnlyList<AdminFileResponse>> GetAdminFilesByUploaderIdAsync(int userId);

    // Returns the user's favorite files that they are allowed to view.
    Task<IReadOnlyList<FileResponse>> GetFavoritesAsync(
        int userId,
        UserRole userRole);

    // Adds a file to the user's favorites if it is accessible to them.
    Task AddFavoriteAsync(
        long fileId,
        int userId,
        UserRole userRole);

    // Removes a file from the user's favorites.
    Task RemoveFavoriteAsync(
        long fileId,
        int userId);
}