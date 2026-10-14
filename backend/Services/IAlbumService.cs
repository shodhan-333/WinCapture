using WinCapture.DTOs.Albums;
using WinCapture.DTOs.Common;
using WinCapture.Models;

namespace WinCapture.Services;

public interface IAlbumService
{
    // Creates a new album for the current user.
    Task<AlbumResponse> CreateAsync(
        CreateAlbumRequest request,
        User currentUser);

    // Returns the albums the current user is allowed to access.
    Task<IReadOnlyList<AlbumResponse>> GetAccessibleAsync(
        User currentUser);

    Task<PagedResponse<AlbumResponse>> GetAccessiblePageAsync(
        User currentUser,
        PaginationQuery pagination);

    // Returns only the albums owned by the specified user.
    Task<IReadOnlyList<AlbumResponse>> GetOwnedByUserAsync(int userId);

    Task<PagedResponse<AlbumResponse>> GetOwnedByUserPageAsync(int userId, PaginationQuery pagination);

    // Returns all albums for admin management.
    Task<IReadOnlyList<AlbumResponse>> GetAllForAdminAsync();

    Task<PagedResponse<AlbumResponse>> GetAllForAdminPageAsync(PaginationQuery pagination);

    // Retrieves an album after checking the user's access permissions.
    Task<AlbumResponse> GetAsync(
        long albumId,
        User currentUser,
        UserRole role);

    // Updates an album after checking the user's permissions.
    Task<AlbumResponse> UpdateAsync(
        long albumId,
        UpdateAlbumRequest request,
        User currentUser,
        UserRole role);

    // Deletes an album and its associated files.
    Task DeleteAsync(
        long albumId,
        User currentUser,
        UserRole role);

    // Returns the members who have access to an album and their permissions.
    Task<IReadOnlyList<AlbumMemberResponse>> GetMembersAsync(
        long albumId,
        User currentUser,
        UserRole role);

    // Adds a user to an album with the specified permissions.
    Task AddMemberAsync(
        long albumId,
        AddAlbumMemberRequest request,
        User currentUser,
        UserRole role);

    // Updates a member's permissions for an album.
    Task UpdateMemberAsync(
        long albumId,
        int userId,
        UpdateAlbumMemberRequest request,
        User currentUser,
        UserRole role);

    // Removes a member's access to an album.
    Task RemoveMemberAsync(
        long albumId,
        int userId,
        User currentUser,
        UserRole role);

    // Checks album access before allowing a file to be uploaded.
    Task<Album> GetForUploadAsync(
        long albumId,
        User currentUser,
        UserRole role);

    // Checks whether the user is allowed to download files from an album.
    Task<bool> CanDownloadAsync(
        long albumId,
        User currentUser,
        UserRole role);
}