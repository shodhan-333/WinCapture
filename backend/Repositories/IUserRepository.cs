using WinCapture.Models;

namespace WinCapture.Repositories;

public interface IUserRepository
{
    Task<User?> GetByEmailAsync(string email);

    Task AddAsync(User user);

    Task UpdateAsync(User user);
}