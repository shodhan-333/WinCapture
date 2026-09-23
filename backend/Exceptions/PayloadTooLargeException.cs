namespace WinCapture.Exceptions;

public sealed class PayloadTooLargeException(string message) : Exception(message);
