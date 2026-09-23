using Microsoft.AspNetCore.Http;
using WinCapture.DTOs.Files;
using WinCapture.Exceptions;
using WinCapture.Models;
using WinCapture.Repositories;
using WinCapture.Validators;

namespace WinCapture.Services;

public sealed class FileService(FileValidator validator,IStorageService storage,IFileRepository files) : IFileService
{
    public async Task<FileResponse> UploadAsync(IFormFile file, int userId)
    {
        await validator.ValidateAsync(file);

        var storedFileName = await storage.SaveAsync(file);
        var metadata = new FileMetadata
        {
            OriginalFileName = Path.GetFileName(file.FileName),
            StoredFileName = storedFileName,
            ContentType = file.ContentType,
            FileSize = file.Length,
            UploadedBy = userId,
            UploadedAt = DateTime.UtcNow
        };

        try
        {
            await files.AddAsync(metadata);
            return ToResponse(metadata);
        }
        catch
        {
            await TryDeleteStoredFileAsync(storedFileName);
            throw;
        }
    }

    public async Task<FileResponse> ReplaceAsync(long fileId, IFormFile file, int userId, UserRole userRole)
    {
        await validator.ValidateAsync(file);

        var existing = await GetAuthorizedFileAsync(fileId, userId, userRole);
        var oldStoredFileName = existing.StoredFileName;
        var newStoredFileName = await storage.SaveAsync(file);

        existing.OriginalFileName = Path.GetFileName(file.FileName);
        existing.StoredFileName = newStoredFileName;
        existing.ContentType = file.ContentType;
        existing.FileSize = file.Length;
        existing.UploadedAt = DateTime.UtcNow;

        try
        {
            await files.UpdateAsync(existing);
        }
        catch
        {
            await TryDeleteStoredFileAsync(newStoredFileName);
            throw;
        }

        await TryDeleteStoredFileAsync(oldStoredFileName);
        return ToResponse(existing);
    }

    public async Task<IReadOnlyList<FileResponse>> GetGalleryAsync(int userId) =>
        (await files.GetByUserIdAsync(userId)).Select(ToResponse).ToList();

    public async Task<FileResponse> GetAsync(long fileId, int userId, UserRole userRole) =>
        ToResponse(await GetAuthorizedFileAsync(fileId, userId, userRole));

    public async Task<FileDownloadResult> DownloadAsync(long fileId, int userId, UserRole userRole)
    {
        var file = await GetAuthorizedFileAsync(fileId, userId, userRole);
        var content = await storage.GetAsync(file.StoredFileName);
        return new FileDownloadResult(content, file.ContentType, file.OriginalFileName);
    }

    public async Task DeleteAsync(long fileId, int userId, UserRole userRole)
    {
        var file = await GetAuthorizedFileAsync(fileId, userId, userRole);
        await files.DeleteAsync(file);
        await storage.DeleteAsync(file.StoredFileName);
    }

    public async Task<IReadOnlyList<FileResponse>> GetAllAsync() =>
        (await files.GetAllAsync()).Select(ToResponse).ToList();

    private async Task<FileMetadata> GetAuthorizedFileAsync(long fileId, int userId, UserRole userRole)
    {
        var file = await files.GetByIdAsync(fileId)
            ?? throw new NotFoundException("The requested file was not found.");

        if (userRole != UserRole.Admin && file.UploadedBy != userId)
        {
            throw new ForbiddenException("You are not allowed to access this file.");
        }

        return file;
    }

    private async Task TryDeleteStoredFileAsync(string storedFileName)
    {
        await storage.DeleteAsync(storedFileName);
        
    }

    private static FileResponse ToResponse(FileMetadata file) =>
        new(
            file.Id,
            file.OriginalFileName,
            file.ContentType,
            file.FileSize,
            file.UploadedAt,
            $"/api/files/{file.Id}");
}
