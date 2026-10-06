using Microsoft.EntityFrameworkCore;
using WinCapture.Exceptions;
using WinCapture.Models;
using WinCapture.Repositories;

namespace WinCapture.Services;

public sealed class MicrosoftUserService(
    IUserRepository userRepository)
{
    public async Task<User> GetOrCreateAsync(
        string name,
        string email,
        UserRole role)
    {
        var normalizedEmail =
            email.Trim().ToLowerInvariant();

        if (!IsValidEmail(normalizedEmail))
        {
            throw new UnauthorizedException(
                "The Microsoft account email address is invalid.");
        }

        var normalizedName =
            string.IsNullOrWhiteSpace(name)
                ? normalizedEmail.Split('@')[0]
                : name.Trim();

        if (normalizedName.Length > 200)
        {
            normalizedName =
                normalizedName[..200];
        }

        var user =
            await userRepository.GetByEmailAsync(
                normalizedEmail);

        if (user is null)
        {
            user = new User
            {
                Name = normalizedName,
                Email = normalizedEmail,
                Role = role,
                CreatedAt = DateTime.UtcNow
            };

            try
            {
                await userRepository.AddAsync(user);
            }
            catch (DbUpdateException exception)
                when (IsDuplicateEmailException(exception))
            {
                user =
                    await userRepository.GetByEmailAsync(
                        normalizedEmail)
                    ?? throw new UnauthorizedException(
                        "The Microsoft user could not be created or loaded.");
            }

            return user;
        }

        var changed = false;

        if (!string.Equals(
                user.Name,
                normalizedName,
                StringComparison.Ordinal))
        {
            user.Name = normalizedName;
            changed = true;
        }

        if (user.Role != role)
        {
            user.Role = role;
            changed = true;
        }

        if (changed)
        {
            await userRepository.UpdateAsync(user);
        }

        return user;
    }

    private static bool IsValidEmail(string email)
    {
        try
        {
            var address =
                new System.Net.Mail.MailAddress(email);

            return string.Equals(
                address.Address,
                email,
                StringComparison.OrdinalIgnoreCase);
        }
        catch (FormatException)
        {
            return false;
        }
    }

    private static bool IsDuplicateEmailException(
        DbUpdateException exception)
    {
        return exception.InnerException is
                   Microsoft.Data.SqlClient.SqlException sqlException &&
               (sqlException.Number == 2601 ||
                sqlException.Number == 2627);
    }
}