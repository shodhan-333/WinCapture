namespace WinCapture.Exceptions;

public sealed class BadRequestException(string message) : Exception(message);
