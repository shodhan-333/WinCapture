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
    public async Task<FileResponse> UploadAsync(
        long albumId,
        IFormFile file,
        User currentUser,
        UserRole role)
    {
        var album =
            await albumService.GetForUploadAsync(
                albumId,
                currentUser,
                role);

        await validator.ValidateAsync(
            file);

        var storedFileName =
            await storage.SaveAsync(
                file);

        var metadata = new FileMetadata
        {
            OriginalFileName =
                Path.GetFileName(
                    file.FileName),

            StoredFileName =
                storedFileName,

            ContentType =
                file.ContentType,

            FileSize =
                file.Length,

            UploadedBy =
                currentUser.Id,

            AlbumId =
                albumId,

            UploadedAt =
                DateTime.UtcNow
        };

        try
        {
            await files.AddAsync(
                metadata);
        }
        catch
        {
            await TryDeleteStoredFileAsync(
                storedFileName);

            throw;
        }

        var canManage =
            role == UserRole.Admin ||
            album.CreatedBy == currentUser.Id;

        return ToResponse(
            metadata,
            albumId,
            false,
            canManage);
    }

    public async Task<IReadOnlyList<FileResponse>>
        GetAsync(
            long albumId,
            User currentUser,
            UserRole role)
    {
        var album =
            await albumService.GetAsync(
                albumId,
                currentUser,
                role);

        var albumFiles =
            await files.GetByAlbumIdAsync(
                albumId);

        var favoriteIds =
            await files.GetFavoriteFileIdsByUserIdAsync(
                currentUser.Id);

        var favoriteIdSet =
            favoriteIds.ToHashSet();

        var canManage =
            role == UserRole.Admin ||
            album.OwnerId == currentUser.Id;

        return albumFiles
            .Select(
                file =>
                    ToResponse(
                        file,
                        albumId,
                        favoriteIdSet.Contains(
                            file.Id),
                        canManage))
            .ToList();
    }

    public async Task<FileResponse> GetOneAsync(
        long albumId,
        long fileId,
        User currentUser,
        UserRole role)
    {
        var album =
            await albumService.GetAsync(
                albumId,
                currentUser,
                role);

        var file =
            await files.GetByIdAsync(
                fileId)
            ?? throw new NotFoundException(
                "The requested file was not found.");

        if (file.AlbumId != albumId)
        {
            throw new NotFoundException(
                "The requested file was not found in this album.");
        }

        var isFavorite =
            await files.GetFavoriteAsync(
                currentUser.Id,
                fileId) is not null;

        var canManage =
            role == UserRole.Admin ||
            album.OwnerId == currentUser.Id;

        return ToResponse(
            file,
            albumId,
            isFavorite,
            canManage);
    }

    public async Task<FileDownloadResult>
        PreviewAsync(
            long albumId,
            long fileId,
            User currentUser,
            UserRole role)
    {
        await albumService.GetAsync(
            albumId,
            currentUser,
            role);

        var file =
            await files.GetByIdAsync(
                fileId)
            ?? throw new NotFoundException(
                "The requested file was not found.");

        if (file.AlbumId != albumId)
        {
            throw new NotFoundException(
                "The requested file was not found in this album.");
        }

        var content =
            await storage.GetAsync(
                file.StoredFileName);

        return new FileDownloadResult(
            content,
            file.ContentType,
            file.OriginalFileName);
    }

    public async Task<FileDownloadResult>
        DownloadAsync(
            long albumId,
            long fileId,
            User currentUser,
            UserRole role)
    {
        if (!await albumService.CanDownloadAsync(
                albumId,
                currentUser,
                role))
        {
            throw new ForbiddenException(
                "You are not allowed to download files from this album.");
        }

        var file =
            await files.GetByIdAsync(
                fileId)
            ?? throw new NotFoundException(
                "The requested file was not found.");

        if (file.AlbumId != albumId)
        {
            throw new NotFoundException(
                "The requested file was not found in this album.");
        }

        var content =
            await storage.GetAsync(
                file.StoredFileName);

        return new FileDownloadResult(
            content,
            file.ContentType,
            file.OriginalFileName);
    }

    public async Task DeleteAsync(
        long albumId,
        long fileId,
        User currentUser,
        UserRole role)
    {
        await albumService.GetForUploadAsync(
            albumId,
            currentUser,
            role);

        var file =
            await files.GetByIdAsync(
                fileId)
            ?? throw new NotFoundException(
                "The requested file was not found.");

        if (file.AlbumId != albumId)
        {
            throw new NotFoundException(
                "The requested file was not found in this album.");
        }

        await files.DeleteAsync(
            file);

        await TryDeleteStoredFileAsync(
            file.StoredFileName);
    }

    private async Task TryDeleteStoredFileAsync(
        string storedFileName)
    {
        try
        {
            await storage.DeleteAsync(
                storedFileName);
        }
        catch (Exception exception)
        {
            logger.LogError(
                exception,
                "Failed to clean up stored file {StoredFileName}.",
                storedFileName);
        }
    }

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
