using System.Text;
using Azure.Identity;
using Azure.Storage.Blobs;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using WinCapture.Data;
using WinCapture.Middleware;
using WinCapture.Repositories;
using WinCapture.Services;
using WinCapture.Validators;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
var configuration = builder.Configuration;

builder.Services.AddDbContext<WinCaptureDbContext>(options =>
    options.UseSqlServer(
        configuration.GetConnectionString("WinCaptureDatabase")
        ?? throw new InvalidOperationException("WinCaptureDatabase connection string is missing.")));

var jwtIssuer = configuration["Jwt:Issuer"]
    ?? throw new InvalidOperationException("Jwt:Issuer is missing.");
var jwtAudience = configuration["Jwt:Audience"]
    ?? throw new InvalidOperationException("Jwt:Audience is missing.");
var jwtSecret = configuration["Jwt:SecretKey"]
    ?? throw new InvalidOperationException("Jwt:SecretKey is missing.");
var jwtExpirationMinutes = configuration.GetValue<int?>("Jwt:ExpirationMinutes")
    ?? throw new InvalidOperationException("Jwt:ExpirationMinutes is missing.");

if (jwtExpirationMinutes <= 0)
{
    throw new InvalidOperationException("Jwt:ExpirationMinutes must be greater than zero.");
}

if (Encoding.UTF8.GetByteCount(jwtSecret) < 32)
{
    throw new InvalidOperationException("Jwt:SecretKey must contain at least 256 bits.");
}

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.MapInboundClaims = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,
            ValidateAudience = true,
            ValidAudience = jwtAudience,
            ValidateLifetime = true,
            RequireExpirationTime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ValidAlgorithms = [SecurityAlgorithms.HmacSha256],
            ClockSkew = TimeSpan.FromMinutes(1),
            NameClaimType = "name",
            RoleClaimType = "role"
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddOpenApi(options =>
{
    options.AddDocumentTransformer((document, _, _) =>
    {
        document.Components ??= new OpenApiComponents();
        document.Components.SecuritySchemes ??= new Dictionary<string, IOpenApiSecurityScheme>();

        document.Components.SecuritySchemes["Bearer"] = new OpenApiSecurityScheme
        {
            Type = SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT",
            Description = "Enter the JWT bearer token."
        };

        return Task.CompletedTask;
    });

    options.AddOperationTransformer((operation, context, _) =>
    {
        var metadata = context.Description.ActionDescriptor.EndpointMetadata;
        var requiresAuthorization = metadata.OfType<AuthorizeAttribute>().Any();
        var allowsAnonymous = metadata.OfType<AllowAnonymousAttribute>().Any();

        if (requiresAuthorization && !allowsAnonymous)
        {
            operation.Security ??= [];
            operation.Security.Add(new OpenApiSecurityRequirement
            {
                [new OpenApiSecuritySchemeReference("Bearer", context.Document)] = []
            });
        }

        return Task.CompletedTask;
    });
});

var storageAccountName = configuration["Storage:AccountName"]
    ?? throw new InvalidOperationException("Storage:AccountName is missing.");
var storageContainerName = configuration["Storage:ContainerName"]
    ?? throw new InvalidOperationException("Storage:ContainerName is missing.");

var blobServiceClient = new BlobServiceClient(
    new Uri($"https://{storageAccountName}.blob.core.windows.net"),
    new DefaultAzureCredential());

builder.Services.AddSingleton(
    blobServiceClient.GetBlobContainerClient(storageContainerName));

builder.Services.AddScoped<TokenService>();
builder.Services.AddScoped<FileValidator>();
builder.Services.AddScoped<IFileRepository, FileRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IFileService, FileService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddSingleton<IStorageService, AzureBlobStorageService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/openapi/v1.json", "WinCapture API v1");
    });
}

app.UseHttpsRedirection();
app.UseMiddleware<ExceptionMiddleware>();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
