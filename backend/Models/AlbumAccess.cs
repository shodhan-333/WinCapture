namespace WinCapture.Models;

public sealed class AlbumAccess
{
    public long Id { get; set; }

    public long AlbumId { get; set; }

    public int UserId { get; set; }

    public bool CanView { get; set; }

    public bool CanDownload { get; set; }

    public DateTime GrantedAt { get; set; }

    public int GrantedBy { get; set; }

    public Album Album { get; set; } = null!;

    public User User { get; set; } = null!;
}