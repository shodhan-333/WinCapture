using Microsoft.AspNetCore.Http;
using WinCapture.DTOs.Files;
using WinCapture.Exceptions;
using WinCapture.Models;
using WinCapture.Repositories;
using WinCapture.Validators;

namespace WinCapture.Services;

public sealed class AlbumFileService(
    FileValidator validator,
    IStorageService storage,
    IFileRepository files,
    IAlbumService albumService,
    ILogger<AlbumFileService> logger) : IAlbumFileService
{
    // Saves the replacement first so the existing file remains available if the database update fails.
    public async Task<FileResponse> ReplaceAsync(
        long albumId,
        long fileId,
        IFormFile file,
        User currentUser,
        UserRole role)
    {
        var album = await albumService.GetForUploadAsync(albumId, currentUser, role);

        var existing = await files.GetByIdAsync(fileId)
            ?? throw new NotFoundException("The requested file was not found.");

        if (existing.AlbumId != albumId)
        {
            throw new NotFoundException("The requested file was not found in this album.");
        }

        await validator.ValidateAsync(file);

        var oldName = existing.StoredFileName;
        var newName = await storage.SaveAsync(file);

        existing.StoredFileName = newName;
        existing.OriginalFileName = Path.GetFileName(file.FileName);
        existing.ContentType = file.ContentType;
        existing.FileSize = file.Length;
        existing.UploadedAt = DateTime.UtcNow;

        try
        {
            await files.UpdateAsync(existing);
        }
        catch
        {
            await TryDeleteStoredFileAsync(newName);
            throw;
        }

        await TryDeleteStoredFileAsync(oldName);

        var isFavorite = await files.GetFavoriteAsync(currentUser.Id, fileId) is not null;
        var canManage = role == UserRole.Admin || album.CreatedBy == currentUser.Id;

        return ToResponse(existing, albumId, isFavorite, canManage);
    }

    // Saves the uploaded file and removes the stored blob if saving its metadata fails.
    public async Task<FileResponse> UploadAsync(
        long albumId,
        IFormFile file,
        User currentUser,
        UserRole role)
    {
        var album = await albumService.GetForUploadAsync(albumId, currentUser, role);

        await validator.ValidateAsync(file);

        var storedFileName = await storage.SaveAsync(file);

        var metadata = new FileMetadata
        {
            OriginalFileName = Path.GetFileName(file.FileName),
            StoredFileName = storedFileName,
            ContentType = file.ContentType,
            FileSize = file.Length,
            UploadedBy = currentUser.Id,
            AlbumId = albumId,
            UploadedAt = DateTime.UtcNow
        };

        try
        {
            await files.AddAsync(metadata);
        }
        catch
        {
            await TryDeleteStoredFileAsync(storedFileName);
            throw;
        }

        var canManage = role == UserRole.Admin || album.CreatedBy == currentUser.Id;

        return ToResponse(metadata, albumId, false, canManage);
    }

    // Returns album files with their favorite status and management permissions.
    public async Task<IReadOnlyList<FileResponse>> GetAsync(
        long albumId,
        User currentUser,
        UserRole role)
    {
        var album = await albumService.GetAsync(albumId, currentUser, role);
        var albumFiles = await files.GetByAlbumIdAsync(albumId);
        var favoriteIds = await files.GetFavoriteFileIdsByUserIdAsync(currentUser.Id);
        var favoriteIdSet = favoriteIds.ToHashSet();

        var canManage = role == UserRole.Admin || album.OwnerId == currentUser.Id;

        return albumFiles
            .Select(file => ToResponse(
                file,
                albumId,
                favoriteIdSet.Contains(file.Id),
                canManage))
            .ToList();
    }

    // Checks album access and verifies that the file belongs to the album before returning its details.
    public async Task<FileResponse> GetOneAsync(
        long albumId,
        long fileId,
        User currentUser,
        UserRole role)
    {
        var album = await albumService.GetAsync(albumId, currentUser, role);

        var file = await files.GetByIdAsync(fileId)
            ?? throw new NotFoundException("The requested file was not found.");

        if (file.AlbumId != albumId)
        {
            throw new NotFoundException("The requested file was not found in this album.");
        }

        var isFavorite = await files.GetFavoriteAsync(currentUser.Id, fileId) is not null;
        var canManage = role == UserRole.Admin || album.OwnerId == currentUser.Id;

        return ToResponse(file, albumId, isFavorite, canManage);
    }

    // Checks album access and returns the stored file content for preview.
    public async Task<FileDownloadResult> PreviewAsync(
        long albumId,
        long fileId,
        User currentUser,
        UserRole role)
    {
        await albumService.GetAsync(albumId, currentUser, role);

        var file = await files.GetByIdAsync(fileId)
            ?? throw new NotFoundException("The requested file was not found.");

        if (file.AlbumId != albumId)
        {
            throw new NotFoundException("The requested file was not found in this album.");
        }

        var content = await storage.GetAsync(file.StoredFileName);

        return new FileDownloadResult(
            content,
            file.ContentType,
            file.OriginalFileName);
    }

    // Checks download permission before returning the stored file content.
    public async Task<FileDownloadResult> DownloadAsync(
        long albumId,
        long fileId,
        User currentUser,
        UserRole role)
    {
        if (!await albumService.CanDownloadAsync(albumId, currentUser, role))
        {
            throw new ForbiddenException(
                "You are not allowed to download files from this album.");
        }

        var file = await files.GetByIdAsync(fileId)
            ?? throw new NotFoundException("The requested file was not found.");

        if (file.AlbumId != albumId)
        {
            throw new NotFoundException("The requested file was not found in this album.");
        }

        var content = await storage.GetAsync(file.StoredFileName);

        return new FileDownloadResult(
            content,
            file.ContentType,
            file.OriginalFileName);
    }

    // Removes metadata first so a database failure cannot leave a record pointing to missing content.
    public async Task DeleteAsync(
        long albumId,
        long fileId,
        User currentUser,
        UserRole role)
    {
        await albumService.GetForUploadAsync(albumId, currentUser, role);

        var file = await files.GetByIdAsync(fileId)
            ?? throw new NotFoundException("The requested file was not found.");

        if (file.AlbumId != albumId)
        {
            throw new NotFoundException("The requested file was not found in this album.");
        }

        await files.DeleteAsync(file);
        await TryDeleteStoredFileAsync(file.StoredFileName);
    }

    // Logs cleanup failures without hiding the result of the main operation.
    private async Task TryDeleteStoredFileAsync(string storedFileName)
    {
        try
        {
            await storage.DeleteAsync(storedFileName);
        }
        catch (Exception exception)
        {
            logger.LogCritical(
                exception,
                "Database metadata was removed but blob cleanup failed. Reconciliation is required for {StoredFileName}.",
                storedFileName);
        }
    }

    // Builds the file response with its URLs, favorite status, and management permission.
    private static FileResponse ToResponse(
        FileMetadata file,
        long albumId,
        bool isFavorite,
        bool canManage) =>
        new(
            file.Id,
            file.OriginalFileName,
            file.ContentType,
            file.FileSize,
            file.UploadedAt,
            $"/api/albums/{albumId}/files/{file.Id}",
            $"/api/albums/{albumId}/files/{file.Id}/download",
            isFavorite,
            canManage);
}
