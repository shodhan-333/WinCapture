using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using WinCapture.Data;
using WinCapture.DTOs.Common;
using WinCapture.Models;
using WinCapture.Repositories;
using Xunit;

namespace WinCapture.Tests.Repositories;

public sealed class RepositoryTests
{
    [Fact]
    public async Task AlbumRepository_ReturnsOwnedAndViewSharedAlbumsOnly()
    {
        await using var connection = await OpenDatabaseAsync();
        var options = new DbContextOptionsBuilder<WinCaptureDbContext>()
            .UseSqlite(connection)
            .Options;
        await using var database = new WinCaptureDbContext(options);
        await database.Database.EnsureCreatedAsync();

        var owner = AddUser(database, "owner");
        var member = AddUser(database, "member");
        var owned = AddAlbum(database, owner, "Owned");
        var shared = AddAlbum(database, AddUser(database, "other"), "Shared");
        var hidden = AddAlbum(database, AddUser(database, "hidden"), "Hidden");
        database.AlbumAccess.AddRange(
            new AlbumAccess
            {
                AlbumId = shared.Id,
                UserId = member.Id,
                CanView = true,
                GrantedBy = owner.Id,
                GrantedAt = DateTime.UtcNow
            },
            new AlbumAccess
            {
                AlbumId = hidden.Id,
                UserId = member.Id,
                CanView = false,
                GrantedBy = owner.Id,
                GrantedAt = DateTime.UtcNow
            });
        await database.SaveChangesAsync();

        var result = await new AlbumRepository(database).GetAccessibleByUserIdAsync(member.Id);

        Assert.Equal(new[] { shared.Id }, result.Select(album => album.Id));
        Assert.DoesNotContain(result, album => album.Id == hidden.Id);
        Assert.DoesNotContain(result, album => album.Id == owned.Id);
    }

    [Fact]
    public async Task AlbumRepository_ReturnsOnlyViewableAlbumsSharedWithUserAndFiltersSearch()
    {
        await using var connection = await OpenDatabaseAsync();
        var options = new DbContextOptionsBuilder<WinCaptureDbContext>()
            .UseSqlite(connection)
            .Options;
        await using var database = new WinCaptureDbContext(options);
        await database.Database.EnsureCreatedAsync();

        var owner = AddUser(database, "owner");
        var member = AddUser(database, "member");
        var shared = AddAlbum(database, owner, "Coastal collection");
        var hidden = AddAlbum(database, AddUser(database, "private-owner"), "Coastal private");
        var owned = AddAlbum(database, member, "Coastal owned");
        database.AlbumAccess.AddRange(
            new AlbumAccess
            {
                AlbumId = shared.Id,
                UserId = member.Id,
                CanView = true,
                GrantedBy = owner.Id,
                GrantedAt = DateTime.UtcNow
            },
            new AlbumAccess
            {
                AlbumId = hidden.Id,
                UserId = member.Id,
                CanView = false,
                GrantedBy = hidden.CreatedBy,
                GrantedAt = DateTime.UtcNow
            });
        await database.SaveChangesAsync();

        var result = await new AlbumRepository(database).GetPagedSharedWithUserIdAsync(
            member.Id,
            new PaginationQuery { Page = 1, PageSize = 10, Search = "Coastal" });

        Assert.Equal(new[] { shared.Id }, result.Items.Select(album => album.Id));
        Assert.Equal(1, result.TotalItems);
        Assert.DoesNotContain(result.Items, album => album.Id == hidden.Id || album.Id == owned.Id);
    }

    [Fact]
    public async Task FileRepository_ReturnsUserFilesNewestFirst()
    {
        await using var connection = await OpenDatabaseAsync();
        var options = new DbContextOptionsBuilder<WinCaptureDbContext>()
            .UseSqlite(connection)
            .Options;
        await using var database = new WinCaptureDbContext(options);
        await database.Database.EnsureCreatedAsync();

        var user = AddUser(database, "uploader");
        var older = AddFile(database, user, "older.txt", DateTime.UtcNow.AddDays(-1));
        var newer = AddFile(database, user, "newer.txt", DateTime.UtcNow);
        await database.SaveChangesAsync();

        var result = await new FileRepository(database).GetByUserIdAsync(user.Id);

        Assert.Equal(new[] { newer.Id, older.Id }, result.Select(file => file.Id));
    }

    [Fact]
    public async Task FileRepository_ReturnsFavoriteFilesNewestFavoriteFirst()
    {
        await using var connection = await OpenDatabaseAsync();
        var options = new DbContextOptionsBuilder<WinCaptureDbContext>()
            .UseSqlite(connection)
            .Options;
        await using var database = new WinCaptureDbContext(options);
        await database.Database.EnsureCreatedAsync();

        var user = AddUser(database, "favorite-user");
        var owner = AddUser(database, "file-owner");
        var oldFile = AddFile(database, owner, "old.txt", DateTime.UtcNow.AddDays(-2));
        var newFile = AddFile(database, owner, "new.txt", DateTime.UtcNow.AddDays(-1));
        database.Favorites.AddRange(
            new Favorite { UserId = user.Id, FileId = oldFile.Id, FavoritedAt = DateTime.UtcNow.AddDays(-1) },
            new Favorite { UserId = user.Id, FileId = newFile.Id, FavoritedAt = DateTime.UtcNow });
        await database.SaveChangesAsync();

        var result = await new FileRepository(database).GetFavoriteFilesByUserIdAsync(user.Id);

        Assert.Equal(new[] { newFile.Id, oldFile.Id }, result.Select(file => file.Id));
    }

    [Fact]
    public async Task UserRepository_AddsFindsAndUpdatesUsers()
    {
        await using var connection = await OpenDatabaseAsync();
        var options = new DbContextOptionsBuilder<WinCaptureDbContext>()
            .UseSqlite(connection)
            .Options;
        await using var database = new WinCaptureDbContext(options);
        await database.Database.EnsureCreatedAsync();
        var repository = new UserRepository(database);
        var user = new User
        {
            Name = "New user",
            Email = "new@example.test",
            EntraObjectId = "new-object-id",
            Role = UserRole.User,
            CreatedAt = DateTime.UtcNow
        };

        await repository.AddAsync(user);

        Assert.Equal(user.Id, (await repository.GetByEmailAsync(user.Email))?.Id);
        Assert.Equal(user.Id, (await repository.GetByEntraObjectIdAsync(user.EntraObjectId))?.Id);

        user.Role = UserRole.Admin;
        await repository.UpdateAsync(user);

        Assert.Equal(UserRole.Admin, (await repository.GetByEmailAsync(user.Email))?.Role);
    }

    [Fact]
    public async Task AlbumRepositoryQueriesAndMutationsReturnRelatedData()
    {
        await using var connection = await OpenDatabaseAsync();
        var options = new DbContextOptionsBuilder<WinCaptureDbContext>()
            .UseSqlite(connection)
            .Options;
        await using var database = new WinCaptureDbContext(options);
        await database.Database.EnsureCreatedAsync();

        var owner = AddUser(database, "album-repo-owner");
        var firstMember = AddUser(database, "album-repo-first");
        var secondMember = AddUser(database, "album-repo-second");
        var owned = AddAlbum(database, owner, "Owned");
        var shared = AddAlbum(database, AddUser(database, "album-repo-shared-owner"), "Shared");
        var hidden = AddAlbum(database, AddUser(database, "album-repo-hidden-owner"), "Hidden");
        owned.CreatedAt = DateTime.UtcNow.AddDays(-1);
        shared.CreatedAt = DateTime.UtcNow;
        database.AlbumAccess.AddRange(
            new AlbumAccess
            {
                AlbumId = shared.Id,
                UserId = firstMember.Id,
                CanView = true,
                GrantedBy = owner.Id,
                GrantedAt = DateTime.UtcNow,
                User = firstMember
            },
            new AlbumAccess
            {
                AlbumId = hidden.Id,
                UserId = firstMember.Id,
                CanView = false,
                GrantedBy = owner.Id,
                GrantedAt = DateTime.UtcNow,
                User = firstMember
            });
        await database.SaveChangesAsync();
        var repository = new AlbumRepository(database);

        Assert.Equal(new[] { shared.Id }, (await repository.GetAccessibleByUserIdAsync(firstMember.Id))
            .Select(album => album.Id));
        Assert.Equal(new[] { owned.Id }, (await repository.GetOwnedByUserIdAsync(owner.Id))
            .Select(album => album.Id));
        Assert.Equal(3, (await repository.GetAllAsync()).Count);
        Assert.Equal("Shared", (await repository.GetByIdAsync(shared.Id))?.AlbumName);

        var accessList = await repository.GetAccessListAsync(shared.Id);
        Assert.Equal(firstMember.Id, Assert.Single(accessList).User.Id);
        Assert.Null(await repository.GetAccessAsync(shared.Id, secondMember.Id));

        var access = new AlbumAccess
        {
            AlbumId = shared.Id,
            UserId = secondMember.Id,
            CanView = true,
            GrantedBy = owner.Id,
            GrantedAt = DateTime.UtcNow
        };
        await repository.AddAccessAsync(access);
        access.CanDownload = true;
        await repository.UpdateAccessAsync(access);
        Assert.True((await repository.GetAccessAsync(shared.Id, secondMember.Id))?.CanDownload);
        await repository.DeleteAccessAsync(access);
        Assert.Null(await repository.GetAccessAsync(shared.Id, secondMember.Id));

        shared.AlbumName = "Renamed";
        await repository.UpdateAsync(shared);
        Assert.Equal("Renamed", (await repository.GetByIdAsync(shared.Id))?.AlbumName);
        await repository.DeleteAsync(hidden);
        Assert.Null(await repository.GetByIdAsync(hidden.Id));
    }

    [Fact]
    public async Task FileRepositoryQueriesAndMutationsReturnExpectedRows()
    {
        await using var connection = await OpenDatabaseAsync();
        var options = new DbContextOptionsBuilder<WinCaptureDbContext>()
            .UseSqlite(connection)
            .Options;
        await using var database = new WinCaptureDbContext(options);
        await database.Database.EnsureCreatedAsync();

        var owner = AddUser(database, "file-repo-owner");
        var otherOwner = AddUser(database, "file-repo-other");
        var favoriteUser = AddUser(database, "file-repo-favorite");
        var album = AddAlbum(database, owner, "File repository album");
        var personal = AddFile(database, owner, "personal.txt", DateTime.UtcNow);
        var albumFile = AddFile(database, owner, "album.txt", DateTime.UtcNow.AddMinutes(-1));
        albumFile.AlbumId = album.Id;
        var otherFile = AddFile(database, otherOwner, "other.txt", DateTime.UtcNow.AddMinutes(-2));
        var repository = new FileRepository(database);
        await database.SaveChangesAsync();

        Assert.Equal(personal.Id, (await repository.GetByIdAsync(personal.Id))?.Id);
        Assert.Equal(
            new[] { personal.Id, albumFile.Id },
            (await repository.GetByUserIdAsync(owner.Id)).Select(file => file.Id));
        Assert.Equal(new[] { albumFile.Id }, (await repository.GetByAlbumIdAsync(album.Id))
            .Select(file => file.Id));
        Assert.Equal(3, (await repository.GetAllAsync()).Count);
        Assert.Equal(new[] { otherFile.Id }, (await repository.GetAdminFilesByUploaderIdAsync(otherOwner.Id))
            .Select(file => file.Id));

        var favorite = new Favorite
        {
            UserId = favoriteUser.Id,
            FileId = albumFile.Id,
            FavoritedAt = DateTime.UtcNow
        };
        await repository.AddFavoriteAsync(favorite);
        Assert.Equal(new[] { albumFile.Id }, await repository.GetFavoriteFileIdsByUserIdAsync(favoriteUser.Id));
        Assert.Equal(albumFile.Id, Assert.Single(await repository.GetFavoriteFilesByUserIdAsync(favoriteUser.Id)).Id);
        Assert.NotNull(await repository.GetFavoriteAsync(favoriteUser.Id, albumFile.Id));
        await repository.DeleteFavoriteAsync(favorite);
        Assert.Null(await repository.GetFavoriteAsync(favoriteUser.Id, albumFile.Id));

        personal.OriginalFileName = "renamed.txt";
        await repository.UpdateAsync(personal);
        Assert.Equal("renamed.txt", (await repository.GetByIdAsync(personal.Id))?.OriginalFileName);
        await repository.DeleteAsync(personal);
        Assert.Null(await repository.GetByIdAsync(personal.Id));
    }

    [Fact]
    public async Task Database_RejectsDuplicateEmailAndDuplicateAlbumMembership()
    {
        await using var connection = await OpenDatabaseAsync();
        var options = new DbContextOptionsBuilder<WinCaptureDbContext>()
            .UseSqlite(connection)
            .Options;
        await using var database = new WinCaptureDbContext(options);
        await database.Database.EnsureCreatedAsync();

        var owner = AddUser(database, "constraint-owner");
        var member = AddUser(database, "constraint-member");
        var album = AddAlbum(database, owner, "Constraint test");
        await database.SaveChangesAsync();

        database.Users.Add(new User
        {
            Name = "Duplicate",
            Email = owner.Email,
            EntraObjectId = "duplicate-object-id",
            Role = UserRole.User,
            CreatedAt = DateTime.UtcNow
        });
        await Assert.ThrowsAsync<DbUpdateException>(() => database.SaveChangesAsync());

        database.ChangeTracker.Clear();
        database.AlbumAccess.Add(new AlbumAccess
        {
            AlbumId = album.Id,
            UserId = member.Id,
            CanView = true,
            GrantedBy = owner.Id,
            GrantedAt = DateTime.UtcNow
        });
        await database.SaveChangesAsync();
        database.AlbumAccess.Add(new AlbumAccess
        {
            AlbumId = album.Id,
            UserId = member.Id,
            CanView = true,
            GrantedBy = owner.Id,
            GrantedAt = DateTime.UtcNow
        });

        await Assert.ThrowsAsync<DbUpdateException>(() => database.SaveChangesAsync());
    }

    private static async Task<SqliteConnection> OpenDatabaseAsync()
    {
        var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        return connection;
    }

    private static User AddUser(WinCaptureDbContext database, string suffix)
    {
        var user = new User
        {
            Name = suffix,
            Email = $"{suffix}@example.test",
            EntraObjectId = $"oid-{suffix}",
            Role = UserRole.User,
            CreatedAt = DateTime.UtcNow
        };
        database.Users.Add(user);
        database.SaveChanges();
        return user;
    }

    private static Album AddAlbum(WinCaptureDbContext database, User owner, string name)
    {
        var album = new Album
        {
            AlbumName = name,
            CreatedBy = owner.Id,
            Owner = owner,
            CreatedAt = DateTime.UtcNow
        };
        database.Albums.Add(album);
        database.SaveChanges();
        return album;
    }

    private static FileMetadata AddFile(
        WinCaptureDbContext database,
        User owner,
        string name,
        DateTime uploadedAt)
    {
        var file = new FileMetadata
        {
            OriginalFileName = name,
            StoredFileName = name,
            ContentType = "text/plain",
            FileSize = 3,
            UploadedBy = owner.Id,
            User = owner,
            UploadedAt = uploadedAt
        };
        database.Files.Add(file);
        database.SaveChanges();
        return file;
    }
}
