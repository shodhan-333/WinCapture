using Microsoft.EntityFrameworkCore;
using WinCapture.Exceptions;
using WinCapture.Models;
using WinCapture.Repositories;

namespace WinCapture.Services;

//MicrosoftUserService handles the WinCapture database user
public sealed class MicrosoftUserService(IUserRepository userRepository)
{
    // Validates the Microsoft account details and creates or updates the local user.
    public async Task<User> GetOrCreateAsync(
        string name,
        string email,
        string entraObjectId,
        UserRole role)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();
        var normalizedObjectId = entraObjectId.Trim();

        if (!IsValidEmail(normalizedEmail))
        {
            throw new UnauthorizedException(
                "The Microsoft account email address is invalid.");
        }

        if (string.IsNullOrWhiteSpace(normalizedObjectId))
        {
            throw new UnauthorizedException(
                "The Microsoft account object ID is missing.");
        }

        if (role is not UserRole.User and not UserRole.Admin)
        {
            throw new UnauthorizedException(
                "The Microsoft account does not have a supported WinCapture app role.");
        }

        var normalizedName = string.IsNullOrWhiteSpace(name)
            ? normalizedEmail.Split('@')[0]
            : name.Trim();

        if (normalizedName.Length > 200)
        {
            normalizedName = normalizedName[..200];
        }

        // Uses the Entra object ID as the stable identity key for the account.
        var user = await userRepository.GetByEntraObjectIdAsync(normalizedObjectId);

        if (user is null)
        {
            user = new User
            {
                Name = normalizedName,
                Email = normalizedEmail,
                EntraObjectId = normalizedObjectId,
                Role = role,
                CreatedAt = DateTime.UtcNow
            };

            try
            {
                await userRepository.AddAsync(user);
            }
            catch (DbUpdateException exception)
            {
                // A concurrent first sign-in may have inserted this OID already. Never fall back to email.
                var concurrentUser = await userRepository.GetByEntraObjectIdAsync(normalizedObjectId);
                if (concurrentUser is not null)
                {
                    return concurrentUser;
                }

                if (IsDuplicateKeyException(exception))
                {
                    throw new UnauthorizedException(
                        "The Microsoft account conflicts with an existing WinCapture profile.");
                }

                throw;
            }

            return user;
        }

        // Keeps the local user details and role in sync with Microsoft Entra.
        var changed = false;

        if (!string.Equals(
                user.Email,
                normalizedEmail,
                StringComparison.OrdinalIgnoreCase))
        {
            user.Email = normalizedEmail;
            changed = true;
        }

        if (!string.Equals(
                user.Name,
                normalizedName,
                StringComparison.Ordinal))
        {
            user.Name = normalizedName;
            changed = true;
        }

        // Uses the Entra application role as the source of truth for the user's role.
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

    // Checks whether the supplied value is a valid email address.
    private static bool IsValidEmail(string email)
    {
        try
        {
            var address = new System.Net.Mail.MailAddress(email);

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

    // Identifies SQL Server duplicate-key errors that can occur during concurrent account creation.
    private static bool IsDuplicateKeyException(DbUpdateException exception)
    {
        return exception.InnerException is
                   Microsoft.Data.SqlClient.SqlException sqlException &&
               (sqlException.Number == 2601 ||
                sqlException.Number == 2627);
    }
}
