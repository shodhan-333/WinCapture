using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WinCapture.DTOs.Auth;
using WinCapture.Exceptions;

namespace WinCapture.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController : ControllerBase
{
    [Authorize]
    [HttpGet("me")]
    [ProducesResponseType<CurrentUserResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public ActionResult<CurrentUserResponse> Me()
    {
        var userId =
            User.FindFirst("wincapture_user_id")?.Value;

        if (!int.TryParse(
                userId,
                out var parsedUserId) ||
            parsedUserId <= 0)
        {
            throw new UnauthorizedException(
                "The authenticated WinCapture user ID is missing or invalid.");
        }

        var name =
            User.FindFirst("name")?.Value ??
            string.Empty;

        var email =
            User.FindFirst("email")?.Value ??
            User.FindFirst("preferred_username")?.Value ??
            string.Empty;

        var role =
            User.FindFirst("role")?.Value;

        if (string.IsNullOrWhiteSpace(role))
        {
            throw new ForbiddenException(
                "The Microsoft account is authenticated but is not assigned to a WinCapture role.");
        }

        return Ok(
            new CurrentUserResponse(
                parsedUserId,
                name,
                email,
                role,
                User.FindFirst("authentication_type")?.Value
                    ?? "Microsoft Entra ID"));
    }
}