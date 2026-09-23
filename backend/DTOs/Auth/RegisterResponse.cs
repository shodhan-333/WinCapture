namespace WinCapture.DTOs.Auth;

public sealed record RegisterResponse(int UserId, string Name, string Email, string Role);
