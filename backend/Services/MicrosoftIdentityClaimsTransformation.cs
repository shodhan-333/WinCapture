using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using WinCapture.Models;

namespace WinCapture.Services;

public sealed class MicrosoftIdentityClaimsTransformation(
    MicrosoftUserService microsoftUserService) : IClaimsTransformation
{
    public async Task<ClaimsPrincipal> TransformAsync(ClaimsPrincipal principal)
    {
        if (!principal.Identity?.IsAuthenticated ?? true)
        {
            return principal;
        }

        var identity = principal.Identities.FirstOrDefault(identity => identity.IsAuthenticated);

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

    private static UserRole? GetRole(ClaimsPrincipal principal)
    {
        var roles = principal.FindAll("roles")
            .Select(claim => claim.Value)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        if (roles.Contains("WinCapture.Admin"))
        {
            return UserRole.Admin;
        }

        if (roles.Contains("WinCapture.User"))
        {
            return UserRole.User;
        }

        return null;
    }

    private static void RemoveClaim(ClaimsIdentity identity, string claimType)
    {
        foreach (var claim in identity.FindAll(claimType).ToList())
        {
            identity.RemoveClaim(claim);
        }
    }
}
