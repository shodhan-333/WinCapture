using Microsoft.EntityFrameworkCore;
using WinCapture.Data;
using WinCapture.DTOs.Common;
using WinCapture.Models;

namespace WinCapture.Repositories;

public sealed class FileRepository(WinCaptureDbContext db) : IFileRepository
{
    // Adds the file metadata to the database and saves the changes.
    public async Task AddAsync(FileMetadata file)
    {
        db.Files.Add(file);
        await db.SaveChangesAsync();
    }

    // Retrieves a file by ID without tracking it because the query is read-only.
    public async Task<FileMetadata?> GetByIdAsync(long fileId)
    {
        return await db.Files
            .AsNoTracking()
            .SingleOrDefaultAsync(file => file.Id == fileId);
    }

    // Returns the files uploaded by the specified user, newest first.
    public async Task<IReadOnlyList<FileMetadata>> GetByUserIdAsync(int userId)
    {
        return await db.Files
            .AsNoTracking()
            .Where(file => file.UploadedBy == userId)
            .OrderByDescending(file => file.UploadedAt)
            .ToListAsync();
    }

    public async Task<PagedResponse<FileMetadata>> GetPagedByUserIdAsync(
        int userId,
        PaginationQuery pagination)
    {
        return await db.Files
            .AsNoTracking()
            .Where(file => file.UploadedBy == userId)
            .ApplyFileFilters(pagination)
            .OrderByDescending(file => file.UploadedAt)
            .ThenByDescending(file => file.Id)
            .ToPagedResponseAsync(pagination);
    }

    // Returns the files belonging to the specified album, newest first.
    public async Task<IReadOnlyList<FileMetadata>> GetByAlbumIdAsync(long albumId)
    {
        return await db.Files
            .AsNoTracking()
            .Where(file => file.AlbumId == albumId)
            .OrderByDescending(file => file.UploadedAt)
            .ToListAsync();
    }

    public async Task<PagedResponse<FileMetadata>> GetPagedByAlbumIdAsync(
        long albumId,
        PaginationQuery pagination)
    {
        return await db.Files
            .AsNoTracking()
            .Where(file => file.AlbumId == albumId)
            .ApplyFileFilters(pagination)
            .OrderByDescending(file => file.UploadedAt)
            .ThenByDescending(file => file.Id)
            .ToPagedResponseAsync(pagination);
    }

    // Returns all files with their uploader and album details for admin management.
    public async Task<IReadOnlyList<FileMetadata>> GetAllAsync()
    {
        return await db.Files
            .AsNoTracking()
            .Include(file => file.User)
            .Include(file => file.Album)
            .OrderByDescending(file => file.UploadedAt)
            .ToListAsync();
    }

    public async Task<PagedResponse<FileMetadata>> GetPagedAllAsync(PaginationQuery pagination)
    {
        return await db.Files
            .AsNoTracking()
            .Include(file => file.User)
            .Include(file => file.Album)
            .ApplyFileCategory(pagination)
            .Where(file =>
                string.IsNullOrWhiteSpace(pagination.Search) ||
                file.OriginalFileName.Contains(pagination.Search) ||
                file.ContentType.Contains(pagination.Search) ||
                file.Id.ToString().Contains(pagination.Search) ||
                file.UploadedBy.ToString().Contains(pagination.Search) ||
                file.User.Name.Contains(pagination.Search) ||
                (file.AlbumId != null && file.AlbumId.ToString()!.Contains(pagination.Search)) ||
                (file.Album != null && file.Album.AlbumName.Contains(pagination.Search)))
            .OrderByDescending(file => file.UploadedAt)
            .ThenByDescending(file => file.Id)
            .ToPagedResponseAsync(pagination);
    }

    // Returns the specified admin's uploaded files with uploader and album details.
    public async Task<IReadOnlyList<FileMetadata>> GetAdminFilesByUploaderIdAsync(int userId)
    {
        return await db.Files
            .AsNoTracking()
            .Include(file => file.User)
            .Include(file => file.Album)
            .Where(file => file.UploadedBy == userId)
            .OrderByDescending(file => file.UploadedAt)
            .ToListAsync();
    }

    public async Task<PagedResponse<FileMetadata>> GetPagedAdminFilesByUploaderIdAsync(
        int userId,
        PaginationQuery pagination)
    {
        return await db.Files
            .AsNoTracking()
            .Include(file => file.User)
            .Include(file => file.Album)
            .Where(file => file.UploadedBy == userId)
            .ApplyFileCategory(pagination)
            .Where(file =>
                string.IsNullOrWhiteSpace(pagination.Search) ||
                file.OriginalFileName.Contains(pagination.Search) ||
                file.ContentType.Contains(pagination.Search) ||
                file.Id.ToString().Contains(pagination.Search) ||
                file.UploadedBy.ToString().Contains(pagination.Search) ||
                file.User.Name.Contains(pagination.Search) ||
                (file.AlbumId != null && file.AlbumId.ToString()!.Contains(pagination.Search)) ||
                (file.Album != null && file.Album.AlbumName.Contains(pagination.Search)))
            .OrderByDescending(file => file.UploadedAt)
            .ThenByDescending(file => file.Id)
            .ToPagedResponseAsync(pagination);
    }

    // Updates the file metadata in the database and saves the changes.
    public async Task UpdateAsync(FileMetadata file)
    {
        db.Files.Update(file);
        await db.SaveChangesAsync();
    }

    // Removes the file metadata from the database and saves the changes.
    public async Task DeleteAsync(FileMetadata file)
    {
        db.Files.Remove(file);
        await db.SaveChangesAsync();
    }

    // Returns the IDs of files favorited by the specified user.
    public async Task<IReadOnlyList<long>> GetFavoriteFileIdsByUserIdAsync(int userId)
    {
        return await db.Favorites
            .AsNoTracking()
            .Where(favorite => favorite.UserId == userId)
            .Select(favorite => favorite.FileId)
            .ToListAsync();
    }

    public async Task<IReadOnlyList<long>> GetFavoriteFileIdsByUserIdAsync(
        int userId,
        IReadOnlyCollection<long> fileIds)
    {
        return await db.Favorites
            .AsNoTracking()
            .Where(favorite => favorite.UserId == userId && fileIds.Contains(favorite.FileId))
            .Select(favorite => favorite.FileId)
            .ToListAsync();
    }

    // Returns the user's favorite files, ordered by when they were favorited.
    public async Task<IReadOnlyList<FileMetadata>> GetFavoriteFilesByUserIdAsync(int userId)
    {
        return await db.Favorites
            .AsNoTracking()
            .Include(favorite => favorite.File)
                .ThenInclude(file => file.Album)
                    .ThenInclude(album => album!.Access.Where(access => access.UserId == userId))
            .Where(favorite => favorite.UserId == userId)
            .OrderByDescending(favorite => favorite.FavoritedAt)
            .Select(favorite => favorite.File)
            .ToListAsync();
    }

    public async Task<PagedResponse<FileMetadata>> GetPagedFavoriteFilesByUserIdAsync(
        int userId,
        UserRole userRole,
        PaginationQuery pagination)
    {
        IQueryable<Favorite> query = db.Favorites
            .AsNoTracking()
            .Where(favorite => favorite.UserId == userId);

        // Keep the role check out of the translated SQL predicate. Besides making the
        // access rule easier to read, this avoids provider-specific enum translation.
        if (userRole != UserRole.Admin)
        {
            query = query.Where(favorite =>
                (favorite.File.AlbumId == null && favorite.File.UploadedBy == userId) ||
                (favorite.File.Album != null &&
                    (favorite.File.Album.CreatedBy == userId ||
                     favorite.File.Album.Access.Any(access =>
                         access.UserId == userId && access.CanView))));
        }

        var search = pagination.Search?.Trim();
        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(favorite =>
                favorite.File.OriginalFileName.Contains(search) ||
                favorite.File.ContentType.Contains(search) ||
                favorite.File.Id.ToString().Contains(search));
        }

        query = pagination.Category switch
        {
            "Images" => query.Where(favorite =>
                favorite.File.OriginalFileName.EndsWith(".jpg") ||
                favorite.File.OriginalFileName.EndsWith(".jpeg") ||
                favorite.File.OriginalFileName.EndsWith(".png") ||
                favorite.File.OriginalFileName.EndsWith(".webp")),
            "Documents" => query.Where(favorite =>
                favorite.File.OriginalFileName.EndsWith(".pdf") ||
                favorite.File.OriginalFileName.EndsWith(".txt") ||
                favorite.File.OriginalFileName.EndsWith(".csv") ||
                favorite.File.OriginalFileName.EndsWith(".docx") ||
                favorite.File.OriginalFileName.EndsWith(".xlsx") ||
                favorite.File.OriginalFileName.EndsWith(".pptx")),
            "Videos" => query.Where(favorite =>
                favorite.File.OriginalFileName.EndsWith(".mp4") ||
                favorite.File.OriginalFileName.EndsWith(".mov") ||
                favorite.File.OriginalFileName.EndsWith(".webm")),
            "Audio" => query.Where(favorite =>
                favorite.File.OriginalFileName.EndsWith(".mp3") ||
                favorite.File.OriginalFileName.EndsWith(".wav") ||
                favorite.File.OriginalFileName.EndsWith(".m4a")),
            "Archives" => query.Where(favorite =>
                favorite.File.OriginalFileName.EndsWith(".zip")),
            _ => query
        };

        var totalItems = await query.CountAsync();
        var pageCount = Math.Max(1, (int)Math.Ceiling(totalItems / (double)pagination.PageSize));
        var page = Math.Clamp(pagination.Page, 1, pageCount);
        var favoriteRows = await query
            .OrderByDescending(favorite => favorite.FavoritedAt)
            .ThenByDescending(favorite => favorite.FileId)
            .Skip((int)Math.Min((long)(page - 1) * pagination.PageSize, int.MaxValue))
            .Take(pagination.PageSize)
            .Select(favorite => new { favorite.FileId, favorite.FavoritedAt })
            .ToListAsync();

        var fileIds = favoriteRows.Select(favorite => favorite.FileId).ToArray();
        var loadedFiles = await db.Files
            .AsNoTracking()
            .Where(file => fileIds.Contains(file.Id))
            .Include(file => file.Album)
                .ThenInclude(album => album!.Access.Where(access => access.UserId == userId))
            .ToListAsync();
        var filesById = loadedFiles.ToDictionary(file => file.Id);
        var orderedFiles = favoriteRows
            .Where(favorite => filesById.ContainsKey(favorite.FileId))
            .Select(favorite => filesById[favorite.FileId])
            .ToList();

        return new PagedResponse<FileMetadata>(
            orderedFiles,
            totalItems,
            page,
            pagination.PageSize,
            pageCount);
    }



    // Finds the favorite entry for a specific user and file, if one exists.
    public async Task<Favorite?> GetFavoriteAsync(int userId, long fileId)
    {
        return await db.Favorites
            .SingleOrDefaultAsync(favorite =>
                favorite.UserId == userId &&
                favorite.FileId == fileId);
    }

    // Adds a favorite entry to the database and saves the changes.
    public async Task AddFavoriteAsync(Favorite favorite)
    {
        db.Favorites.Add(favorite);
        await db.SaveChangesAsync();
    }

    // Removes a favorite entry from the database and saves the changes.
    public async Task DeleteFavoriteAsync(Favorite favorite)
    {
        db.Favorites.Remove(favorite);
        await db.SaveChangesAsync();
    }
}
