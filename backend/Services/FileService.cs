using Microsoft.AspNetCore.Http;
using WinCapture.DTOs.Files;
using WinCapture.Exceptions;
using WinCapture.Models;
using WinCapture.Repositories;
using WinCapture.Validators;

namespace WinCapture.Services;

public sealed class FileService(
    FileValidator validator,
    IStorageService storage,
    IFileRepository files,
    IAlbumRepository albums,
    ILogger<FileService> logger) : IFileService
{
    public async Task<FileResponse> UploadAsync(
        IFormFile file,
        int userId)
    {
        await validator.ValidateAsync(file);

        var storedFileName =
            await storage.SaveAsync(file);

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
                userId,

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

        return ToResponse(
            metadata,
            false,
            true);
    }

    public async Task<FileResponse> ReplaceAsync(
        long fileId,
        IFormFile file,
        int userId,
        UserRole userRole)
    {
        await validator.ValidateAsync(file);

        var existing =
            await GetAuthorizedFileAsync(
                fileId,
                userId,
                userRole);

        var oldStoredFileName =
            existing.StoredFileName;

        var newStoredFileName =
            await storage.SaveAsync(file);

        existing.OriginalFileName =
            Path.GetFileName(
                file.FileName);

        existing.StoredFileName =
            newStoredFileName;

        existing.ContentType =
            file.ContentType;

        existing.FileSize =
            file.Length;

        existing.UploadedAt =
            DateTime.UtcNow;

        try
        {
            await files.UpdateAsync(
                existing);
        }
        catch
        {
            await TryDeleteStoredFileAsync(
                newStoredFileName);

            throw;
        }

        await TryDeleteStoredFileAsync(
            oldStoredFileName);

        var isFavorite =
            await files.GetFavoriteAsync(
                userId,
                fileId) is not null;

        return ToResponse(
            existing,
            isFavorite,
            true);
    }

    public async Task<IReadOnlyList<FileResponse>>
        GetGalleryAsync(
            int userId)
    {
        var galleryFiles =
            await files.GetByUserIdAsync(
                userId);

        var favoriteIds =
            await files.GetFavoriteFileIdsByUserIdAsync(
                userId);

        var favoriteIdSet =
            favoriteIds.ToHashSet();

        return galleryFiles
            .Select(
                file =>
                    ToResponse(
                        file,
                        favoriteIdSet.Contains(
                            file.Id),
                        true))
            .ToList();
    }

    public async Task<FileResponse> GetAsync(
        long fileId,
        int userId,
        UserRole userRole)
    {
        var file =
            await GetAuthorizedFileAsync(
                fileId,
                userId,
                userRole);

        var isFavorite =
            await files.GetFavoriteAsync(
                userId,
                fileId) is not null;

        return ToResponse(
            file,
            isFavorite,
            true);
    }

    public async Task<FileDownloadResult>
        DownloadAsync(
            long fileId,
            int userId,
            UserRole userRole)
    {
        var file =
            await GetAuthorizedFileAsync(
                fileId,
                userId,
                userRole);

        var content =
            await storage.GetAsync(
                file.StoredFileName);

        return new FileDownloadResult(
            content,
            file.ContentType,
            file.OriginalFileName);
    }

    public async Task DeleteAsync(
        long fileId,
        int userId,
        UserRole userRole)
    {
        var file =
            await GetAuthorizedFileAsync(
                fileId,
                userId,
                userRole);

        await files.DeleteAsync(
            file);

        await TryDeleteStoredFileAsync(
            file.StoredFileName);
    }

    public async Task<IReadOnlyList<FileResponse>>
        GetAllAsync() =>
        (await files.GetAllAsync())
            .Select(
                file =>
                    ToResponse(
                        file,
                        false,
                        true))
            .ToList();

    public async Task<IReadOnlyList<FileResponse>>
        GetFavoritesAsync(
            int userId,
            UserRole userRole)
    {
        var favoriteFiles =
            await files.GetFavoriteFilesByUserIdAsync(
                userId);

        var result =
            new List<FileResponse>();

        foreach (var file in favoriteFiles)
        {
            var permissions =
                await GetFilePermissionsAsync(
                    file,
                    userId,
                    userRole);

            if (!permissions.CanView)
            {
                continue;
            }

            result.Add(
                ToResponse(
                    file,
                    true,
                    permissions.CanManage));
        }

        return result;
    }

    public async Task AddFavoriteAsync(
        long fileId,
        int userId,
        UserRole userRole)
    {
        var file =
            await files.GetByIdAsync(
                fileId)
            ?? throw new NotFoundException(
                "The requested file was not found.");

        var permissions =
            await GetFilePermissionsAsync(
                file,
                userId,
                userRole);

        if (!permissions.CanView)
        {
            throw new ForbiddenException(
                "You are not allowed to favorite this file.");
        }

        var existing =
            await files.GetFavoriteAsync(
                userId,
                fileId);

        if (existing is not null)
        {
            return;
        }

        await files.AddFavoriteAsync(
            new Favorite
            {
                UserId =
                    userId,

                FileId =
                    fileId,

                FavoritedAt =
                    DateTime.UtcNow
            });
    }

    public async Task RemoveFavoriteAsync(
        long fileId,
        int userId)
    {
        var favorite =
            await files.GetFavoriteAsync(
                userId,
                fileId);

        if (favorite is null)
        {
            return;
        }

        await files.DeleteFavoriteAsync(
            favorite);
    }

    private async Task<FileMetadata>
        GetAuthorizedFileAsync(
            long fileId,
            int userId,
            UserRole userRole)
    {
        var file =
            await files.GetByIdAsync(
                fileId)
            ?? throw new NotFoundException(
                "The requested file was not found.");

        if (userRole != UserRole.Admin &&
            file.UploadedBy != userId)
        {
            throw new ForbiddenException(
                "You are not allowed to access this file.");
        }

        return file;
    }

    private async Task<(
        bool CanView,
        bool CanManage)>
        GetFilePermissionsAsync(
            FileMetadata file,
            int userId,
            UserRole userRole)
    {
        if (userRole == UserRole.Admin)
        {
            return (true, true);
        }

        if (file.AlbumId is null)
        {
            var ownsFile =
                file.UploadedBy == userId;

            return (
                ownsFile,
                ownsFile);
        }

        var album =
            await albums.GetByIdAsync(
                file.AlbumId.Value);

        if (album is null)
        {
            return (false, false);
        }

        if (album.CreatedBy == userId)
        {
            return (true, true);
        }

        var access =
            await albums.GetAccessAsync(
                file.AlbumId.Value,
                userId);

        return (
            access?.CanView == true,
            false);
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
        bool isFavorite,
        bool canManage)
    {
        var url =
            file.AlbumId.HasValue
                ? $"/api/albums/{file.AlbumId.Value}/files/{file.Id}"
                : $"/api/files/{file.Id}";

        var downloadUrl =
            file.AlbumId.HasValue
                ? $"/api/albums/{file.AlbumId.Value}/files/{file.Id}/download"
                : $"/api/files/{file.Id}/download";

        return new FileResponse(
            file.Id,
            file.OriginalFileName,
            file.ContentType,
            file.FileSize,
            file.UploadedAt,
            url,
            downloadUrl,
            isFavorite,
            canManage);
    }
}