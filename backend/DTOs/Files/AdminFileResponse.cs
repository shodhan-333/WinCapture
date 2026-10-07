namespace WinCapture.DTOs.Files;

public sealed record AdminFileResponse(
    long Id,
    string OriginalFileName,
    string ContentType,
    long FileSize,
    DateTime UploadedAt,
    int UploadedBy,
    string UploaderName,
    long? AlbumId,
    string? AlbumName);
