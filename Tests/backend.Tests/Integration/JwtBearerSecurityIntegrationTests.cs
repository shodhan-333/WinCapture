using System.Net;
using System.Net.Http.Headers;
using Xunit;

namespace WinCapture.Tests.Integration;

public sealed class JwtBearerSecurityIntegrationTests
{
    [Fact]
    public async Task ValidSignedBearerToken_IsValidatedAndMappedToWinCaptureUser()
    {
        using var factory = new WinCaptureApiFactory(useTestAuthentication: false);
        await factory.EnsureDatabaseCreatedAsync();
        using var client = CreateHttpsClient(factory);
        SetBearerToken(client, factory.CreateAccessToken(
            "signed-user",
            "signed@example.test",
            "WinCapture.User"));

        var response = await client.GetAsync("/api/auth/me");

        Assert.True(
            response.StatusCode == HttpStatusCode.OK,
            factory.LastBearerFailure?.ToString() ?? $"Unexpected status: {response.StatusCode}");
    }

    [Fact]
    public async Task InvalidSignature_IsRejectedByBearerAuthentication()
    {
        using var factory = new WinCaptureApiFactory(useTestAuthentication: false);
        using var client = CreateHttpsClient(factory);
        SetBearerToken(client, factory.CreateAccessToken(
            "signed-user",
            "signed@example.test",
            "WinCapture.User",
            useConfiguredSigningKey: false));

        var response = await client.GetAsync("/api/auth/me");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Theory]
    [InlineData("https://wrong-issuer.example.test", "api://wincapture-test")]
    [InlineData("https://issuer.example.test", "api://wrong-audience")]
    public async Task WrongIssuerOrAudience_IsRejected(
        string issuer,
        string audience)
    {
        using var factory = new WinCaptureApiFactory(useTestAuthentication: false);
        using var client = CreateHttpsClient(factory);
        SetBearerToken(client, factory.CreateAccessToken(
            "signed-user",
            "signed@example.test",
            "WinCapture.User",
            issuer,
            audience));

        var response = await client.GetAsync("/api/auth/me");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task ExpiredBearerToken_IsRejected()
    {
        using var factory = new WinCaptureApiFactory(useTestAuthentication: false);
        using var client = CreateHttpsClient(factory);
        SetBearerToken(client, factory.CreateAccessToken(
            "signed-user",
            "signed@example.test",
            "WinCapture.User",
            expires: DateTime.UtcNow.AddMinutes(-1)));

        var response = await client.GetAsync("/api/auth/me");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    private static HttpClient CreateHttpsClient(WinCaptureApiFactory factory) =>
        factory.CreateClient(new Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactoryClientOptions
        {
            BaseAddress = new Uri("https://localhost")
        });

    private static void SetBearerToken(HttpClient client, string token)
    {
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
    }
}
