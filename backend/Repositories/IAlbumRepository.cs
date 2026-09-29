using WinCapture.Models;

namespace WinCapture.Repositories;

public interface IAlbumRepository
{
    Task AddAsync(Album album);

    Task<Album?> GetByIdAsync(long albumId);

    Task<IReadOnlyList<Album>> GetAccessibleByUserIdAsync(int userId);

    Task<IReadOnlyList<Album>> GetAllAsync();

    Task UpdateAsync(Album album);

    Task DeleteAsync(Album album);

    Task<AlbumAccess?> GetAccessAsync(
        long albumId,
        int userId);

    Task<IReadOnlyList<AlbumAccess>> GetAccessListAsync(
        long albumId);

    Task AddAccessAsync(AlbumAccess access);

    Task UpdateAccessAsync(AlbumAccess access);

    Task DeleteAccessAsync(AlbumAccess access);
}
