using WinCapture.Models;

namespace WinCapture.Repositories;

public interface IUserRepository
{
    // Retrieves a user by email address, if one exists.
    Task<User?> GetByEmailAsync(string email);

    // Retrieves a user by their Microsoft Entra object ID, if one exists.
    Task<User?> GetByEntraObjectIdAsync(string entraObjectId);

    // Adds a new user to the database.
    Task AddAsync(User user);

    // Updates an existing user's details in the database.
    Task UpdateAsync(User user);
}