using Azure.Storage.Blobs;
using Azure.Identity;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Data.SqlClient;
using Microsoft.Identity.Web;
using Microsoft.OpenApi;
using WinCapture.Data;
using WinCapture.Middleware;
using WinCapture.Repositories;
using WinCapture.Services;
using WinCapture.Validators;

var builder = WebApplication.CreateBuilder(args);

if (!builder.Environment.IsDevelopment())
{
    foreach (var key in new[] { "AzureAd:TenantId", "AzureAd:ClientId", "ConnectionStrings:WinCaptureDatabase", "Storage:ContainerName" })
    {
        if (string.IsNullOrWhiteSpace(builder.Configuration[key]))
        {
            throw new InvalidOperationException($"Required production configuration '{key}' is missing.");
        }
    }

    if (string.IsNullOrWhiteSpace(builder.Configuration["Storage:ServiceUri"]))
    {
        throw new InvalidOperationException("Required production configuration 'Storage:ServiceUri' is missing. Configure the Blob service endpoint and use the App Service managed identity.");
    }

    if (!Guid.TryParse(builder.Configuration["AzureAd:TenantId"], out _)
        || !Guid.TryParse(builder.Configuration["AzureAd:ClientId"], out _))
    {
        throw new InvalidOperationException("AzureAd:TenantId and AzureAd:ClientId must be valid Entra application GUIDs.");
    }

    var productionSql = new SqlConnectionStringBuilder(builder.Configuration.GetConnectionString("WinCaptureDatabase"));
    if (productionSql.Authentication != SqlAuthenticationMethod.ActiveDirectoryManagedIdentity
        || !productionSql.Encrypt
        || productionSql.TrustServerCertificate)
    {
        throw new InvalidOperationException("Production SQL configuration must use Active Directory Managed Identity with encryption and certificate validation enabled.");
    }
}

var configuredCorsOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>() ?? [];
var corsOrigins = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
foreach (var configuredOrigin in configuredCorsOrigins)
{
    if (!Uri.TryCreate(configuredOrigin, UriKind.Absolute, out var origin)
        || (origin.Scheme != Uri.UriSchemeHttp && origin.Scheme != Uri.UriSchemeHttps)
        || !string.IsNullOrEmpty(origin.UserInfo)
        || origin.AbsolutePath != "/"
        || !string.IsNullOrEmpty(origin.Query)
        || !string.IsNullOrEmpty(origin.Fragment)
        || configuredOrigin.Contains('*'))
    {
        throw new InvalidOperationException(
            $"Cors:AllowedOrigins contains an invalid origin: '{configuredOrigin}'. Configure explicit HTTP or HTTPS origins without paths or wildcards.");
    }

    corsOrigins.Add(origin.GetLeftPart(UriPartial.Authority));
}

if (builder.Environment.IsDevelopment())
{
    corsOrigins.Add("https://localhost:5173");
}
else if (builder.Environment.IsProduction() && corsOrigins.Count == 0)
{
    throw new InvalidOperationException(
        "Configure at least one trusted frontend origin in Cors:AllowedOrigins for non-development environments.");
}

var databaseConnectionString = builder.Configuration.GetConnectionString("WinCaptureDatabase");
if (string.IsNullOrWhiteSpace(databaseConnectionString))
{
    throw new InvalidOperationException("ConnectionStrings:WinCaptureDatabase is missing.");
}
builder.Services.AddDbContext<WinCaptureDbContext>(options => options.UseSqlServer(databaseConnectionString));

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddMicrosoftIdentityWebApi(builder.Configuration.GetSection("AzureAd"));

builder.Services.PostConfigure<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme, options =>
{
    options.MapInboundClaims = false;
    options.TokenValidationParameters.NameClaimType = "name";
    options.TokenValidationParameters.RoleClaimType = "roles";
    options.Events ??= new JwtBearerEvents();
    var previousTokenValidated = options.Events.OnTokenValidated;
    options.Events.OnTokenValidated = async context =>
    {
        if (previousTokenValidated is not null)
        {
            await previousTokenValidated(context);
        }

        if (context.Result?.Failure is not null)
        {
            return;
        }

        var scopes = context.Principal?.FindFirst("scp")?.Value
            .Split(' ', StringSplitOptions.RemoveEmptyEntries)
            ?? [];
        if (!scopes.Contains("access_as_user", StringComparer.Ordinal))
        {
            context.Fail("The required WinCapture API delegated scope is missing.");
        }
    };
});

builder.Services.AddAuthorization();
builder.Services.AddRateLimiter(options =>
{
    options.AddPolicy("api", context => RateLimitPartition.GetFixedWindowLimiter(
        context.User.FindFirst("oid")?.Value ?? context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 300,
            Window = TimeSpan.FromMinutes(1),
            QueueLimit = 0,
            AutoReplenishment = true
        }));
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.OnRejected = async (context, _) =>
    {
        context.HttpContext.Response.ContentType = "application/json";
        await context.HttpContext.Response.WriteAsJsonAsync(
            new WinCapture.DTOs.Common.ErrorResponse(StatusCodes.Status429TooManyRequests, "Too many requests. Try again shortly."));
    };
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendCors", policy =>
    {
        policy.WithOrigins(corsOrigins.ToArray()).AllowAnyHeader().AllowAnyMethod();
    });
});

builder.Services.AddControllers();
builder.Services.AddApplicationInsightsTelemetry();
builder.Services.Configure<FormOptions>(options => options.MultipartBodyLengthLimit = 11 * 1024 * 1024);
builder.WebHost.ConfigureKestrel(options => options.Limits.MaxRequestBodySize = 11 * 1024 * 1024);
builder.Services.AddHealthChecks()
    .AddDbContextCheck<WinCaptureDbContext>("database");
builder.Services.AddHttpContextAccessor();

builder.Services.AddScoped<IClaimsTransformation, MicrosoftIdentityClaimsTransformation>();

builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IFileRepository, FileRepository>();
builder.Services.AddScoped<IAlbumRepository, AlbumRepository>();

builder.Services.AddScoped<MicrosoftUserService>();
builder.Services.AddScoped<FileValidator>();
builder.Services.AddScoped<IFileService, FileService>();
builder.Services.AddScoped<IAlbumService, AlbumService>();
builder.Services.AddScoped<IAlbumFileService, AlbumFileService>();

var storageContainerName =
    builder.Configuration["Storage:ContainerName"]
    ?? throw new InvalidOperationException("Storage container name is missing.");

BlobServiceClient blobServiceClient;
var storageServiceUri = builder.Configuration["Storage:ServiceUri"];
if (!string.IsNullOrWhiteSpace(storageServiceUri))
{
    if (!Uri.TryCreate(storageServiceUri, UriKind.Absolute, out var serviceUri) || serviceUri.Scheme != Uri.UriSchemeHttps)
    {
        throw new InvalidOperationException("Storage:ServiceUri must be an absolute HTTPS Blob service endpoint.");
    }
    blobServiceClient = new BlobServiceClient(serviceUri, new DefaultAzureCredential());
}
else
{
    var storageConnectionString = builder.Configuration["Storage:ConnectionString"]
        ?? throw new InvalidOperationException("Configure Storage:ServiceUri or Storage:ConnectionString.");
    blobServiceClient = new BlobServiceClient(storageConnectionString);
}

var containerClient =
    blobServiceClient.GetBlobContainerClient(
        storageContainerName);
builder.Services.AddSingleton(containerClient);
builder.Services.AddSingleton<IStorageService, AzureBlobStorageService>();

builder.Services.AddOpenApi(options =>
{
    options.AddDocumentTransformer((document, _, _) =>
    {
        document.Components ??= new OpenApiComponents();
        document.Components.SecuritySchemes ??= new Dictionary<string, IOpenApiSecurityScheme>();

        document.Components.SecuritySchemes["oauth2"] = new OpenApiSecurityScheme
        {
            Type = SecuritySchemeType.OAuth2,
            Flows = new OpenApiOAuthFlows
            {
                AuthorizationCode = new OpenApiOAuthFlow
                {
                    AuthorizationUrl = new Uri($"https://login.microsoftonline.com/{builder.Configuration["AzureAd:TenantId"]}/oauth2/v2.0/authorize"),
                    TokenUrl = new Uri($"https://login.microsoftonline.com/{builder.Configuration["AzureAd:TenantId"]}/oauth2/v2.0/token"),
                    Scopes = new Dictionary<string, string>
                    {
                        {
                            $"api://{builder.Configuration["AzureAd:ClientId"]}/access_as_user",
                            "Access WinCapture API"
                        }
                    }
                }
            }
        };

        foreach (var operation in document.Paths.Values
            .SelectMany(path => path.Operations?.Values ?? Enumerable.Empty<OpenApiOperation>()))
        {
            operation.Security ??= new List<OpenApiSecurityRequirement>();

            operation.Security.Add(new OpenApiSecurityRequirement
            {
                [new OpenApiSecuritySchemeReference("oauth2", document)] = []
            });
        }

        return Task.CompletedTask;
    });
});

var app = builder.Build();

if (app.Environment.IsProduction())
{
    app.UseForwardedHeaders(new ForwardedHeadersOptions
    {
        ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
    });
    app.UseHsts();
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi().AllowAnonymous();

    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/openapi/v1.json", "WinCapture API v1");
        options.OAuthClientId(builder.Configuration["AzureAd:ClientId"]);
        options.OAuthUsePkce();
        options.OAuthScopes($"api://{builder.Configuration["AzureAd:ClientId"]}/access_as_user");
        options.OAuth2RedirectUrl("https://localhost:7106/swagger/oauth2-redirect.html");
    });
}

app.UseHttpsRedirection();
app.Use(async (context, next) =>
{
    context.Response.Headers.TryAdd("X-Correlation-ID", context.TraceIdentifier);
    if (context.Request.Path.StartsWithSegments("/api"))
    {
        context.Response.Headers.TryAdd("X-Content-Type-Options", "nosniff");
        context.Response.Headers.TryAdd("Referrer-Policy", "strict-origin-when-cross-origin");
        context.Response.Headers.TryAdd("X-Frame-Options", "DENY");
    }
    await next();
});
app.UseDefaultFiles();
app.UseStaticFiles();
app.UseCors("FrontendCors");
app.UseMiddleware<ExceptionMiddleware>();
app.UseAuthentication();
app.UseRateLimiter();
app.UseAuthorization();
app.MapControllers().RequireRateLimiting("api");
app.MapHealthChecks("/health/ready").AllowAnonymous();
app.MapGet("/health/live", () => Results.Ok(new { status = "healthy" })).AllowAnonymous();
app.MapFallbackToFile("/angular/{*path:nonfile}", "angular/index.html");
app.MapFallback(async context =>
{
    if (context.Request.Path.StartsWithSegments("/api") || context.Request.Path.StartsWithSegments("/health"))
    {
        context.Response.StatusCode = StatusCodes.Status404NotFound;
        return;
    }

    context.Response.ContentType = "text/html";
    await context.Response.SendFileAsync(Path.Combine(app.Environment.WebRootPath!, "index.html"));
});
app.Run();

public partial class Program { }
