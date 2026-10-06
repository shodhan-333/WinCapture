using Azure.Identity;
using Azure.Storage.Blobs;

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;

using Microsoft.EntityFrameworkCore;

using Microsoft.Identity.Web;

using Microsoft.OpenApi;

using System.Security.Claims;

using WinCapture.Data;
using WinCapture.Middleware;
using WinCapture.Models;
using WinCapture.Repositories;
using WinCapture.Services;
using WinCapture.Validators;

var builder = WebApplication.CreateBuilder(args);

var configuration =
    builder.Configuration;

// ============================================================
// Microsoft Entra configuration
//
// Values are loaded from appsettings.Development.json
// ============================================================

var azureAdSection =
    configuration.GetSection("AzureAd");

var tenantId =
    azureAdSection["TenantId"];

var clientId =
    azureAdSection["ClientId"];

var requiredScope =
    azureAdSection["Scopes"];

var userGroupId =
    azureAdSection["Groups:User"];

var adminGroupId =
    azureAdSection["Groups:Admin"];

var companyDomain =
    configuration["WinCapture:CompanyDomain"];

// ============================================================
// Configuration validation
// ============================================================

if (string.IsNullOrWhiteSpace(tenantId))
{
    throw new InvalidOperationException(
        "AzureAd:TenantId is missing.");
}

if (string.IsNullOrWhiteSpace(clientId))
{
    throw new InvalidOperationException(
        "AzureAd:ClientId is missing.");
}

if (string.IsNullOrWhiteSpace(requiredScope))
{
    throw new InvalidOperationException(
        "AzureAd:Scopes is missing.");
}

if (string.IsNullOrWhiteSpace(userGroupId))
{
    throw new InvalidOperationException(
        "AzureAd:Groups:User is missing.");
}

if (string.IsNullOrWhiteSpace(adminGroupId))
{
    throw new InvalidOperationException(
        "AzureAd:Groups:Admin is missing.");
}

if (string.IsNullOrWhiteSpace(companyDomain))
{
    throw new InvalidOperationException(
        "WinCapture:CompanyDomain is missing.");
}

// ============================================================
// Database
// ============================================================

builder.Services.AddDbContext<WinCaptureDbContext>(
    options =>
        options.UseSqlServer(
            configuration.GetConnectionString(
                "WinCaptureDatabase")
            ?? throw new InvalidOperationException(
                "WinCaptureDatabase connection string is missing.")));

// ============================================================
// Microsoft Entra ID Authentication
// ============================================================

builder.Services
    .AddAuthentication(
        JwtBearerDefaults.AuthenticationScheme)
    .AddMicrosoftIdentityWebApi(
        azureAdSection,
        subscribeToJwtBearerMiddlewareDiagnosticsEvents: true);

// ============================================================
// Microsoft Entra token processing
//
// Microsoft.Identity.Web performs the core token validation:
// issuer, audience, signature, lifetime, etc.
//
// WinCapture then adds its own user/role mapping.
// ============================================================

builder.Services
    .PostConfigure<JwtBearerOptions>(
        JwtBearerDefaults.AuthenticationScheme,
        options =>
        {
            options.MapInboundClaims = false;

            options.TokenValidationParameters.NameClaimType =
                "name";

            options.TokenValidationParameters.RoleClaimType =
                ClaimTypes.Role;

            options.Events ??=
                new JwtBearerEvents();

            var previousAuthenticationFailed =
                options.Events.OnAuthenticationFailed;

            options.Events.OnAuthenticationFailed =
                async context =>
                {
                    var logger =
                        context.HttpContext
                            .RequestServices
                            .GetRequiredService<
                                ILogger<Program>>();

                    logger.LogError(
                        context.Exception,
                        "Microsoft Entra token validation failed.");

                    if (previousAuthenticationFailed is not null)
                    {
                        await previousAuthenticationFailed(
                            context);
                    }
                };

            var previousTokenValidated =
                options.Events.OnTokenValidated;

            options.Events.OnTokenValidated =
                async context =>
                {
                    var logger =
                        context.HttpContext
                            .RequestServices
                            .GetRequiredService<
                                ILogger<Program>>();

                    var principal =
                        context.Principal;

                    if (principal is null)
                    {
                        context.Fail(
                            "Microsoft Entra identity is missing.");

                        return;
                    }

                    // ==================================================
                    // Diagnostic claims
                    // ==================================================

                    logger.LogInformation(
                        "Microsoft Entra token validated for {Name}.",
                        principal.FindFirst(
                            "name")?.Value
                        ?? principal.FindFirst(
                            "preferred_username")?.Value
                        ?? "Unknown user");

                    foreach (var claim in principal.Claims)
                    {
                        if (claim.Type is
                            "tid" or
                            "oid" or
                            "preferred_username" or
                            "scp" or
                            "groups" or
                            "roles")
                        {
                            logger.LogInformation(
                                "Entra claim: {Type} = {Value}",
                                claim.Type,
                                claim.Value);
                        }
                    }

                    // ==================================================
                    // Tenant validation
                    // ==================================================

                    var tokenTenantId =
                        principal.FindFirst(
                            "tid")?.Value;

                    if (!string.Equals(
                            tokenTenantId,
                            tenantId,
                            StringComparison.OrdinalIgnoreCase))
                    {
                        context.Fail(
                            "The Microsoft access token belongs to an unexpected tenant.");

                        return;
                    }

                    // ==================================================
                    // Scope validation
                    // ==================================================

                    var tokenScopes =
                        principal
                            .FindFirst("scp")
                            ?.Value
                            .Split(
                                ' ',
                                StringSplitOptions.RemoveEmptyEntries)
                        ?? [];

                    if (!tokenScopes.Contains(
                            requiredScope,
                            StringComparer.Ordinal))
                    {
                        context.Fail(
                            $"The Microsoft access token is missing the required scope '{requiredScope}'.");

                        return;
                    }

                    // ==================================================
                    // Email / UPN
                    // ==================================================

                    var email =
                        principal.FindFirst(
                            "preferred_username")?.Value
                        ?? principal.FindFirst(
                            "email")?.Value
                        ?? principal.FindFirst(
                            "upn")?.Value;

                    if (string.IsNullOrWhiteSpace(email))
                    {
                        context.Fail(
                            "The Microsoft access token does not contain a usable email address.");

                        return;
                    }

                    email =
                        email.Trim()
                            .ToLowerInvariant();

                    // ==================================================
                    // WinWire domain
                    // ==================================================

                    var expectedDomain =
                        companyDomain.Trim();

                    if (!expectedDomain.StartsWith(
                            "@",
                            StringComparison.Ordinal))
                    {
                        expectedDomain =
                            "@" + expectedDomain;
                    }

                    if (!email.EndsWith(
                            expectedDomain,
                            StringComparison.OrdinalIgnoreCase))
                    {
                        context.Fail(
                            "Only WinWire accounts are allowed to access WinCapture.");

                        return;
                    }

                    // ==================================================
                    // Get Microsoft Entra groups
                    // ==================================================

                    var groupIds =
                        principal
                            .FindAll("groups")
                            .Select(
                                claim => claim.Value)
                            .ToHashSet(
                                StringComparer.OrdinalIgnoreCase);

                    logger.LogInformation(
                        "Microsoft account {Email} contains {Count} group claims.",
                        email,
                        groupIds.Count);

                    foreach (var groupId in groupIds)
                    {
                        logger.LogInformation(
                            "GROUP CLAIM: {GroupId}",
                            groupId);
                    }

                    // ==================================================
                    // Get Microsoft Entra app roles
                    // ==================================================

                    var entraRoles =
                        principal
                            .FindAll("roles")
                            .Select(
                                claim => claim.Value)
                            .ToHashSet(
                                StringComparer.OrdinalIgnoreCase);

                    foreach (var role in entraRoles)
                    {
                        logger.LogInformation(
                            "ROLE CLAIM: {Role}",
                            role);
                    }

                    // ==================================================
                    // Map Entra -> WinCapture role
                    // ==================================================

                    UserRole? winCaptureRole =
                        null;

                    // Group mapping

                    if (groupIds.Contains(
                            adminGroupId))
                    {
                        winCaptureRole =
                            UserRole.Admin;

                        logger.LogInformation(
                            "Mapped Entra Admin group to WinCapture Admin.");
                    }
                    else if (
                        groupIds.Contains(
                            userGroupId))
                    {
                        winCaptureRole =
                            UserRole.User;

                        logger.LogInformation(
                            "Mapped Entra User group to WinCapture User.");
                    }

                    // App-role fallback

                    if (winCaptureRole is null)
                    {
                        if (entraRoles.Contains(
                                "WinCapture.Admin") ||
                            entraRoles.Contains(
                                "Admin"))
                        {
                            winCaptureRole =
                                UserRole.Admin;

                            logger.LogInformation(
                                "Mapped Entra Admin app role to WinCapture Admin.");
                        }
                        else if (
                            entraRoles.Contains(
                                "WinCapture.User") ||
                            entraRoles.Contains(
                                "User"))
                        {
                            winCaptureRole =
                                UserRole.User;

                            logger.LogInformation(
                                "Mapped Entra User app role to WinCapture User.");
                        }
                    }

                    // ==================================================
                    // Identity
                    // ==================================================

                    var identity =
                        principal.Identities
                            .FirstOrDefault(
                                item =>
                                    item.IsAuthenticated);

                    if (identity is null)
                    {
                        context.Fail(
                            "Authenticated Microsoft identity is missing.");

                        return;
                    }

                    // ==================================================
                    // No WinCapture role
                    //
                    // Authentication itself has succeeded.
                    // Don't turn this into an authentication failure.
                    // Controller-level role authorization can return 403.
                    // ==================================================

                    if (winCaptureRole is null)
                    {
                        logger.LogWarning(
                            "Microsoft account {Email} has no WinCapture User/Admin group or app role.",
                            email);

                        if (previousTokenValidated is not null)
                        {
                            await previousTokenValidated(
                                context);
                        }

                        return;
                    }

                    // ==================================================
                    // Display name
                    // ==================================================

                    var displayName =
                        principal.FindFirst(
                            "name")?.Value
                        ?? principal.FindFirst(
                            "given_name")?.Value
                        ?? email.Split('@')[0];

                    // ==================================================
                    // Microsoft user -> WinCapture user
                    // ==================================================

                    var microsoftUserService =
                        context.HttpContext
                            .RequestServices
                            .GetRequiredService<
                                MicrosoftUserService>();

                    var user =
                        await microsoftUserService
                            .GetOrCreateAsync(
                                displayName,
                                email,
                                winCaptureRole.Value);

                    // ==================================================
                    // Remove previous WinCapture claims
                    // ==================================================

                    foreach (
                        var existingClaim
                        in identity.Claims
                            .Where(
                                claim =>
                                    claim.Type == "name" ||
                                    claim.Type == "email" ||
                                    claim.Type == "role" ||
                                    claim.Type == ClaimTypes.Role ||
                                    claim.Type == "wincapture_user_id" ||
                                    claim.Type == "authentication_type")
                            .ToList())
                    {
                        identity.RemoveClaim(
                            existingClaim);
                    }

                    // ==================================================
                    // Add WinCapture claims
                    // ==================================================

                    identity.AddClaim(
                        new Claim(
                            "name",
                            user.Name));

                    identity.AddClaim(
                        new Claim(
                            "email",
                            user.Email));

                    identity.AddClaim(
                        new Claim(
                            "role",
                            user.Role.ToString()));

                    identity.AddClaim(
                        new Claim(
                            ClaimTypes.Role,
                            user.Role.ToString()));

                    identity.AddClaim(
                        new Claim(
                            "wincapture_user_id",
                            user.Id.ToString()));

                    identity.AddClaim(
                        new Claim(
                            "authentication_type",
                            "Microsoft Entra ID"));

                    logger.LogInformation(
                        "WinCapture mapping successful. Email={Email}, UserId={UserId}, Role={Role}",
                        user.Email,
                        user.Id,
                        user.Role);

                    if (previousTokenValidated is not null)
                    {
                        await previousTokenValidated(
                            context);
                    }
                };
        });

// ============================================================
// Authorization
//
// Authentication + required API scope.
// Do not require User/Admin globally.
// Existing controller [Authorize(Roles = "...")]
// attributes continue to control application roles.
// ============================================================

builder.Services.AddAuthorization(
    options =>
    {
        var winCapturePolicy =
            new AuthorizationPolicyBuilder(
                JwtBearerDefaults.AuthenticationScheme)
                .RequireAuthenticatedUser()
                .RequireAssertion(
                    context =>
                    {
                        var scope =
                            context.User
                                .FindFirst("scp")
                                ?.Value;

                        if (string.IsNullOrWhiteSpace(
                                scope))
                        {
                            return false;
                        }

                        var scopes =
                            scope.Split(
                                ' ',
                                StringSplitOptions.RemoveEmptyEntries);

                        return scopes.Contains(
                            requiredScope,
                            StringComparer.Ordinal);
                    })
                .Build();

        options.DefaultPolicy =
            winCapturePolicy;

        options.FallbackPolicy =
            winCapturePolicy;
    });

// ============================================================
// CORS
// ============================================================

builder.Services.AddCors(
    options =>
    {
        options.AddPolicy(
            "WinCaptureClient",
            policy =>
            {
                policy
                    .WithOrigins(
                        "https://localhost:5173")
                    .AllowAnyHeader()
                    .AllowAnyMethod();
            });
    });

// ============================================================
// Controllers
// ============================================================

builder.Services.AddControllers();

builder.Services.AddHttpContextAccessor();

// ============================================================
// Repositories
// ============================================================

builder.Services.AddScoped<
    IUserRepository,
    UserRepository>();

builder.Services.AddScoped<
    IFileRepository,
    FileRepository>();

builder.Services.AddScoped<
    IAlbumRepository,
    AlbumRepository>();

// ============================================================
// Services
// ============================================================

builder.Services.AddScoped<
    MicrosoftUserService>();

builder.Services.AddScoped<
    FileValidator>();

builder.Services.AddScoped<
    IFileService,
    FileService>();

builder.Services.AddScoped<
    IAlbumService,
    AlbumService>();

builder.Services.AddScoped<
    IAlbumFileService,
    AlbumFileService>();

// ============================================================
// Azure Blob Storage
// ============================================================

var storageAccountName =
    configuration[
        "Storage:AccountName"];

var storageContainerName =
    configuration[
        "Storage:ContainerName"];

if (string.IsNullOrWhiteSpace(
        storageAccountName))
{
    throw new InvalidOperationException(
        "Storage:AccountName is missing.");
}

if (string.IsNullOrWhiteSpace(
        storageContainerName))
{
    throw new InvalidOperationException(
        "Storage:ContainerName is missing.");
}

var blobServiceClient =
    new BlobServiceClient(
        new Uri(
            $"https://{storageAccountName}.blob.core.windows.net"),
        new DefaultAzureCredential());

builder.Services.AddSingleton(
    blobServiceClient.GetBlobContainerClient(
        storageContainerName));

builder.Services.AddSingleton<
    IStorageService,
    AzureBlobStorageService>();

// ============================================================
// OpenAPI
//
// Swagger uses OAuth2 Authorization Code + PKCE.
// This allows Swagger to authenticate through Microsoft Entra ID.
// ============================================================

builder.Services.AddOpenApi(
    options =>
    {
        options.AddDocumentTransformer(
            (document, _, _) =>
            {
                document.Components ??=
                    new OpenApiComponents();

                document.Components
                    .SecuritySchemes ??=
                    new Dictionary<
                        string,
                        IOpenApiSecurityScheme>();

                document.Components
                    .SecuritySchemes["oauth2"] =
                    new OpenApiSecurityScheme
                    {
                        Type =
                            SecuritySchemeType.OAuth2,

                        Description =
                            "Microsoft Entra ID authorization for WinCapture API.",

                        Flows =
                            new OpenApiOAuthFlows
                            {
                                AuthorizationCode =
                                    new OpenApiOAuthFlow
                                    {
                                        AuthorizationUrl =
                                            new Uri(
                                                $"https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/authorize"),

                                        TokenUrl =
                                            new Uri(
                                                $"https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/token"),

                                        Scopes =
                                            new Dictionary<
                                                string,
                                                string>
                                            {
                                                {
                                                    $"api://{clientId}/access_as_user",
                                                    "Access WinCapture API"
                                                }
                                            }
                                    }
                            }
                    };

                return Task.CompletedTask;
            });

        options.AddOperationTransformer(
            (operation, context, _) =>
            {
                var metadata =
                    context.Description
                        .ActionDescriptor
                        .EndpointMetadata;

                var allowsAnonymous =
                    metadata
                        .OfType<AllowAnonymousAttribute>()
                        .Any();

                if (!allowsAnonymous)
                {
                    operation.Security ??=
                        [];

                    operation.Security.Add(
                        new OpenApiSecurityRequirement
                        {
                            [
                                new OpenApiSecuritySchemeReference(
                                    "oauth2",
                                    context.Document)
                            ] =
                            [
                                $"api://{clientId}/access_as_user"
                            ]
                        });
                }

                return Task.CompletedTask;
            });
    });

builder.Services.AddScoped<TokenService>();
builder.Services.AddScoped<FileValidator>();
builder.Services.AddScoped<IFileRepository, FileRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IFileService, FileService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddSingleton<IStorageService, AzureBlobStorageService>();
builder.Services.AddScoped<IAlbumRepository, AlbumRepository>();
builder.Services.AddScoped<IAlbumService, AlbumService>();
builder.Services.AddScoped<IAlbumFileService, AlbumFileService>();

var app =
    builder.Build();

// ============================================================
// Swagger
// ============================================================

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi()
        .AllowAnonymous();

    app.UseSwaggerUI(
        options =>
        {
            options.SwaggerEndpoint(
                "/openapi/v1.json",
                "WinCapture API v1");

            // Microsoft Entra client ID
            options.OAuthClientId(
                clientId);

            // Authorization Code + PKCE
            options.OAuthUsePkce();

            // API scope
            options.OAuthScopes(
                $"api://{clientId}/access_as_user");

            // Swagger OAuth callback
            options.OAuth2RedirectUrl(
                "https://localhost:7106/swagger/oauth2-redirect.html");

            options.OAuthAppName(
                "WinCapture Swagger");
        });
}

// ============================================================
// Middleware
// ============================================================

app.UseHttpsRedirection();

app.UseCors(
    "WinCaptureClient");

app.UseMiddleware<ExceptionMiddleware>();

app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();

app.Run();