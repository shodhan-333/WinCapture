using System.Net;
using System.Net.Http.Json;
using Moq;
using WinCapture.Data;
using WinCapture.DTOs.Auth;
using WinCapture.DTOs.Albums;
using WinCapture.Models;
using Xunit;

namespace WinCapture.Tests.Integration;

public sealed class ApiSecurityIntegrationTests : IDisposable
{
    private readonly WinCaptureApiFactory _factory = new();

    public void Dispose() => _factory.Dispose();

    [Fact]
    public async Task AdminEndpoint_RejectsUnauthenticatedRequest()
    {
        using var client = CreateHttpsClient();

        var response = await client.GetAsync("/api/admin/files");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Cors_AllowsConfiguredTrustedOriginAndRejectsUnlistedOrigin()
    {
        using var client = CreateHttpsClient();

        using var allowedRequest = new HttpRequestMessage(HttpMethod.Options, "/api/auth/me");
        allowedRequest.Headers.Add("Origin", "https://frontend.example.test");
        allowedRequest.Headers.Add("Access-Control-Request-Method", "GET");
        var allowedResponse = await client.SendAsync(allowedRequest);

        using var unlistedRequest = new HttpRequestMessage(HttpMethod.Options, "/api/auth/me");
        unlistedRequest.Headers.Add("Origin", "https://unlisted.example.test");
        unlistedRequest.Headers.Add("Access-Control-Request-Method", "GET");
        var unlistedResponse = await client.SendAsync(unlistedRequest);

        Assert.Equal("https://frontend.example.test", allowedResponse.Headers
            .GetValues("Access-Control-Allow-Origin").Single());
        Assert.False(unlistedResponse.Headers.Contains("Access-Control-Allow-Origin"));
    }

    [Fact]
    public async Task AdminEndpoint_RejectsAuthenticatedUserRole()
    {
        await _factory.EnsureDatabaseCreatedAsync();
        using var client = CreateHttpsClient();
        AddIdentityHeaders(client, "ordinary-user", "user@example.test", "WinCapture.User");

        var response = await client.GetAsync("/api/admin/files");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task AdminEndpoint_AllowsEntraAdminAppRole()
    {
        await _factory.EnsureDatabaseCreatedAsync();
        using var client = CreateHttpsClient();
        AddIdentityHeaders(client, "admin-user", "admin@example.test", "WinCapture.Admin");

        var response = await client.GetAsync("/api/admin/files");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task CurrentUserEndpoint_UsesProvisionedIdentityAndRoleClaims()
    {
        await _factory.EnsureDatabaseCreatedAsync();
        using var client = CreateHttpsClient();
        AddIdentityHeaders(client, "me-user", "person@example.test", "WinCapture.User", "Person");

        var response = await client.GetAsync("/api/auth/me");
        var currentUser = await response.Content.ReadFromJsonAsync<CurrentUserResponse>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(currentUser);
        Assert.Equal("Person", currentUser.Name);
        Assert.Equal("person@example.test", currentUser.Email);
        Assert.Equal("User", currentUser.Role);
        Assert.Equal("Microsoft Entra ID", currentUser.AuthenticationType);
    }

    [Fact]
    public async Task AlbumEndpoint_AllowsAuthenticatedWinCaptureUserRole()
    {
        await _factory.EnsureDatabaseCreatedAsync();
        using var client = CreateHttpsClient();
        AddIdentityHeaders(client, "album-user", "albums@example.test", "WinCapture.User");

        var response = await client.GetAsync("/api/albums");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task SharedViewer_CanReadFileDetailsThroughAuthenticatedPipeline()
    {
        var (owner, viewer, album, file) = SharedFileFixture();
        await _factory.SeedAsync(owner, viewer, album, new AlbumAccess
        {
            AlbumId = album.Id,
            UserId = viewer.Id,
            CanView = true,
            CanDownload = false,
            GrantedAt = DateTime.UtcNow,
            GrantedBy = owner.Id
        }, file);
        using var client = CreateHttpsClient();
        AddIdentityHeaders(client, viewer.EntraObjectId, viewer.Email, "WinCapture.User", viewer.Name);

        var response = await client.GetAsync($"/api/files/{file.Id}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task SharedViewer_CannotDeleteFileThroughAuthenticatedPipeline()
    {
        var (owner, viewer, album, file) = SharedFileFixture();
        await _factory.SeedAsync(owner, viewer, album, new AlbumAccess
        {
            AlbumId = album.Id,
            UserId = viewer.Id,
            CanView = true,
            CanDownload = false,
            GrantedAt = DateTime.UtcNow,
            GrantedBy = owner.Id
        }, file);
        using var client = CreateHttpsClient();
        AddIdentityHeaders(client, viewer.EntraObjectId, viewer.Email, "WinCapture.User", viewer.Name);

        var response = await client.DeleteAsync($"/api/files/{file.Id}");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        _factory.Storage.Verify(storage => storage.DeleteAsync(It.IsAny<string>()), Moq.Times.Never);
    }

    private static (User Owner, User Viewer, Album Album, FileMetadata File) SharedFileFixture()
    {
        var suffix = Guid.NewGuid().ToString("N");
        var owner = new User
        {
            Id = Random.Shared.Next(1000, 100000),
            Name = "Album owner",
            Email = $"owner-{suffix}@example.test",
            EntraObjectId = $"owner-{suffix}",
            Role = UserRole.User,
            CreatedAt = DateTime.UtcNow
        };
        var viewer = new User
        {
            Id = Random.Shared.Next(100001, 200000),
            Name = "Shared viewer",
            Email = $"viewer-{suffix}@example.test",
            EntraObjectId = $"viewer-{suffix}",
            Role = UserRole.User,
            CreatedAt = DateTime.UtcNow
        };
        var album = new Album
        {
            Id = Random.Shared.Next(1000, 100000),
            AlbumName = "Shared album",
            CreatedBy = owner.Id,
            CreatedAt = DateTime.UtcNow,
            Owner = owner
        };
        var file = new FileMetadata
        {
            Id = Random.Shared.Next(100001, 200000),
            OriginalFileName = "shared.txt",
            StoredFileName = $"{suffix}.txt",
            ContentType = "text/plain",
            FileSize = 5,
            UploadedBy = owner.Id,
            AlbumId = album.Id,
            UploadedAt = DateTime.UtcNow,
            User = owner
        };

        return (owner, viewer, album, file);
    }

    private static void AddIdentityHeaders(
        HttpClient client,
        string objectId,
        string email,
        string role,
        string name = "Test user")
    {
        client.DefaultRequestHeaders.Add("X-Test-Oid", objectId);
        client.DefaultRequestHeaders.Add("X-Test-Email", email);
        client.DefaultRequestHeaders.Add("X-Test-Role", role);
        client.DefaultRequestHeaders.Add("X-Test-Name", name);
    }

    private HttpClient CreateHttpsClient() => _factory.CreateClient(
        new Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactoryClientOptions
        {
            BaseAddress = new Uri("https://localhost")
        });
}
