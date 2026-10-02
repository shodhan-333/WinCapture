using Microsoft.EntityFrameworkCore;
using WinCapture.Data;
using WinCapture.Models;

namespace WinCapture.Repositories;

public sealed class UserRepository(
    WinCaptureDbContext db) : IUserRepository
{
    public async Task<User?> GetByEmailAsync(
        string email) =>
        await db.Users
            .AsNoTracking()
            .SingleOrDefaultAsync(
                user => user.Email == email);

    public async Task<User?> GetByEntraObjectIdAsync(
        string entraObjectId) =>
        await db.Users
            .AsNoTracking()
            .SingleOrDefaultAsync(
                user =>
                    user.EntraObjectId ==
                    entraObjectId);

    public async Task AddAsync(User user)
    {
        db.Users.Add(user);

        await db.SaveChangesAsync();
    }

    public async Task UpdateAsync(User user)
    {
        db.Users.Update(user);

        await db.SaveChangesAsync();
    }
}