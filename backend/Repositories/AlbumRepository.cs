using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using WinCapture.Data;
using WinCapture.DTOs.Common;
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

    public async Task<PagedResponse<Album>> GetPagedAccessibleByUserIdAsync(
        int userId,
        PaginationQuery pagination)
    {
        IQueryable<Album> query = db.Albums
            .AsNoTracking()
            .Include(album => album.Owner)
            .Where(album =>
                album.CreatedBy == userId ||
                album.Access.Any(access =>
                    access.UserId == userId &&
                    access.CanView));

        var search = pagination.Search?.Trim();
        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(album =>
                album.AlbumName.Contains(search) ||
                album.Id.ToString().Contains(search) ||
                album.CreatedBy.ToString().Contains(search) ||
                album.Owner.Name.Contains(search));
        }

        return await query
            .OrderBy(AlbumSearchRank(search))
            .ThenByDescending(album => album.CreatedAt)
            .ThenByDescending(album => album.Id)
            .ToPagedResponseAsync(pagination);
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

    public async Task<PagedResponse<Album>> GetPagedOwnedByUserIdAsync(
        int userId,
        PaginationQuery pagination)
    {
        IQueryable<Album> query = db.Albums
            .AsNoTracking()
            .Include(album => album.Owner)
            .Where(album => album.CreatedBy == userId);

        var search = pagination.Search?.Trim();
        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(album =>
                album.AlbumName.Contains(search) ||
                album.Id.ToString().Contains(search) ||
                album.CreatedBy.ToString().Contains(search) ||
                album.Owner.Name.Contains(search));
        }

        return await query
            .OrderBy(AlbumSearchRank(search))
            .ThenByDescending(album => album.CreatedAt)
            .ThenByDescending(album => album.Id)
            .ToPagedResponseAsync(pagination);
    }

    public async Task<PagedResponse<Album>> GetPagedSharedWithUserIdAsync(
        int userId,
        PaginationQuery pagination)
    {
        IQueryable<Album> query = db.Albums
            .AsNoTracking()
            .Include(album => album.Owner)
            .Where(album => album.CreatedBy != userId &&
                album.Access.Any(access => access.UserId == userId && access.CanView));

        var search = pagination.Search?.Trim();
        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(album =>
                album.AlbumName.Contains(search) ||
                album.Id.ToString().Contains(search) ||
                album.CreatedBy.ToString().Contains(search) ||
                album.Owner.Name.Contains(search));
        }

        return await query
            .OrderBy(AlbumSearchRank(search))
            .ThenByDescending(album => album.CreatedAt)
            .ThenByDescending(album => album.Id)
            .ToPagedResponseAsync(pagination);
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

    public async Task<PagedResponse<Album>> GetPagedAllAsync(PaginationQuery pagination)
    {
        IQueryable<Album> query = db.Albums
            .AsNoTracking()
            .Include(album => album.Owner);

        var search = pagination.Search?.Trim();
        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(album =>
                album.AlbumName.Contains(search) ||
                album.Id.ToString().Contains(search) ||
                album.CreatedBy.ToString().Contains(search) ||
                album.Owner.Name.Contains(search));
        }

        return await query
            .OrderBy(AlbumSearchRank(search))
            .ThenByDescending(album => album.CreatedAt)
            .ThenByDescending(album => album.Id)
            .ToPagedResponseAsync(pagination);
    }

    // Rank exact and prefix album-name matches ahead of broader metadata matches.
    private static Expression<Func<Album, int>> AlbumSearchRank(string? search) =>
        album => string.IsNullOrEmpty(search) ? 0 :
            album.AlbumName == search ? 0 :
            album.AlbumName.StartsWith(search) ? 1 :
            album.AlbumName.Contains(search) ? 2 :
            album.Owner.Name.Contains(search) ? 3 : 4;

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
