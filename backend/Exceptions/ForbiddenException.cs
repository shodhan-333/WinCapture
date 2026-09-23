namespace WinCapture.Exceptions;

public sealed class ForbiddenException(string message) : Exception(message);
