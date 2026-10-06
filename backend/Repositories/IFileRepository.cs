using WinCapture.Models;

namespace WinCapture.Repositories;

public interface IFileRepository
{
    Task AddAsync(FileMetadata file);

    Task<FileMetadata?> GetByIdAsync(
        long fileId);

    Task<IReadOnlyList<FileMetadata>>
        GetByUserIdAsync(
            int userId);

    Task<IReadOnlyList<FileMetadata>>
        GetByAlbumIdAsync(
            long albumId);

    Task<IReadOnlyList<FileMetadata>>
        GetAllAsync();

    Task UpdateAsync(
        FileMetadata file);

    Task DeleteAsync(
        FileMetadata file);

    Task<IReadOnlyList<long>>
        GetFavoriteFileIdsByUserIdAsync(
            int userId);

    Task<IReadOnlyList<FileMetadata>>
        GetFavoriteFilesByUserIdAsync(
            int userId);

    Task<Favorite?> GetFavoriteAsync(
        int userId,
        long fileId);

    Task AddFavoriteAsync(
        Favorite favorite);

    Task DeleteFavoriteAsync(
        Favorite favorite);
}