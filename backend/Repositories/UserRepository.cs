using Microsoft.EntityFrameworkCore;
using WinCapture.Data;
using WinCapture.Models;

namespace WinCapture.Repositories;

public sealed class UserRepository(WinCaptureDbContext db) : IUserRepository
{
    // Finds a user by email address without tracking the entity.
    public async Task<User?> GetByEmailAsync(string email)
    {
        return await db.Users
            .AsNoTracking()
            .SingleOrDefaultAsync(user => user.Email == email);
    }

    // Finds a user by their Microsoft Entra object ID without tracking the entity.
    public async Task<User?> GetByEntraObjectIdAsync(string entraObjectId)
    {
        return await db.Users
            .AsNoTracking()
            .SingleOrDefaultAsync(user => user.EntraObjectId == entraObjectId);
    }

    // Adds a new user to the database and saves the changes.
    public async Task AddAsync(User user)
    {
        db.Users.Add(user);
        await db.SaveChangesAsync();
    }

    // Updates an existing user's details in the database and saves the changes.
    public async Task UpdateAsync(User user)
    {
        db.Users.Update(user);
        await db.SaveChangesAsync();
    }
}