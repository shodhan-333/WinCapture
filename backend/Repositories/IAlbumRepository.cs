using WinCapture.Models;

namespace WinCapture.Repositories;

public interface IAlbumRepository
{
    // Adds a new album to the database.
    Task AddAsync(Album album);

    // Retrieves an album by ID, including its owner details.
    Task<Album?> GetByIdAsync(long albumId);

    // Returns albums owned by the user or shared with them with view permission.
    Task<IReadOnlyList<Album>> GetAccessibleByUserIdAsync(int userId);

    // Returns only the albums owned by the specified user.
    Task<IReadOnlyList<Album>> GetOwnedByUserIdAsync(int userId);

    // Returns all albums in the database.
    Task<IReadOnlyList<Album>> GetAllAsync();

    // Updates an existing album in the database.
    Task UpdateAsync(Album album);

    // Deletes an album from the database.
    Task DeleteAsync(Album album);

    // Retrieves a user's access entry for an album, if one exists.
    Task<AlbumAccess?> GetAccessAsync(long albumId, int userId);

    // Returns all access entries for an album, including user details.
    Task<IReadOnlyList<AlbumAccess>> GetAccessListAsync(long albumId);

    // Adds an access entry to share an album with a user.
    Task AddAccessAsync(AlbumAccess access);

    // Updates an existing album access entry.
    Task UpdateAccessAsync(AlbumAccess access);

    // Removes an access entry to revoke a user's album access.
    Task DeleteAccessAsync(AlbumAccess access);
}