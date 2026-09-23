namespace WinCapture.DTOs.Files;

public sealed record FileResponse(long Id, string OriginalFileName, string ContentType, long FileSize, DateTime UploadedAt, string Url);
