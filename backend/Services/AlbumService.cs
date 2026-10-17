using WinCapture.DTOs.Albums;
using WinCapture.DTOs.Common;
using WinCapture.Exceptions;
using WinCapture.Models;
using WinCapture.Repositories;

namespace WinCapture.Services;

public sealed class AlbumService(
    IAlbumRepository albums,
    IUserRepository users,
    IFileRepository files,
    IStorageService storage,
    ILogger<AlbumService> logger) : IAlbumService
{
    // Validates the album name, saves the album, and returns its details.
    public async Task<AlbumResponse> CreateAsync(
        CreateAlbumRequest request,
        User currentUser)
    {
        ValidateAlbumName(request.AlbumName);

        var album = new Album
        {
            AlbumName = request.AlbumName.Trim(),
            CreatedBy = currentUser.Id,
            CreatedAt = DateTime.UtcNow
        };

        await albums.AddAsync(album);

        album.Owner = currentUser;

        return ToResponse(album);
    }

    // Returns the albums owned by the user or shared with them.
    public async Task<IReadOnlyList<AlbumResponse>> GetAccessibleAsync(
        User currentUser)
    {
        var result = await albums.GetAccessibleByUserIdAsync(currentUser.Id);

        return result
            .Select(ToResponse)
            .ToList();
    }

    public async Task<PagedResponse<AlbumResponse>> GetAccessiblePageAsync(
        User currentUser,
        PaginationQuery pagination)
    {
        var page = await albums.GetPagedAccessibleByUserIdAsync(currentUser.Id, pagination);
        return MapPage(page);
    }

    // Returns only the albums owned by the specified user.
    public async Task<IReadOnlyList<AlbumResponse>> GetOwnedByUserAsync(int userId)
    {
        var result = await albums.GetOwnedByUserIdAsync(userId);

        return result
            .Select(ToResponse)
            .ToList();
    }

    public async Task<PagedResponse<AlbumResponse>> GetOwnedByUserPageAsync(
        int userId,
        PaginationQuery pagination)
    {
        var page = await albums.GetPagedOwnedByUserIdAsync(userId, pagination);
        return MapPage(page);
    }

    public async Task<PagedResponse<AlbumResponse>> GetSharedWithUserPageAsync(
        int userId,
        PaginationQuery pagination)
    {
        var page = await albums.GetPagedSharedWithUserIdAsync(userId, pagination);
        return MapPage(page);
    }

    // Returns all albums for admin management.
    public async Task<IReadOnlyList<AlbumResponse>> GetAllForAdminAsync()
    {
        var result = await albums.GetAllAsync();

        return result
            .Select(ToResponse)
            .ToList();
    }

    public async Task<PagedResponse<AlbumResponse>> GetAllForAdminPageAsync(
        PaginationQuery pagination)
    {
        var page = await albums.GetPagedAllAsync(pagination);
        return MapPage(page);
    }

    private static PagedResponse<AlbumResponse> MapPage(
        PagedResponse<Album> page)
    {
        return new PagedResponse<AlbumResponse>(
            page.Items.Select(ToResponse).ToList(),
            page.TotalItems,
            page.Page,
            page.PageSize,
            page.PageCount);
    }

    // Retrieves an album after checking whether the user can view it.
    public async Task<AlbumResponse> GetAsync(
        long albumId,
        User currentUser,
        UserRole role)
    {
        var album = await GetAuthorizedAlbumAsync(
            albumId,
            currentUser,
            role,
            true);

        return ToResponse(album);
    }

    // Validates the album name and updates the album details.
    public async Task<AlbumResponse> UpdateAsync(
        long albumId,
        UpdateAlbumRequest request,
        User currentUser,
        UserRole role)
    {
        ValidateAlbumName(request.AlbumName);

        var album = await GetAuthorizedAlbumAsync(
            albumId,
            currentUser,
            role,
            false);

        album.AlbumName = request.AlbumName.Trim();
        album.UpdatedBy = currentUser.Id;
        album.UpdatedAt = DateTime.UtcNow;

        await albums.UpdateAsync(album);

        return ToResponse(album);
    }

    // Deletes album metadata first, then cleans its private blobs and logs any orphan requiring reconciliation.
    public async Task DeleteAsync(
        long albumId,
        User currentUser,
        UserRole role)
    {
        var album = await GetAuthorizedAlbumAsync(
            albumId,
            currentUser,
            role,
            false);

        var albumFiles = await files.GetByAlbumIdAsync(albumId);

        await albums.DeleteAsync(album);

        foreach (var file in albumFiles)
        {
            try
            {
                await storage.DeleteAsync(file.StoredFileName);
            }
            catch (Exception exception)
            {
                logger.LogCritical(
                    exception,
                    "Album metadata was removed but blob cleanup failed. Reconciliation is required for {StoredFileName}.",
                    file.StoredFileName);
            }
        }
    }

    // Returns the members who have access to the album and their permissions.
    public async Task<IReadOnlyList<AlbumMemberResponse>> GetMembersAsync(
        long albumId,
        User currentUser,
        UserRole role)
    {
        await GetAuthorizedAlbumAsync(
            albumId,
            currentUser,
            role,
            false);

        var access = await albums.GetAccessListAsync(albumId);

        return access
            .Select(item => new AlbumMemberResponse(
                item.UserId,
                item.User.Name,
                item.User.Email,
                item.CanView,
                item.CanDownload,
                item.GrantedAt))
            .ToList();
    }

    // Grants an existing WinCapture user access to the album with the requested permissions.
    public async Task AddMemberAsync(
        long albumId,
        AddAlbumMemberRequest request,
        User currentUser,
        UserRole role)
    {
        await GetAuthorizedAlbumAsync(
            albumId,
            currentUser,
            role,
            false);

        var email = request.Email.Trim().ToLowerInvariant();

        if (!request.CanView && request.CanDownload)
        {
            throw new BadRequestException(
                "CanDownload cannot be true when CanView is false.");
        }

        var user = await users.GetByEmailAsync(email)
            ?? throw new NotFoundException(
                "The user must register in WinCapture before they can be added to an album.");

        if (user.Id == currentUser.Id)
        {
            throw new BadRequestException(
                "The album owner already has full access.");
        }

        var existing = await albums.GetAccessAsync(albumId, user.Id);

        if (existing is not null)
        {
            throw new BadRequestException(
                "This user already has access to the album.");
        }

        await albums.AddAccessAsync(new AlbumAccess
        {
            AlbumId = albumId,
            UserId = user.Id,
            CanView = request.CanView,
            CanDownload = request.CanView && request.CanDownload,
            GrantedAt = DateTime.UtcNow,
            GrantedBy = currentUser.Id
        });
    }

    // Updates a member's viewing and downloading permissions for the album.
    public async Task UpdateMemberAsync(
        long albumId,
        int userId,
        UpdateAlbumMemberRequest request,
        User currentUser,
        UserRole role)
    {
        await GetAuthorizedAlbumAsync(
            albumId,
            currentUser,
            role,
            false);

        if (!request.CanView && request.CanDownload)
        {
            throw new BadRequestException(
                "CanDownload cannot be true when CanView is false.");
        }

        var access = await albums.GetAccessAsync(albumId, userId)
            ?? throw new NotFoundException("Album access was not found.");

        access.CanView = request.CanView;
        access.CanDownload = request.CanView && request.CanDownload;

        await albums.UpdateAccessAsync(access);
    }

    // Removes a member's access to the specified album.
    public async Task RemoveMemberAsync(
        long albumId,
        int userId,
        User currentUser,
        UserRole role)
    {
        await GetAuthorizedAlbumAsync(
            albumId,
            currentUser,
            role,
            false);

        var access = await albums.GetAccessAsync(albumId, userId)
            ?? throw new NotFoundException("Album access was not found.");

        await albums.DeleteAccessAsync(access);
    }

    // Checks album access before allowing a file to be uploaded.
    public async Task<Album> GetForUploadAsync(
        long albumId,
        User currentUser,
        UserRole role)
    {
        return await GetAuthorizedAlbumAsync(
            albumId,
            currentUser,
            role,
            false);
    }

    // Checks whether the user is allowed to download files from the album.
    public async Task<bool> CanDownloadAsync(
        long albumId,
        User currentUser,
        UserRole role)
    {
        var album = await albums.GetByIdAsync(albumId)
            ?? throw new NotFoundException(
                "The requested album was not found.");

        if (role == UserRole.Admin || album.CreatedBy == currentUser.Id)
        {
            return true;
        }

        var access = await albums.GetAccessAsync(
            albumId,
            currentUser.Id);

        return access is not null && access.CanView && access.CanDownload;
    }

    // Checks whether the user can view or manage the album based on ownership, role, and access permissions.
    private async Task<Album> GetAuthorizedAlbumAsync(
        long albumId,
        User currentUser,
        UserRole role,
        bool canView)
    {
        var album = await albums.GetByIdAsync(albumId)
            ?? throw new NotFoundException(
                "The requested album was not found.");

        if (role == UserRole.Admin || album.CreatedBy == currentUser.Id)
        {
            return album;
        }

        var access = await albums.GetAccessAsync(
            albumId,
            currentUser.Id);

        if (access is null || (canView && !access.CanView))
        {
            throw new ForbiddenException(
                "You are not allowed to access this album.");
        }

        if (!canView)
        {
            throw new ForbiddenException(
                "Only the album owner or an Admin can manage this album.");
        }

        return album;
    }

    // Rejects empty album names and names longer than 200 characters.
    private static void ValidateAlbumName(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new BadRequestException("Album name is required.");
        }

        if (name.Trim().Length > 200)
        {
            throw new BadRequestException(
                "Album name cannot exceed 200 characters.");
        }
    }

    // Maps an album entity to the response returned by the API.
    private static AlbumResponse ToResponse(Album album)
    {
        return new AlbumResponse(
            album.Id,
            album.AlbumName,
            album.CreatedBy,
            album.Owner.Name,
            album.CreatedAt,
            album.UpdatedAt);
    }
}
