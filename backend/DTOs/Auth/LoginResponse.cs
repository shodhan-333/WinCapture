namespace WinCapture.DTOs.Auth;

public sealed record LoginResponse(string Token, int UserId, string Name, string Email, string Role);
