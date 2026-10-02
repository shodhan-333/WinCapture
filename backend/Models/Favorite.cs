namespace WinCapture.Models;

public sealed class Favorite
{
    public int UserId { get; set; }

    public long FileId { get; set; }

    public DateTime FavoritedAt { get; set; }

    public User User { get; set; } = null!;

    public FileMetadata File { get; set; } = null!;
}