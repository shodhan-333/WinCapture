using Microsoft.EntityFrameworkCore;
using WinCapture.Data;
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

    // Returns the files belonging to the specified album, newest first.
    public async Task<IReadOnlyList<FileMetadata>> GetByAlbumIdAsync(long albumId)
    {
        return await db.Files
            .AsNoTracking()
            .Where(file => file.AlbumId == albumId)
            .OrderByDescending(file => file.UploadedAt)
            .ToListAsync();
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

    // Returns the user's favorite files, ordered by when they were favorited.
    public async Task<IReadOnlyList<FileMetadata>> GetFavoriteFilesByUserIdAsync(int userId)
    {
        return await db.Favorites
            .AsNoTracking()
            .Include(favorite => favorite.File)
            .Where(favorite => favorite.UserId == userId)
            .OrderByDescending(favorite => favorite.FavoritedAt)
            .Select(favorite => favorite.File)
            .ToListAsync();
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