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
        string entraObjectId,
        UserRole role)
    {
        var normalizedEmail =
            email.Trim()
                .ToLowerInvariant();

        var normalizedObjectId =
            entraObjectId.Trim();

        if (!IsValidEmail(normalizedEmail))
        {
            throw new UnauthorizedException(
                "The Microsoft account email address is invalid.");
        }

        if (string.IsNullOrWhiteSpace(
                normalizedObjectId))
        {
            throw new UnauthorizedException(
                "The Microsoft account object ID is missing.");
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

        // ========================================================
        // First identify the user by Microsoft Entra object ID.
        // This is the authoritative identity binding.
        // ========================================================

        var user =
            await userRepository.GetByEntraObjectIdAsync(
                normalizedObjectId);

        // ========================================================
        // Legacy/email fallback.
        // This allows an existing WinCapture record to be linked
        // to its Microsoft Entra object ID.
        // ========================================================

        if (user is null)
        {
            user =
                await userRepository.GetByEmailAsync(
                    normalizedEmail);
        }

        // ========================================================
        // Create new user
        // ========================================================

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
                when (IsDuplicateKeyException(exception))
            {
                user =
                    await userRepository.GetByEntraObjectIdAsync(
                        normalizedObjectId)
                    ?? await userRepository.GetByEmailAsync(
                        normalizedEmail)
                    ?? throw new UnauthorizedException(
                        "The Microsoft user could not be created or loaded.");
            }

            return user;
        }

        // ========================================================
        // Sync Microsoft identity information
        // ========================================================

        var changed = false;

        if (!string.Equals(
                user.EntraObjectId,
                normalizedObjectId,
                StringComparison.Ordinal))
        {
            user.EntraObjectId =
                normalizedObjectId;

            changed = true;
        }

        if (!string.Equals(
                user.Email,
                normalizedEmail,
                StringComparison.OrdinalIgnoreCase))
        {
            user.Email =
                normalizedEmail;

            changed = true;
        }

        if (!string.Equals(
                user.Name,
                normalizedName,
                StringComparison.Ordinal))
        {
            user.Name =
                normalizedName;

            changed = true;
        }

        // The Entra application role is authoritative.
        if (user.Role != role)
        {
            user.Role =
                role;

            changed = true;
        }

        if (changed)
        {
            await userRepository.UpdateAsync(user);
        }

        return user;
    }

    private static bool IsValidEmail(
        string email)
    {
        try
        {
            var address =
                new System.Net.Mail.MailAddress(
                    email);

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

    private static bool IsDuplicateKeyException(
        DbUpdateException exception)
    {
        return exception.InnerException is
                   Microsoft.Data.SqlClient.SqlException sqlException &&
               (sqlException.Number == 2601 ||
                sqlException.Number == 2627);
    }
}