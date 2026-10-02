using WinCapture.Models;

namespace WinCapture.Repositories;

public interface IUserRepository
{
    Task<User?> GetByEmailAsync(string email);

    Task<User?> GetByEntraObjectIdAsync(
        string entraObjectId);

    Task AddAsync(User user);

    Task UpdateAsync(User user);
}