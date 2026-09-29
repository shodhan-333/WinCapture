namespace WinCapture.DTOs.Albums;

public sealed record AlbumResponse(
    long Id,
    string AlbumName,
    int OwnerId,
    string OwnerName,
    DateTime CreatedAt,
    DateTime? UpdatedAt);