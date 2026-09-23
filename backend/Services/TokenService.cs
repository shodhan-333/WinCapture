using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using WinCapture.Models;

namespace WinCapture.Services;

public sealed class TokenService(IConfiguration configuration)
{
    public string CreateToken(User user)
    {
        var issuer = configuration["Jwt:Issuer"]
            ?? throw new InvalidOperationException("Jwt:Issuer is missing.");

        var audience = configuration["Jwt:Audience"]
            ?? throw new InvalidOperationException("Jwt:Audience is missing.");

        var secretKey = configuration["Jwt:SecretKey"]
            ?? throw new InvalidOperationException("Jwt:SecretKey is missing.");

        var expirationMinutes = configuration.GetValue<int?>("Jwt:ExpirationMinutes")
            ?? throw new InvalidOperationException("Jwt:ExpirationMinutes is missing.");

        var claims = new[]
        {
            new Claim("sub", user.Id.ToString()),
            new Claim("name", user.Name),
            new Claim("email", user.Email),
            new Claim("role", user.Role.ToString())
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));

        var credentials = new SigningCredentials(key,SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expirationMinutes),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}