using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using WinCapture.Models;

namespace WinCapture.Services;

public sealed class MicrosoftIdentityClaimsTransformation(
    MicrosoftUserService microsoftUserService) : IClaimsTransformation
{
    // Maps the authenticated Microsoft Entra account to a WinCapture user and adds the required claims.
    public async Task<ClaimsPrincipal> TransformAsync(ClaimsPrincipal principal)
    {
        if (!principal.Identity?.IsAuthenticated ?? true)
        {
            return principal;
        }

        var identity = principal.Identities
            .FirstOrDefault(identity => identity.IsAuthenticated);

        if (identity is null)
        {
            return principal;
        }

        var existingUserId = principal.FindFirst("wincapture_user_id")?.Value;

        if (!string.IsNullOrWhiteSpace(existingUserId))
        {
            return principal;
        }

        var objectId = principal.FindFirst("oid")?.Value;
        var email = principal.FindFirst("preferred_username")?.Value
            ?? principal.FindFirst("email")?.Value
            ?? principal.FindFirst("upn")?.Value;

        if (string.IsNullOrWhiteSpace(objectId) || string.IsNullOrWhiteSpace(email))
        {
            return principal;
        }

        var role = GetRole(principal);

        if (role is null)
        {
            return principal;
        }

        var name = principal.FindFirst("name")?.Value
            ?? principal.FindFirst("given_name")?.Value
            ?? email.Split('@')[0];

        var user = await microsoftUserService.GetOrCreateAsync(
            name,
            email.Trim().ToLowerInvariant(),
            objectId,
            role.Value);

        RemoveClaim(identity, "wincapture_user_id");
        RemoveClaim(identity, "authentication_type");

        identity.AddClaim(new Claim("wincapture_user_id", user.Id.ToString()));
        identity.AddClaim(new Claim("authentication_type", "Microsoft Entra ID"));

        return principal;
    }

    // Maps the Microsoft Entra app role to the corresponding WinCapture user role.
    private static UserRole? GetRole(ClaimsPrincipal principal)
    {
        var roles = principal.FindAll("roles")
            .Select(claim => claim.Value)
            .Where(role =>
                string.Equals(role, "WinCapture.Admin", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(role, "WinCapture.User", StringComparison.OrdinalIgnoreCase))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        if (roles.Length != 1)
        {
            return null;
        }

        return string.Equals(roles[0], "WinCapture.Admin", StringComparison.OrdinalIgnoreCase)
            ? UserRole.Admin
            : UserRole.User;
    }

    // Removes existing claims of the specified type before adding updated values.
    private static void RemoveClaim(ClaimsIdentity identity, string claimType)
    {
        foreach (var claim in identity.FindAll(claimType).ToList())
        {
            identity.RemoveClaim(claim);
        }
    }
}
