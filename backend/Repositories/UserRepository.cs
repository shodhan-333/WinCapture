using Microsoft.EntityFrameworkCore;
using WinCapture.Data;
using WinCapture.Models;

namespace WinCapture.Repositories;

public sealed class UserRepository(
    WinCaptureDbContext db) : IUserRepository
{
    public async Task<User?> GetByEmailAsync(string email) =>
        await db.Users
            .AsNoTracking()
            .SingleOrDefaultAsync(
                user => user.Email == email);

    public async Task<bool> ExistsByEmailAsync(string email) =>
        await db.Users
            .AsNoTracking()
            .AnyAsync(
                user => user.Email == email);

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