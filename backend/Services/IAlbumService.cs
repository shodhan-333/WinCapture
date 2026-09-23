using WinCapture.DTOs.Albums;
using WinCapture.Models;

namespace WinCapture.Services;

public interface IAlbumService
{
    Task<AlbumResponse> CreateAsync(
        CreateAlbumRequest request,
        User currentUser);

    Task<IReadOnlyList<AlbumResponse>> GetAccessibleAsync(
        User currentUser,
        UserRole role);

    Task<IReadOnlyList<AlbumResponse>> GetAllForAdminAsync();

    Task<AlbumResponse> GetAsync(
        long albumId,
        User currentUser,
        UserRole role);

    Task<AlbumResponse> UpdateAsync(
        long albumId,
        UpdateAlbumRequest request,
        User currentUser,
        UserRole role);

    Task DeleteAsync(
        long albumId,
        User currentUser,
        UserRole role);

    Task<IReadOnlyList<AlbumMemberResponse>> GetMembersAsync(
        long albumId,
        User currentUser,
        UserRole role);

    Task AddMemberAsync(
        long albumId,
        AddAlbumMemberRequest request,
        User currentUser,
        UserRole role);

    Task UpdateMemberAsync(
        long albumId,
        int userId,
        UpdateAlbumMemberRequest request,
        User currentUser,
        UserRole role);

    Task RemoveMemberAsync(
        long albumId,
        int userId,
        User currentUser,
        UserRole role);

    Task<Album> GetForUploadAsync(
        long albumId,
        User currentUser,
        UserRole role);

    Task<bool> CanDownloadAsync(
        long albumId,
        User currentUser,
        UserRole role);
}