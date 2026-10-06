namespace WinCapture.DTOs.Auth;

public sealed record CurrentUserResponse(
    int UserId,
    string Name,
    string Email,
    string Role,
    string AuthenticationType);