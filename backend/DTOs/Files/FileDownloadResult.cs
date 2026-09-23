namespace WinCapture.DTOs.Files;

public sealed record FileDownloadResult(Stream Content, string ContentType, string DownloadName);
