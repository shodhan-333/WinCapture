using WinCapture.DTOs.Auth;
using WinCapture.Exceptions;
using WinCapture.Models;
using WinCapture.Repositories;

namespace WinCapture.Services;

public sealed class AuthService(IUserRepository userRepository, TokenService tokenService) : IAuthService
{
    public async Task<RegisterResponse> RegisterAsync(RegisterRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (string.IsNullOrWhiteSpace(request.Name))
        {
            throw new BadRequestException("Name is required.");
        }

        var name = request.Name.Trim();

        if (name.Length > 200)
        {
            throw new BadRequestException("Name cannot exceed 200 characters.");
        }

        if (string.IsNullOrWhiteSpace(request.Email))
        {
            throw new BadRequestException("Email is required.");
        }

        var email = request.Email.Trim().ToLowerInvariant();

        if (email.Length > 320)
        {
            throw new BadRequestException("Email cannot exceed 320 characters.");
        }

        if (!IsValidEmail(email))
        {
            throw new BadRequestException("A valid email address is required.");
        }

        if (string.IsNullOrWhiteSpace(request.Password))
        {
            throw new BadRequestException("Password is required.");
        }

        if (request.Password.Length < 8)
        {
            throw new BadRequestException("Password must be at least 8 characters.");
        }

        if (request.Password.Length > 128)
        {
            throw new BadRequestException("Password cannot exceed 128 characters.");
        }

        if (await userRepository.ExistsByEmailAsync(email))
        {
            throw new BadRequestException("A user with this email already exists.");
        }

        var user = new User
        {
            Name = name,
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = UserRole.User,
            CreatedAt = DateTime.UtcNow
        };

        await userRepository.AddAsync(user);

        return new RegisterResponse(user.Id, user.Name, user.Email, user.Role.ToString());
    }

    public async Task<LoginResponse?> LoginAsync(LoginRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return null;
        }

        var email = request.Email.Trim().ToLowerInvariant();
        var user = await userRepository.GetByEmailAsync(email);
        if (user is null)
        {
            return null;
        }

        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            return null;
        }

        return new LoginResponse(tokenService.CreateToken(user),user.Id,user.Name,user.Email,user.Role.ToString());
    }

    private static bool IsValidEmail(string email)
    {
        try
        {
            var address = new System.Net.Mail.MailAddress(email);
            return string.Equals(address.Address, email, StringComparison.OrdinalIgnoreCase);
        }
        catch (FormatException)
        {
            return false;
        }
    }
}
