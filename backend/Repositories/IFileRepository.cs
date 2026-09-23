using WinCapture.Models;

namespace WinCapture.Repositories;

public interface IFileRepository
{
    Task AddAsync(FileMetadata file);
    Task<FileMetadata?> GetByIdAsync(long fileId);
    Task<IReadOnlyList<FileMetadata>> GetByUserIdAsync(int userId);
    Task<IReadOnlyList<FileMetadata>> GetAllAsync();
    Task UpdateAsync(FileMetadata file);
    Task DeleteAsync(FileMetadata file);
}
