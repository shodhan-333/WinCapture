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
    public async Task FileRepository_PaginatesSearchAndEverySupportedCategory()
    {
        await using var connection = await OpenDatabaseAsync();
        var options = new DbContextOptionsBuilder<WinCaptureDbContext>()
            .UseSqlite(connection)
            .Options;
        await using var database = new WinCaptureDbContext(options);
        await database.Database.EnsureCreatedAsync();

        var user = AddUser(database, "category-user");
        var names = new[] { "photo.jpg", "report.pdf", "clip.mp4", "song.mp3", "backup.zip", "notes.txt", "unknown.bin" };
        var files = names.Select((name, index) => AddFile(database, user, name, DateTime.UtcNow.AddMinutes(-index))).ToArray();
        files[0].ContentType = "image/png";
        await database.SaveChangesAsync();

        var repository = new FileRepository(database);
        async Task<long[]> Search(string? search, string? category, int page = 1, int pageSize = 10)
        {
            var result = await repository.GetPagedByUserIdAsync(user.Id, new PaginationQuery
            {
                Search = search,
                Category = category,
                Page = page,
                PageSize = pageSize
            });
            return result.Items.Select(file => file.Id).ToArray();
        }

        Assert.Equal(7, (await repository.GetPagedByUserIdAsync(user.Id, new PaginationQuery { Page = 1, PageSize = 10 })).TotalItems);
        Assert.Equal(new[] { files[1].Id }, await Search(" report ", null));
        Assert.Equal(new[] { files[0].Id }, await Search("image/png", null));
        Assert.Equal(new[] { files[1].Id }, await Search(files[1].Id.ToString(), null));
        Assert.Equal(new[] { files[0].Id }, await Search(null, "Images"));
        Assert.Equal(new[] { files[1].Id, files[5].Id }, await Search(null, "Documents"));
        Assert.Equal(new[] { files[2].Id }, await Search(null, "Videos"));
        Assert.Equal(new[] { files[3].Id }, await Search(null, "Audio"));
        Assert.Equal(new[] { files[4].Id }, await Search(null, "Archives"));
        Assert.Equal(7, (await Search(null, "All")).Length);
        Assert.Equal(7, (await Search(null, "Unknown")).Length);
        Assert.Equal(1, (await repository.GetPagedByUserIdAsync(user.Id, new PaginationQuery { Page = 99, PageSize = 10 })).Page);
        Assert.Equal(7, (await Search(null, null, page: 1, pageSize: 7)).Length);
    }

    [Fact]
    public async Task FileRepository_AdminSearchRanksEveryMatchingMetadataField()
    {
        await using var connection = await OpenDatabaseAsync();
        var options = new DbContextOptionsBuilder<WinCaptureDbContext>().UseSqlite(connection).Options;
        await using var database = new WinCaptureDbContext(options);
        await database.Database.EnsureCreatedAsync();
        var owner = AddUser(database, "rank-owner");
        var album = AddAlbum(database, owner, "Coastal trips");
        var file = AddFile(database, owner, "coastal.jpg", DateTime.UtcNow);
        file.ContentType = "image/plain";
        file.AlbumId = album.Id;
        file.Album = album;
        await database.SaveChangesAsync();
        var repository = new FileRepository(database);

        async Task<FileMetadata> Search(string search) => Assert.Single((await repository.GetPagedAllAsync(
            new PaginationQuery { Search = search, PageSize = 10 })).Items);

        Assert.Equal(file.Id, (await Search("coastal.jpg")).Id); // exact file name
        Assert.Equal(file.Id, (await Search("coastal")).Id); // file-name prefix
        Assert.Equal(file.Id, (await Search("astal")).Id); // file-name substring
        Assert.Equal(file.Id, (await Search("image/plain")).Id); // content type
        Assert.Equal(file.Id, (await Search(file.Id.ToString())).Id); // file ID
        Assert.Equal(file.Id, (await Search(owner.Id.ToString())).Id); // uploader ID fallback rank
        Assert.Equal(file.Id, (await Search(owner.Name)).Id); // uploader name
        Assert.Equal(file.Id, (await Search(album.AlbumName)).Id); // album name
    }

    [Fact]
    public async Task FileRepository_PagedFavoritesEnforcesVisibilitySearchCategoriesAndBounds()
    {
        await using var connection = await OpenDatabaseAsync();
        var options = new DbContextOptionsBuilder<WinCaptureDbContext>().UseSqlite(connection).Options;
        await using var database = new WinCaptureDbContext(options);
        await database.Database.EnsureCreatedAsync();

        var viewer = AddUser(database, "favorite-viewer");
        var other = AddUser(database, "favorite-other");
        var shared = AddAlbum(database, other, "Shared favorites");
        var hidden = AddAlbum(database, other, "Hidden favorites");
        database.AlbumAccess.Add(new AlbumAccess
        {
            AlbumId = shared.Id, UserId = viewer.Id, CanView = true, CanDownload = false,
            GrantedBy = other.Id, GrantedAt = DateTime.UtcNow
        });
        database.AlbumAccess.Add(new AlbumAccess
        {
            AlbumId = hidden.Id, UserId = viewer.Id, CanView = false, CanDownload = false,
            GrantedBy = other.Id, GrantedAt = DateTime.UtcNow
        });
        await database.SaveChangesAsync();

        var files = new[]
        {
            AddFile(database, viewer, "photo.jpg", DateTime.UtcNow),
            AddFile(database, viewer, "report.pdf", DateTime.UtcNow.AddMinutes(-1)),
            AddFile(database, viewer, "clip.mp4", DateTime.UtcNow.AddMinutes(-2)),
            AddFile(database, viewer, "song.mp3", DateTime.UtcNow.AddMinutes(-3)),
            AddFile(database, viewer, "backup.zip", DateTime.UtcNow.AddMinutes(-4)),
            AddFile(database, other, "visible.txt", DateTime.UtcNow.AddMinutes(-5)),
            AddFile(database, other, "secret.txt", DateTime.UtcNow.AddMinutes(-6))
        };
        foreach (var file in files)
        {
            file.ContentType = "application/octet-stream";
        }
        files[5].ContentType = "text/plain";
        files[5].AlbumId = shared.Id;
        files[5].Album = shared;
        files[6].AlbumId = hidden.Id;
        files[6].Album = hidden;
        await database.SaveChangesAsync();
        database.Favorites.AddRange(files.Select((file, index) => new Favorite
        {
            UserId = viewer.Id, FileId = file.Id, File = file,
            FavoritedAt = DateTime.UtcNow.AddMinutes(-index)
        }));
        await database.SaveChangesAsync();

        var repository = new FileRepository(database);
        async Task<PagedResponse<FileMetadata>> Query(UserRole role, string? search = null, string? category = null, int page = 1) =>
            await repository.GetPagedFavoriteFilesByUserIdAsync(viewer.Id, role, new PaginationQuery
            {
                Search = search, Category = category, Page = page, PageSize = 2
            });

        var userResults = await Query(UserRole.User);
        Assert.Equal(6, userResults.TotalItems);
        Assert.DoesNotContain(userResults.Items, file => file.OriginalFileName == "secret.txt");
        Assert.Equal(new[] { "photo.jpg", "report.pdf" }, userResults.Items.Select(file => file.OriginalFileName));
        Assert.Equal("visible.txt", Assert.Single((await Query(UserRole.User, " visible ")).Items).OriginalFileName);
        Assert.Equal("visible.txt", Assert.Single((await Query(UserRole.User, "text/plain")).Items).OriginalFileName);
        Assert.Equal("visible.txt", Assert.Single((await Query(UserRole.User, files[5].Id.ToString())).Items).OriginalFileName);
        Assert.Equal("photo.jpg", Assert.Single((await Query(UserRole.User, category: "Images")).Items).OriginalFileName);
        var documents = await Query(UserRole.User, category: "Documents");
        Assert.Equal(2, documents.TotalItems);
        Assert.Contains(documents.Items, file => file.OriginalFileName == "report.pdf");
        Assert.Contains(documents.Items, file => file.OriginalFileName == "visible.txt");
        Assert.Equal("clip.mp4", Assert.Single((await Query(UserRole.User, category: "Videos")).Items).OriginalFileName);
        Assert.Equal("song.mp3", Assert.Single((await Query(UserRole.User, category: "Audio")).Items).OriginalFileName);
        Assert.Equal("backup.zip", Assert.Single((await Query(UserRole.User, category: "Archives")).Items).OriginalFileName);
        Assert.Equal(3, (await Query(UserRole.User, page: 99)).Page);

        var adminResults = await Query(UserRole.Admin);
        Assert.Equal(7, adminResults.TotalItems);
        Assert.Contains((await Query(UserRole.Admin, page: 4)).Items, file => file.OriginalFileName == "secret.txt");
        Assert.Equal(0, (await Query(UserRole.Admin, "not-found")).TotalItems);
    }

    [Fact]
    public async Task AlbumRepository_PagedQueriesSupportOwnershipAccessSearchAndPageBounds()
    {
        await using var connection = await OpenDatabaseAsync();
        var options = new DbContextOptionsBuilder<WinCaptureDbContext>().UseSqlite(connection).Options;
        await using var database = new WinCaptureDbContext(options);
        await database.Database.EnsureCreatedAsync();

        var owner = AddUser(database, "album-query-owner");
        var member = AddUser(database, "album-query-member");
        var privateAlbum = AddAlbum(database, owner, "Orchid collection");
        var sharedAlbum = AddAlbum(database, AddUser(database, "album-query-other"), "Mountain archive");
        database.AlbumAccess.Add(new AlbumAccess
        {
            AlbumId = sharedAlbum.Id,
            UserId = member.Id,
            CanView = true,
            GrantedBy = sharedAlbum.CreatedBy,
            GrantedAt = DateTime.UtcNow
        });
        await database.SaveChangesAsync();

        var repository = new AlbumRepository(database);
        static PaginationQuery Query(string? search = null, int page = 1) => new()
        {
            Search = search,
            Page = page,
            PageSize = 1
        };

        Assert.Equal(privateAlbum.Id, Assert.Single((await repository.GetPagedOwnedByUserIdAsync(owner.Id, Query())).Items).Id);
        Assert.Equal(privateAlbum.Id, Assert.Single((await repository.GetPagedOwnedByUserIdAsync(owner.Id, Query("Orchid"))).Items).Id);
        Assert.Equal(privateAlbum.Id, Assert.Single((await repository.GetPagedOwnedByUserIdAsync(owner.Id, Query(owner.Name))).Items).Id);
        Assert.Equal(privateAlbum.Id, Assert.Single((await repository.GetPagedOwnedByUserIdAsync(owner.Id, Query(owner.Id.ToString()))).Items).Id);
        Assert.Equal(privateAlbum.Id, Assert.Single((await repository.GetPagedAccessibleByUserIdAsync(owner.Id, Query())).Items).Id);
        Assert.Equal(sharedAlbum.Id, Assert.Single((await repository.GetPagedAccessibleByUserIdAsync(member.Id, Query("Mountain"))).Items).Id);
        Assert.Equal(sharedAlbum.Id, Assert.Single((await repository.GetPagedSharedWithUserIdAsync(member.Id, Query())).Items).Id);
        Assert.Equal(privateAlbum.Id, Assert.Single((await repository.GetPagedAllAsync(Query("Orchid"))).Items).Id);
        Assert.Equal(sharedAlbum.Id, Assert.Single((await repository.GetPagedAllAsync(Query(sharedAlbum.Id.ToString()))).Items).Id);
        Assert.Equal(sharedAlbum.Id, Assert.Single((await repository.GetPagedAllAsync(Query(sharedAlbum.CreatedBy.ToString()))).Items).Id);
        Assert.Equal(sharedAlbum.Id, Assert.Single((await repository.GetPagedAllAsync(Query("album-query-other"))).Items).Id);
        Assert.Equal(2, (await repository.GetPagedAllAsync(Query(page: 99))).Page);
        Assert.Equal(2, (await repository.GetPagedAllAsync(Query())).TotalItems);
    }

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

    [Fact]
    public async Task FileRepository_ListsSearchesAndMutatesFilesAndFavorites()
    {
        await using var connection = await OpenDatabaseAsync();
        var options = new DbContextOptionsBuilder<WinCaptureDbContext>().UseSqlite(connection).Options;
        await using var database = new WinCaptureDbContext(options);
        await database.Database.EnsureCreatedAsync();

        var owner = AddUser(database, "repository-operations-owner");
        var other = AddUser(database, "repository-operations-other");
        var album = AddAlbum(database, owner, "Repository operations album");
        var personal = AddFile(database, owner, "personal.txt", DateTime.UtcNow);
        var albumFile = AddFile(database, other, "album-photo.jpg", DateTime.UtcNow.AddMinutes(-1));
        albumFile.AlbumId = album.Id;
        albumFile.Album = album;
        await database.SaveChangesAsync();

        var repository = new FileRepository(database);
        var added = new FileMetadata
        {
            OriginalFileName = "added.txt", StoredFileName = "added.txt", ContentType = "text/plain",
            FileSize = 5, UploadedBy = owner.Id, User = owner, UploadedAt = DateTime.UtcNow
        };
        await repository.AddAsync(added);
        Assert.NotNull(await repository.GetByIdAsync(added.Id));
        Assert.Null(await repository.GetByIdAsync(-1));
        Assert.Equal(2, (await repository.GetByUserIdAsync(owner.Id)).Count);
        Assert.Contains(personal.Id, (await repository.GetByUserIdAsync(owner.Id)).Select(file => file.Id));
        Assert.Single((await repository.GetPagedByAlbumIdAsync(album.Id, new PaginationQuery
        {
            Search = "photo", Category = "Images"
        })).Items);
        Assert.Equal(3, (await repository.GetAllAsync()).Count);
        Assert.Single((await repository.GetPagedAllAsync(new PaginationQuery { Category = "Images" })).Items);
        Assert.Equal(3, (await repository.GetPagedAllAsync(new PaginationQuery { Category = "Unknown" })).TotalItems);
        Assert.Single((await repository.GetAdminFilesByUploaderIdAsync(other.Id)));
        Assert.Single((await repository.GetPagedByAlbumIdAsync(album.Id, new PaginationQuery())).Items);
        Assert.Single((await repository.GetPagedAdminFilesByUploaderIdAsync(other.Id, new PaginationQuery())).Items);
        Assert.Single((await repository.GetPagedAdminFilesByUploaderIdAsync(
            other.Id, new PaginationQuery { Search = "Repository operations album" })).Items);

        var favorite = new Favorite { UserId = owner.Id, FileId = personal.Id, FavoritedAt = DateTime.UtcNow };
        await repository.AddFavoriteAsync(favorite);
        Assert.Single(await repository.GetFavoriteFileIdsByUserIdAsync(owner.Id));
        Assert.Single(await repository.GetFavoriteFileIdsByUserIdAsync(owner.Id, [personal.Id]));
        Assert.Equal(personal.Id, Assert.Single(await repository.GetFavoriteFilesByUserIdAsync(owner.Id)).Id);
        Assert.NotNull(await repository.GetFavoriteAsync(owner.Id, personal.Id));
        Assert.Null(await repository.GetFavoriteAsync(other.Id, personal.Id));
        await repository.DeleteFavoriteAsync(favorite);
        Assert.Empty(await repository.GetFavoriteFileIdsByUserIdAsync(owner.Id));

        added.OriginalFileName = "updated.txt";
        await repository.UpdateAsync(added);
        Assert.Equal("updated.txt", (await repository.GetByIdAsync(added.Id))!.OriginalFileName);
        await repository.DeleteAsync(added);
        Assert.Null(await repository.GetByIdAsync(added.Id));
    }

    [Fact]
    public async Task AlbumRepository_AddAsyncPersistsAlbums()
    {
        await using var connection = await OpenDatabaseAsync();
        var options = new DbContextOptionsBuilder<WinCaptureDbContext>().UseSqlite(connection).Options;
        await using var database = new WinCaptureDbContext(options);
        await database.Database.EnsureCreatedAsync();
        var owner = AddUser(database, "album-repository-add-owner");
        var album = new Album
        {
            AlbumName = "Created through repository", CreatedBy = owner.Id, Owner = owner,
            CreatedAt = DateTime.UtcNow
        };

        await new AlbumRepository(database).AddAsync(album);

        Assert.True(album.Id > 0);
        Assert.Equal("Created through repository", (await database.Albums.SingleAsync()).AlbumName);
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
