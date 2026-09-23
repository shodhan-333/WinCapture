using WinCapture.DTOs.Albums;
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

    public async Task<IReadOnlyList<AlbumResponse>>
        GetAccessibleAsync(
            User currentUser,
            UserRole role)
    {
        var result = role == UserRole.Admin
            ? await albums.GetAllAsync()
            : await albums.GetAccessibleByUserIdAsync(
                currentUser.Id);

        return result
            .Select(ToResponse)
            .ToList();
    }

    public async Task<IReadOnlyList<AlbumResponse>>
        GetAllForAdminAsync()
    {
        var result = await albums.GetAllAsync();

        return result
            .Select(ToResponse)
            .ToList();
    }

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

        album.AlbumName =
            request.AlbumName.Trim();

        album.UpdatedBy =
            currentUser.Id;

        album.UpdatedAt =
            DateTime.UtcNow;

        await albums.UpdateAsync(album);

        return ToResponse(album);
    }

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

        var allFiles = await files.GetAllAsync();

        var albumFiles = allFiles
            .Where(file => file.AlbumId == albumId)
            .ToList();

        await albums.DeleteAsync(album);

        foreach (var file in albumFiles)
        {
            try
            {
                await storage.DeleteAsync(
                    file.StoredFileName);
            }
            catch (Exception exception)
            {
                logger.LogError(
                    exception,
                    "Album deleted but file cleanup failed. AlbumId: {AlbumId}, FileId: {FileId}, StoredFileName: {StoredFileName}",
                    albumId,
                    file.Id,
                    file.StoredFileName);
            }
        }
    }

    public async Task<IReadOnlyList<AlbumMemberResponse>>
        GetMembersAsync(
            long albumId,
            User currentUser,
            UserRole role)
    {
        await GetAuthorizedAlbumAsync(
            albumId,
            currentUser,
            role,
            false);

        var access =
            await albums.GetAccessListAsync(albumId);

        return access
            .Select(item =>
                new AlbumMemberResponse(
                    item.UserId,
                    item.User.Name,
                    item.User.Email,
                    item.CanView,
                    item.CanDownload,
                    item.GrantedAt))
            .ToList();
    }

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

        var email =
            request.Email.Trim()
                .ToLowerInvariant();

        if (!email.EndsWith(
                "@winwire.com",
                StringComparison.OrdinalIgnoreCase))
        {
            throw new BadRequestException(
                "Only WinWire users can be added to an album.");
        }

        if (!request.CanView &&
            request.CanDownload)
        {
            throw new BadRequestException(
                "CanDownload cannot be true when CanView is false.");
        }

        var user =
            await users.GetByEmailAsync(email)
            ?? throw new NotFoundException(
                "The user must register in WinCapture before they can be added to an album.");

        if (user.Id == currentUser.Id)
        {
            throw new BadRequestException(
                "The album owner already has full access.");
        }

        var existing =
            await albums.GetAccessAsync(
                albumId,
                user.Id);

        if (existing is not null)
        {
            throw new BadRequestException(
                "This user already has access to the album.");
        }

        await albums.AddAccessAsync(
            new AlbumAccess
            {
                AlbumId = albumId,
                UserId = user.Id,
                CanView = request.CanView,
                CanDownload =
                    request.CanView &&
                    request.CanDownload,
                GrantedAt = DateTime.UtcNow,
                GrantedBy = currentUser.Id
            });
    }

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

        if (!request.CanView &&
            request.CanDownload)
        {
            throw new BadRequestException(
                "CanDownload cannot be true when CanView is false.");
        }

        var access =
            await albums.GetAccessAsync(
                albumId,
                userId)
            ?? throw new NotFoundException(
                "Album access was not found.");

        access.CanView =
            request.CanView;

        access.CanDownload =
            request.CanView &&
            request.CanDownload;

        await albums.UpdateAccessAsync(access);
    }

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

        var access =
            await albums.GetAccessAsync(
                albumId,
                userId)
            ?? throw new NotFoundException(
                "Album access was not found.");

        await albums.DeleteAccessAsync(access);
    }

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

    public async Task<bool> CanDownloadAsync(
        long albumId,
        User currentUser,
        UserRole role)
    {
        var album =
            await albums.GetByIdAsync(albumId)
            ?? throw new NotFoundException(
                "The requested album was not found.");

        if (role == UserRole.Admin ||
            album.CreatedBy == currentUser.Id)
        {
            return true;
        }

        var access =
            await albums.GetAccessAsync(
                albumId,
                currentUser.Id);

        return access is not null &&
               access.CanDownload;
    }

    private async Task<Album>
        GetAuthorizedAlbumAsync(
            long albumId,
            User currentUser,
            UserRole role,
            bool canView)
    {
        var album =
            await albums.GetByIdAsync(albumId)
            ?? throw new NotFoundException(
                "The requested album was not found.");

        if (role == UserRole.Admin ||
            album.CreatedBy == currentUser.Id)
        {
            return album;
        }

        var access =
            await albums.GetAccessAsync(
                albumId,
                currentUser.Id);

        if (access is null ||
            (canView && !access.CanView))
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

    private static void ValidateAlbumName(
        string name)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new BadRequestException(
                "Album name is required.");
        }

        if (name.Trim().Length > 200)
        {
            throw new BadRequestException(
                "Album name cannot exceed 200 characters.");
        }
    }

    private static AlbumResponse ToResponse(
        Album album)
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