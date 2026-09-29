namespace WinCapture.Models;

public sealed class Album
{
    public long Id { get; set; }

    public string AlbumName { get; set; } = string.Empty;

    public int CreatedBy { get; set; }

    public DateTime CreatedAt { get; set; }

    public int? UpdatedBy { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public User Owner { get; set; } = null!;

    public ICollection<FileMetadata> Files { get; set; } = [];

    public ICollection<AlbumAccess> Access { get; set; } = [];
}