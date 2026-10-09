using Microsoft.AspNetCore.Http;

namespace WinCapture.Services;

public interface IStorageService
{
    // Saves the uploaded file and returns the name used to store it.
    Task<string> SaveAsync(IFormFile file);

    // Deletes the specified file from storage.
    Task DeleteAsync(string storedFileName);

    // Retrieves the stored file content as a stream.
    Task<Stream> GetAsync(string storedFileName);
}