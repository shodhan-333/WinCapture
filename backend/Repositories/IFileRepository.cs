using WinCapture.Models;

namespace WinCapture.Repositories;

public interface IFileRepository
{
    // Adds file metadata to the database.
    Task AddAsync(FileMetadata file);

    // Retrieves a file by its ID.
    Task<FileMetadata?> GetByIdAsync(long fileId);

    // Returns the files uploaded by the specified user, newest first.
    Task<IReadOnlyList<FileMetadata>> GetByUserIdAsync(int userId);

    // Returns the files belonging to the specified album, newest first.
    Task<IReadOnlyList<FileMetadata>> GetByAlbumIdAsync(long albumId);

    // Returns all files with their uploader and album details.
    Task<IReadOnlyList<FileMetadata>> GetAllAsync();

    // Returns the specified admin's uploaded files with uploader and album details.
    Task<IReadOnlyList<FileMetadata>> GetAdminFilesByUploaderIdAsync(int userId);

    // Updates file metadata in the database.
    Task UpdateAsync(FileMetadata file);

    // Removes file metadata from the database.
    Task DeleteAsync(FileMetadata file);

    // Returns the IDs of files favorited by the specified user.
    Task<IReadOnlyList<long>> GetFavoriteFileIdsByUserIdAsync(int userId);

    // Returns the user's favorite files, ordered by when they were favorited.
    Task<IReadOnlyList<FileMetadata>> GetFavoriteFilesByUserIdAsync(int userId);

    // Retrieves the favorite entry for a specific user and file, if one exists.
    Task<Favorite?> GetFavoriteAsync(int userId, long fileId);

    // Adds a favorite entry to the database.
    Task AddFavoriteAsync(Favorite favorite);

    // Removes a favorite entry from the database.
    Task DeleteFavoriteAsync(Favorite favorite);
}