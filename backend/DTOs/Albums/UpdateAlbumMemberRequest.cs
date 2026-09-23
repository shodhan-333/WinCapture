namespace WinCapture.DTOs.Albums;

public sealed record UpdateAlbumMemberRequest(
    bool CanView,
    bool CanDownload);