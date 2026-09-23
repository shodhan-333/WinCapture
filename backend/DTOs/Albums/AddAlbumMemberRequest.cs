namespace WinCapture.DTOs.Albums;

public sealed record AddAlbumMemberRequest(
    string Email,
    bool CanView,
    bool CanDownload);
    