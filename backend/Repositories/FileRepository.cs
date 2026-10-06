using Microsoft.EntityFrameworkCore;
using WinCapture.Data;
using WinCapture.Models;

namespace WinCapture.Repositories;

public sealed class FileRepository(
    WinCaptureDbContext db) : IFileRepository
{
    public async Task AddAsync(
        FileMetadata file)
    {
        db.Files.Add(file);

        await db.SaveChangesAsync();
    }

    public async Task<FileMetadata?> GetByIdAsync(
        long fileId) =>
        await db.Files
            .AsNoTracking()
            .SingleOrDefaultAsync(
                file => file.Id == fileId);

    public async Task<IReadOnlyList<FileMetadata>>
        GetByUserIdAsync(
            int userId) =>
        await db.Files
            .AsNoTracking()
            .Where(
                file =>
                    file.UploadedBy == userId)
            .OrderByDescending(
                file => file.UploadedAt)
            .ToListAsync();

    public async Task<IReadOnlyList<FileMetadata>>
        GetByAlbumIdAsync(
            long albumId) =>
        await db.Files
            .AsNoTracking()
            .Where(
                file =>
                    file.AlbumId == albumId)
            .OrderByDescending(
                file => file.UploadedAt)
            .ToListAsync();

    public async Task<IReadOnlyList<FileMetadata>>
        GetAllAsync() =>
        await db.Files
            .AsNoTracking()
            .OrderByDescending(
                file => file.UploadedAt)
            .ToListAsync();

    public async Task UpdateAsync(
        FileMetadata file)
    {
        db.Files.Update(file);

        await db.SaveChangesAsync();
    }

    public async Task DeleteAsync(
        FileMetadata file)
    {
        db.Files.Remove(file);

        await db.SaveChangesAsync();
    }

    public async Task<IReadOnlyList<long>>
        GetFavoriteFileIdsByUserIdAsync(
            int userId) =>
        await db.Favorites
            .AsNoTracking()
            .Where(
                favorite =>
                    favorite.UserId == userId)
            .Select(
                favorite =>
                    favorite.FileId)
            .ToListAsync();

    public async Task<IReadOnlyList<FileMetadata>>
        GetFavoriteFilesByUserIdAsync(
            int userId) =>
        await db.Favorites
            .AsNoTracking()
            .Include(
                favorite =>
                    favorite.File)
            .Where(
                favorite =>
                    favorite.UserId == userId)
            .OrderByDescending(
                favorite =>
                    favorite.FavoritedAt)
            .Select(
                favorite =>
                    favorite.File)
            .ToListAsync();

    public async Task<Favorite?> GetFavoriteAsync(
        int userId,
        long fileId) =>
        await db.Favorites
            .SingleOrDefaultAsync(
                favorite =>
                    favorite.UserId == userId &&
                    favorite.FileId == fileId);

    public async Task AddFavoriteAsync(
        Favorite favorite)
    {
        db.Favorites.Add(favorite);

        await db.SaveChangesAsync();
    }

    public async Task DeleteFavoriteAsync(
        Favorite favorite)
    {
        db.Favorites.Remove(favorite);

        await db.SaveChangesAsync();
    }
}