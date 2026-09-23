namespace WinCapture.DTOs.Auth;

public sealed record RegisterRequest(string Name, string Email, string Password);
