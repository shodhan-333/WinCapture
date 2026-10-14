using Microsoft.AspNetCore.Http;
using WinCapture.DTOs.Common;
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
    // Validates the file, stores it in Azure Blob Storage, and saves its metadata.
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
        }
        catch
        {
            await TryDeleteStoredFileAsync(storedFileName);
            throw;
        }

        return ToResponse(metadata, false, true);
    }

    // Replaces the file and removes the old blob after the database update succeeds.
    public async Task<FileResponse> ReplaceAsync(
        long fileId,
        IFormFile file,
        int userId,
        UserRole userRole)
    {
        var existing = await GetAuthorizedFileAsync(
            fileId,
            userId,
            userRole,
            requireManage: true);

        await validator.ValidateAsync(file);

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

        var isFavorite = await files.GetFavoriteAsync(userId, fileId) is not null;

        return ToResponse(existing, isFavorite, true);
    }

    // Returns the current user's uploaded files with their favorite status.
    public async Task<IReadOnlyList<FileResponse>> GetGalleryAsync(int userId)
    {
        var galleryFiles = await files.GetByUserIdAsync(userId);
        var favoriteIds = await files.GetFavoriteFileIdsByUserIdAsync(userId);
        var favoriteIdSet = favoriteIds.ToHashSet();

        return galleryFiles
            .Select(file => ToResponse(
                file,
                favoriteIdSet.Contains(file.Id),
                true))
            .ToList();
    }

    public async Task<PagedResponse<FileResponse>> GetGalleryPageAsync(
        int userId,
        PaginationQuery pagination)
    {
        var page = await files.GetPagedByUserIdAsync(userId, pagination);
        var ids = page.Items.Select(file => file.Id).ToArray();
        var favoriteIds = (await files.GetFavoriteFileIdsByUserIdAsync(userId, ids)).ToHashSet();

        return new PagedResponse<FileResponse>(
            page.Items.Select(file => ToResponse(file, favoriteIds.Contains(file.Id), true)).ToList(),
            page.TotalItems,
            page.Page,
            page.PageSize,
            page.PageCount);
    }

    // Returns a file after checking access permissions and retrieving its favorite status.
    public async Task<FileResponse> GetAsync(
        long fileId,
        int userId,
        UserRole userRole)
    {
        var file = await GetAuthorizedFileAsync(fileId, userId, userRole);
        var isFavorite = await files.GetFavoriteAsync(userId, fileId) is not null;

        var permissions = await GetFilePermissionsAsync(file, userId, userRole);

        return ToResponse(file, isFavorite, permissions.CanManage);
    }

    // Checks file and album download permissions before returning the file content.
    public async Task<FileDownloadResult> DownloadAsync(
        long fileId,
        int userId,
        UserRole userRole)
    {
        var file = await GetAuthorizedFileAsync(fileId, userId, userRole);

        if (userRole != UserRole.Admin && file.AlbumId.HasValue)
        {
            var album = await albums.GetByIdAsync(file.AlbumId.Value);

            if (album is null)
            {
                throw new NotFoundException("The requested album was not found.");
            }

            if (album.CreatedBy != userId)
            {
                var access = await albums.GetAccessAsync(file.AlbumId.Value, userId);

                if (access?.CanDownload != true)
                {
                    throw new ForbiddenException("You are not allowed to download this file.");
                }
            }
        }

        var content = await storage.GetAsync(file.StoredFileName);

        return new FileDownloadResult(
            content,
            file.ContentType,
            file.OriginalFileName);
    }

    // Commits metadata deletion first so a database failure cannot leave a live record pointing to missing content.
    public async Task DeleteAsync(
        long fileId,
        int userId,
        UserRole userRole)
    {
        var file = await GetAuthorizedFileAsync(
            fileId,
            userId,
            userRole,
            requireManage: true);

        await files.DeleteAsync(file);
        await TryDeleteStoredFileAsync(file.StoredFileName);
    }

    // Returns all files with their uploader and album details for admin management.
    public async Task<IReadOnlyList<AdminFileResponse>> GetAllAsync()
    {
        var allFiles = await files.GetAllAsync();

        return allFiles
            .Select(ToAdminResponse)
            .ToList();
    }

    public async Task<PagedResponse<AdminFileResponse>> GetAllPageAsync(PaginationQuery pagination)
    {
        var page = await files.GetPagedAllAsync(pagination);
        return MapAdminPage(page);
    }

    // Returns the files uploaded by the specified admin.
    public async Task<IReadOnlyList<AdminFileResponse>> GetAdminFilesByUploaderIdAsync(int userId)
    {
        var adminFiles = await files.GetAdminFilesByUploaderIdAsync(userId);

        return adminFiles
            .Select(ToAdminResponse)
            .ToList();
    }

    public async Task<PagedResponse<AdminFileResponse>> GetAdminFilesByUploaderIdPageAsync(
        int userId,
        PaginationQuery pagination)
    {
        var page = await files.GetPagedAdminFilesByUploaderIdAsync(userId, pagination);
        return MapAdminPage(page);
    }

    // Returns the user's favorite files that they are still allowed to view.
    public async Task<IReadOnlyList<FileResponse>> GetFavoritesAsync(
        int userId,
        UserRole userRole)
    {
        var favoriteFiles = await files.GetFavoriteFilesByUserIdAsync(userId);
        var result = new List<FileResponse>();

        foreach (var file in favoriteFiles)
        {
            var permissions = GetLoadedFavoritePermissions(file, userId, userRole);

            if (!permissions.CanView)
            {
                continue;
            }

            result.Add(ToResponse(file, true, permissions.CanManage));
        }

        return result;
    }

    public async Task<PagedResponse<FileResponse>> GetFavoritesPageAsync(
        int userId,
        UserRole userRole,
        PaginationQuery pagination)
    {
        var page = await files.GetPagedFavoriteFilesByUserIdAsync(userId, userRole, pagination);
        var responses = page.Items.Select(file =>
        {
            var permissions = GetLoadedFavoritePermissions(file, userId, userRole);
            return ToResponse(file, true, permissions.CanManage);
        }).ToList();

        return new PagedResponse<FileResponse>(
            responses,
            page.TotalItems,
            page.Page,
            page.PageSize,
            page.PageCount);
    }

    private static PagedResponse<AdminFileResponse> MapAdminPage(
        PagedResponse<FileMetadata> page)
    {
        return new PagedResponse<AdminFileResponse>(
            page.Items.Select(ToAdminResponse).ToList(),
            page.TotalItems,
            page.Page,
            page.PageSize,
            page.PageCount);
    }

    // Uses the album and caller access row loaded with favorite files to avoid per-favorite queries.
    private static (bool CanView, bool CanManage) GetLoadedFavoritePermissions(
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
            var ownsFile = file.UploadedBy == userId;
            return (ownsFile, ownsFile);
        }

        if (file.Album is null)
        {
            return (false, false);
        }

        if (file.Album.CreatedBy == userId)
        {
            return (true, true);
        }

        var access = file.Album.Access.FirstOrDefault(item => item.UserId == userId);
        return (access?.CanView == true, false);
    }

    // Adds a file to the user's favorites if they are allowed to view it.
    public async Task AddFavoriteAsync(
        long fileId,
        int userId,
        UserRole userRole)
    {
        var file = await files.GetByIdAsync(fileId)
            ?? throw new NotFoundException("The requested file was not found.");

        var permissions = await GetFilePermissionsAsync(file, userId, userRole);

        if (!permissions.CanView)
        {
            throw new ForbiddenException("You are not allowed to favorite this file.");
        }

        var existing = await files.GetFavoriteAsync(userId, fileId);

        if (existing is not null)
        {
            return;
        }

        await files.AddFavoriteAsync(new Favorite
        {
            UserId = userId,
            FileId = fileId,
            FavoritedAt = DateTime.UtcNow
        });
    }

    // Removes the file from the user's favorites if it exists.
    public async Task RemoveFavoriteAsync(long fileId, int userId)
    {
        var favorite = await files.GetFavoriteAsync(userId, fileId);

        if (favorite is null)
        {
            return;
        }

        await files.DeleteFavoriteAsync(favorite);
    }

    // Retrieves a file and checks whether the user can view or manage it.
    private async Task<FileMetadata> GetAuthorizedFileAsync(
        long fileId,
        int userId,
        UserRole userRole,
        bool requireManage = false)
    {
        var file = await files.GetByIdAsync(fileId)
            ?? throw new NotFoundException("The requested file was not found.");

        var permissions = await GetFilePermissionsAsync(file, userId, userRole);

        if (!permissions.CanView || (requireManage && !permissions.CanManage))
        {
            throw new ForbiddenException("You are not allowed to access this file.");
        }

        return file;
    }

    // Determines file access based on the user's role, ownership, and album permissions.
    private async Task<(bool CanView, bool CanManage)> GetFilePermissionsAsync(
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
            var ownsFile = file.UploadedBy == userId;

            return (ownsFile, ownsFile);
        }

        var album = await albums.GetByIdAsync(file.AlbumId.Value);

        if (album is null)
        {
            return (false, false);
        }

        if (album.CreatedBy == userId)
        {
            return (true, true);
        }

        var access = await albums.GetAccessAsync(file.AlbumId.Value, userId);

        return (access?.CanView == true, false);
    }

    // Attempts to remove a stored blob during cleanup and logs any failure.
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

    // Builds the file response with the appropriate URLs and user permissions.
    private static FileResponse ToResponse(
        FileMetadata file,
        bool isFavorite,
        bool canManage)
    {
        var url = file.AlbumId.HasValue
            ? $"/api/albums/{file.AlbumId.Value}/files/{file.Id}"
            : $"/api/files/{file.Id}";

        var downloadUrl = file.AlbumId.HasValue
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

    // Maps file metadata and its uploader and album details to the admin response.
    private static AdminFileResponse ToAdminResponse(FileMetadata file)
    {
        return new AdminFileResponse(
            file.Id,
            file.OriginalFileName,
            file.ContentType,
            file.FileSize,
            file.UploadedAt,
            file.UploadedBy,
            file.User.Name,
            file.AlbumId,
            file.Album?.AlbumName);
    }
}
