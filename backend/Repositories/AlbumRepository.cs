using Microsoft.EntityFrameworkCore;
using WinCapture.Data;
using WinCapture.Models;

namespace WinCapture.Repositories;

public sealed class AlbumRepository(
    WinCaptureDbContext db) : IAlbumRepository
{
    public async Task AddAsync(Album album)
    {
        db.Albums.Add(album);
        await db.SaveChangesAsync();
    }

    public async Task<Album?> GetByIdAsync(long albumId) =>
        await db.Albums
            .Include(album => album.Owner)
            .SingleOrDefaultAsync(
                album => album.Id == albumId);

    public async Task<IReadOnlyList<Album>>
        GetAccessibleByUserIdAsync(int userId) =>
        await db.Albums
            .AsNoTracking()
            .Include(album => album.Owner)
            .Where(album =>
                album.CreatedBy == userId ||
                album.Access.Any(access =>
                    access.UserId == userId &&
                    access.CanView))
            .OrderByDescending(
                album => album.CreatedAt)
            .ToListAsync();

    public async Task<IReadOnlyList<Album>>
        GetAllAsync() =>
        await db.Albums
            .AsNoTracking()
            .Include(album => album.Owner)
            .OrderByDescending(
                album => album.CreatedAt)
            .ToListAsync();

    public async Task UpdateAsync(Album album)
    {
        db.Albums.Update(album);
        await db.SaveChangesAsync();
    }

    public async Task DeleteAsync(Album album)
    {
        db.Albums.Remove(album);
        await db.SaveChangesAsync();
    }

    public async Task<AlbumAccess?> GetAccessAsync(
        long albumId,
        int userId) =>
        await db.AlbumAccess
            .SingleOrDefaultAsync(access =>
                access.AlbumId == albumId &&
                access.UserId == userId);

    public async Task<IReadOnlyList<AlbumAccess>>
        GetAccessListAsync(long albumId) =>
        await db.AlbumAccess
            .AsNoTracking()
            .Include(access => access.User)
            .Where(access =>
                access.AlbumId == albumId)
            .OrderBy(access => access.User.Name)
            .ToListAsync();

    public async Task AddAccessAsync(AlbumAccess access)
    {
        db.AlbumAccess.Add(access);
        await db.SaveChangesAsync();
    }

    public async Task UpdateAccessAsync(AlbumAccess access)
    {
        db.AlbumAccess.Update(access);
        await db.SaveChangesAsync();
    }

    public async Task DeleteAccessAsync(AlbumAccess access)
    {
        db.AlbumAccess.Remove(access);
        await db.SaveChangesAsync();
    }
}
