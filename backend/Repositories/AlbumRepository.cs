using Microsoft.EntityFrameworkCore;
using WinCapture.Data;
using WinCapture.Models;

namespace WinCapture.Repositories;

public sealed class AlbumRepository(WinCaptureDbContext db) : IAlbumRepository
{
    // Adds a new album to the database and saves the changes.
    public async Task AddAsync(Album album)
    {
        db.Albums.Add(album);
        await db.SaveChangesAsync();
    }

    // Gets an album by ID and includes its owner details.
    public async Task<Album?> GetByIdAsync(long albumId)
    {
        return await db.Albums
            .Include(album => album.Owner)
            .SingleOrDefaultAsync(album => album.Id == albumId);
    }

    // Returns albums owned by the user or shared with them with view permission.
    public async Task<IReadOnlyList<Album>> GetAccessibleByUserIdAsync(int userId)
    {
        return await db.Albums
            .AsNoTracking()
            .Include(album => album.Owner)
            .Where(album =>
                album.CreatedBy == userId ||
                album.Access.Any(access =>
                    access.UserId == userId &&
                    access.CanView))
            .OrderByDescending(album => album.CreatedAt)
            .ToListAsync();
    }

    // Returns only the albums owned by the specified user, newest first.
    public async Task<IReadOnlyList<Album>> GetOwnedByUserIdAsync(int userId)
    {
        return await db.Albums
            .AsNoTracking()
            .Include(album => album.Owner)
            .Where(album => album.CreatedBy == userId)
            .OrderByDescending(album => album.CreatedAt)
            .ToListAsync();
    }

    // Returns all albums with their owner details, newest first.
    public async Task<IReadOnlyList<Album>> GetAllAsync()
    {
        return await db.Albums
            .AsNoTracking()
            .Include(album => album.Owner)
            .OrderByDescending(album => album.CreatedAt)
            .ToListAsync();
    }

    // Updates the album in the database and saves the changes.
    public async Task UpdateAsync(Album album)
    {
        db.Albums.Update(album);
        await db.SaveChangesAsync();
    }

    // Removes the album from the database and saves the changes.
    public async Task DeleteAsync(Album album)
    {
        db.Albums.Remove(album);
        await db.SaveChangesAsync();
    }

    // Gets a user's access entry for the specified album, if one exists.
    public async Task<AlbumAccess?> GetAccessAsync(long albumId, int userId)
    {
        return await db.AlbumAccess
            .SingleOrDefaultAsync(access =>
                access.AlbumId == albumId &&
                access.UserId == userId);
    }

    // Returns the access entries for an album with user details, ordered by name.
    public async Task<IReadOnlyList<AlbumAccess>> GetAccessListAsync(long albumId)
    {
        return await db.AlbumAccess
            .AsNoTracking()
            .Include(access => access.User)
            .Where(access => access.AlbumId == albumId)
            .OrderBy(access => access.User.Name)
            .ToListAsync();
    }

    // Grants a user access to an album and saves the changes.
    public async Task AddAccessAsync(AlbumAccess access)
    {
        db.AlbumAccess.Add(access);
        await db.SaveChangesAsync();
    }

    // Updates an album access entry and saves the changes.
    public async Task UpdateAccessAsync(AlbumAccess access)
    {
        db.AlbumAccess.Update(access);
        await db.SaveChangesAsync();
    }

    // Removes an album access entry and saves the changes.
    public async Task DeleteAccessAsync(AlbumAccess access)
    {
        db.AlbumAccess.Remove(access);
        await db.SaveChangesAsync();
    }
}