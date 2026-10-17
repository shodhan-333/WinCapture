using Azure.Storage.Blobs;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Web;
using Microsoft.OpenApi;
using WinCapture.Data;
using WinCapture.Middleware;
using WinCapture.Repositories;
using WinCapture.Services;
using WinCapture.Validators;

var builder = WebApplication.CreateBuilder(args);

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

builder.Services.AddDbContext<WinCaptureDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("WinCaptureDatabase")));

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

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendCors", policy =>
    {
        policy.WithOrigins(corsOrigins.ToArray()).AllowAnyHeader().AllowAnyMethod();
    });
});

builder.Services.AddControllers();
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

var storageConnectionString =
    builder.Configuration["Storage:ConnectionString"]
    ?? throw new InvalidOperationException(
        "Azure Storage connection string is missing.");

var storageContainerName =
    builder.Configuration["Storage:ContainerName"]
    ?? throw new InvalidOperationException(
        "Storage container name is missing.");

var blobServiceClient =
    new BlobServiceClient(
        storageConnectionString);

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
app.UseCors("FrontendCors");
app.UseMiddleware<ExceptionMiddleware>();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();

public partial class Program { }
