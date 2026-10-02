namespace WinCapture.Models;

public sealed class User
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string EntraObjectId { get; set; } = string.Empty;

    public UserRole Role { get; set; }

    public DateTime CreatedAt { get; set; }

    public ICollection<FileMetadata> Files { get; set; } = [];

    public ICollection<Album> Albums { get; set; } = [];

    public ICollection<AlbumAccess> AlbumAccess { get; set; } = [];

    public ICollection<Favorite> Favorites { get; set; } = [];
}