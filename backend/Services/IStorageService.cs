using Microsoft.AspNetCore.Http;

namespace WinCapture.Services;

public interface IStorageService
{
    Task<string> SaveAsync(IFormFile file);
    Task DeleteAsync(string storedFileName);
    Task<Stream> GetAsync(string storedFileName);
}
