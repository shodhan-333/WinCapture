namespace WinCapture.DTOs.Albums;

public sealed record AlbumMemberResponse(
    int UserId,
    string Name,
    string Email,
    bool CanView,
    bool CanDownload,
    DateTime GrantedAt);