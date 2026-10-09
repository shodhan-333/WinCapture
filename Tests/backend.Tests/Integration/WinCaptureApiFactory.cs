using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Cryptography;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.Data.Sqlite;
using Microsoft.IdentityModel.Tokens;
using Moq;
using WinCapture.Data;
using WinCapture.Services;

namespace WinCapture.Tests.Integration;

public sealed class WinCaptureApiFactory : WebApplicationFactory<Program>
{
    private readonly SqliteConnection _database = new("Data Source=:memory:");
    private readonly RSA _signingRsa = RSA.Create(2048);
    private readonly bool _useTestAuthentication;

    static WinCaptureApiFactory()
    {
        Environment.SetEnvironmentVariable("Storage__ConnectionString", "UseDevelopmentStorage=true");
        Environment.SetEnvironmentVariable("Storage__ContainerName", "wincapture-tests");
    }

    public WinCaptureApiFactory()
        : this(useTestAuthentication: true)
    {
    }

    public WinCaptureApiFactory(bool useTestAuthentication)
    {
        _useTestAuthentication = useTestAuthentication;
        _database.Open();
    }

    public Mock<IStorageService> Storage { get; } = new();
    public Exception? LastBearerFailure { get; private set; }

    public const string TestIssuer = "https://issuer.example.test";
    public const string TestAudience = "api://wincapture-test";

    public string CreateAccessToken(
        string objectId,
        string email,
        string role,
        string? issuer = null,
        string? audience = null,
        bool useConfiguredSigningKey = true,
        DateTime? expires = null)
    {
        using var alternateRsa = useConfiguredSigningKey ? null : RSA.Create(2048);
        var signingKey = new RsaSecurityKey(useConfiguredSigningKey ? _signingRsa : alternateRsa!);
        var credentials = new SigningCredentials(signingKey, SecurityAlgorithms.RsaSha256);
        var claims = new[]
        {
            new Claim("oid", objectId),
            new Claim("preferred_username", email),
            new Claim("name", "JWT integration user"),
            new Claim("roles", role),
            new Claim("scp", "access_as_user")
        };
        var now = DateTime.UtcNow;
        var expiration = expires ?? now.AddMinutes(5);
        var notBefore = expiration <= now
            ? expiration.AddMinutes(-2)
            : now.AddMinutes(-1);
        var token = new JwtSecurityToken(
            issuer ?? TestIssuer,
            audience ?? TestAudience,
            claims,
            notBefore: notBefore,
            expires: expiration,
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureAppConfiguration((_, configuration) =>
        {
            configuration.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:WinCaptureDatabase"] = "Server=localhost;Database=WinCaptureTests;User Id=test;Password=test;TrustServerCertificate=True",
                ["AzureAd:Instance"] = "https://login.microsoftonline.com/",
                ["AzureAd:TenantId"] = "00000000-0000-0000-0000-000000000001",
                ["AzureAd:ClientId"] = "00000000-0000-0000-0000-000000000002",
                ["AzureAd:Domain"] = "example.test",
                ["AzureAd:Audience"] = "api://00000000-0000-0000-0000-000000000002",
                ["Storage:ConnectionString"] = "UseDevelopmentStorage=true",
                ["Storage:ContainerName"] = "wincapture-tests"
            });
        });

        builder.ConfigureTestServices(services =>
        {
            services.AddLogging(logging =>
            {
                logging.ClearProviders();
                logging.AddConsole();
            });
            services.RemoveAll<WinCaptureDbContext>();
            services.RemoveAll<DbContextOptions<WinCaptureDbContext>>();
            services.RemoveAll<IDbContextOptionsConfiguration<WinCaptureDbContext>>();
            services.AddDbContext<WinCaptureDbContext>(options => options.UseSqlite(_database));

            if (_useTestAuthentication)
            {
                services.AddAuthentication(options =>
                    {
                        options.DefaultScheme = TestAuthenticationHandler.SchemeName;
                        options.DefaultAuthenticateScheme = TestAuthenticationHandler.SchemeName;
                        options.DefaultChallengeScheme = TestAuthenticationHandler.SchemeName;
                    })
                    .AddScheme<AuthenticationSchemeOptions, TestAuthenticationHandler>(
                        TestAuthenticationHandler.SchemeName,
                        _ => { });
            }
            else
            {
                services.PostConfigure<JwtBearerOptions>(
                    JwtBearerDefaults.AuthenticationScheme,
                    options =>
                    {
                        options.Authority = null;
                        options.ConfigurationManager = null;
                        options.RequireHttpsMetadata = false;
                        options.MapInboundClaims = false;
                        options.TokenValidationParameters = new TokenValidationParameters
                        {
                            ValidateIssuer = true,
                            ValidIssuer = TestIssuer,
                            ValidateAudience = true,
                            ValidAudience = TestAudience,
                            ValidateLifetime = true,
                            ValidateIssuerSigningKey = true,
                            IssuerSigningKey = new RsaSecurityKey(_signingRsa),
                            RoleClaimType = "roles",
                            NameClaimType = "name",
                            ClockSkew = TimeSpan.Zero
                        };
                        options.Events = new JwtBearerEvents
                        {
                            OnAuthenticationFailed = context =>
                            {
                                LastBearerFailure = context.Exception;
                                return Task.CompletedTask;
                            }
                        };
                    });
            }

            services.RemoveAll<IStorageService>();
            services.AddSingleton(Storage.Object);
        });
    }

    public async Task SeedAsync(params object[] entities)
    {
        using var scope = Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<WinCaptureDbContext>();
        await database.Database.EnsureCreatedAsync();
        database.AddRange(entities);
        await database.SaveChangesAsync();
    }

    public async Task EnsureDatabaseCreatedAsync()
    {
        using var scope = Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<WinCaptureDbContext>();
        await database.Database.EnsureCreatedAsync();
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        if (disposing)
        {
            _database.Dispose();
            _signingRsa.Dispose();
        }
    }
}

public sealed class TestAuthenticationHandler(
    IOptionsMonitor<AuthenticationSchemeOptions> options,
    ILoggerFactory logger,
    UrlEncoder encoder) : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    public const string SchemeName = "WinCaptureTest";

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var email = Request.Headers["X-Test-Email"].ToString();

        if (string.IsNullOrWhiteSpace(email))
        {
            return Task.FromResult(AuthenticateResult.NoResult());
        }

        var role = Request.Headers["X-Test-Role"].ToString();
        var claims = new List<Claim>
        {
            new("oid", Request.Headers["X-Test-Oid"].ToString()),
            new("preferred_username", email),
            new("name", Request.Headers["X-Test-Name"].ToString())
        };

        if (!string.IsNullOrWhiteSpace(role))
        {
            claims.Add(new Claim("roles", role));
        }

        var identity = new ClaimsIdentity(claims, Scheme.Name, "name", "roles");
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, Scheme.Name);

        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}
