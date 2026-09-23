namespace WinCapture.Exceptions;

public sealed class UnauthorizedException(string message) : Exception(message);
