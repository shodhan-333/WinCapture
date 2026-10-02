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
}