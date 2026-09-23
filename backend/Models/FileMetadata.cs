namespace WinCapture.Models;

public sealed class FileMetadata
{
    public long Id { get; set; }

    public string OriginalFileName { get; set; } = string.Empty;

    public string StoredFileName { get; set; } = string.Empty;

    public string ContentType { get; set; } = string.Empty;

    public long FileSize { get; set; }

    public int UploadedBy { get; set; }

    public long? AlbumId { get; set; }

    public DateTime UploadedAt { get; set; }

    public User User { get; set; } = null!;

    public Album? Album { get; set; }
}