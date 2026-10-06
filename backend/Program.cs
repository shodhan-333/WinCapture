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

builder.Services.AddDbContext<WinCaptureDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("WinCaptureDatabase")));

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddMicrosoftIdentityWebApi(builder.Configuration.GetSection("AzureAd"));

builder.Services.PostConfigure<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme, options =>
{
    options.MapInboundClaims = false;
    options.TokenValidationParameters.NameClaimType = "name";
    options.TokenValidationParameters.RoleClaimType = "roles";
});

builder.Services.AddAuthorization();

builder.Services.AddCors(options =>
{
    options.AddPolicy("DevelopmentCors", policy =>
    {
        policy.WithOrigins("https://localhost:5173").AllowAnyHeader().AllowAnyMethod();
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

        foreach (var operation in document.Paths.Values.SelectMany(path => path.Operations))
        {
            operation.Value.Security ??= new List<OpenApiSecurityRequirement>();

            operation.Value.Security.Add(new OpenApiSecurityRequirement
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
app.UseCors("DevelopmentCors");
app.UseMiddleware<ExceptionMiddleware>();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();
