using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using Moq;
using WinCapture.Exceptions;
using WinCapture.Models;
using WinCapture.Repositories;
using WinCapture.Services;
using Xunit;

namespace WinCapture.Tests;

public sealed class MicrosoftIdentityTests
{
    private readonly Mock<IUserRepository> _users = new();
    private readonly MicrosoftUserService _userService;

    public MicrosoftIdentityTests()
    {
        _userService = new MicrosoftUserService(_users.Object);
    }

    [Fact]
    public async Task GetOrCreateAsync_CreatesUserWithNormalizedIdentity()
    {
        User? created = null;
        _users.Setup(repository => repository.GetByEntraObjectIdAsync("entra-1"))
            .ReturnsAsync((User?)null);
        _users.Setup(repository => repository.AddAsync(It.IsAny<User>()))
            .Callback<User>(user => created = user)
            .Returns(Task.CompletedTask);

        var result = await _userService.GetOrCreateAsync(
            " Person ",
            " PERSON@EXAMPLE.COM ",
            " entra-1 ",
            UserRole.Admin);

        Assert.Same(created, result);
        Assert.Equal("Person", result.Name);
        Assert.Equal("person@example.com", result.Email);
        Assert.Equal("entra-1", result.EntraObjectId);
        Assert.Equal(UserRole.Admin, result.Role);
    }

    [Theory]
    [InlineData("not-an-email", "entra-1")]
    [InlineData("person@example.com", " ")]
    public async Task GetOrCreateAsync_RejectsInvalidIdentity(
        string email,
        string objectId)
    {
        await Assert.ThrowsAsync<UnauthorizedException>(() => _userService.GetOrCreateAsync(
            "Person",
            email,
            objectId,
            UserRole.User));

        _users.Verify(repository => repository.AddAsync(It.IsAny<User>()), Times.Never);
    }

    [Fact]
    public async Task GetOrCreateAsync_UsesOidAndDoesNotLookUpEmailMatches()
    {
        var existing = new User
        {
            Id = 5,
            Name = "Old name",
            Email = "person@example.com",
            EntraObjectId = string.Empty,
            Role = UserRole.User
        };
        _users.Setup(repository => repository.GetByEntraObjectIdAsync("entra-1"))
            .ReturnsAsync((User?)null);
        User? created = null;
        _users.Setup(repository => repository.AddAsync(It.IsAny<User>()))
            .Callback<User>(user => { created = user; user.Id = 9; })
            .Returns(Task.CompletedTask);

        var result = await _userService.GetOrCreateAsync(
            "Person", "PERSON@example.com", "entra-1", UserRole.User);

        Assert.Same(created, result);
        Assert.NotSame(existing, result);
        Assert.Equal("entra-1", result.EntraObjectId);
        _users.Verify(repository => repository.GetByEmailAsync(It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task GetOrCreateAsync_DoesNotRebindByEmailWhenOidIsDifferent()
    {
        _users.Setup(repository => repository.GetByEntraObjectIdAsync("entra-new"))
            .ReturnsAsync((User?)null);
        _users.Setup(repository => repository.GetByEmailAsync("person@example.com"))
            .ReturnsAsync(new User
            {
                Id = 5,
                Name = "Person",
                Email = "person@example.com",
                EntraObjectId = "entra-old",
                Role = UserRole.User
            });
        _users.Setup(repository => repository.AddAsync(It.IsAny<User>()))
            .ThrowsAsync(new Microsoft.EntityFrameworkCore.DbUpdateException("Unique email conflict."));

        await Assert.ThrowsAsync<DbUpdateException>(() => _userService.GetOrCreateAsync(
            "Person", "person@example.com", "entra-new", UserRole.User));

        _users.Verify(repository => repository.UpdateAsync(It.IsAny<User>()), Times.Never);
        _users.Verify(repository => repository.GetByEmailAsync(It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task GetOrCreateAsync_ConcurrentFirstSignInsReturnTheSameOidRecord()
    {
        var repository = new ConcurrentUserRepository();
        var service = new MicrosoftUserService(repository);

        var results = await Task.WhenAll(
            service.GetOrCreateAsync("Person", "person@example.com", "entra-race", UserRole.User),
            service.GetOrCreateAsync("Person", "person@example.com", "entra-race", UserRole.User));

        Assert.Same(results[0], results[1]);
        Assert.Equal("entra-race", results[0].EntraObjectId);
        Assert.Equal(1, repository.CreateCount);
        Assert.Equal(0, repository.EmailLookupCount);
    }

    [Fact]
    public async Task GetOrCreateAsync_DoesNotUpdateUnchangedAccount()
    {
        var existing = new User
        {
            Id = 5,
            Name = "Person",
            Email = "person@example.com",
            EntraObjectId = "entra-1",
            Role = UserRole.User
        };
        _users.Setup(repository => repository.GetByEntraObjectIdAsync("entra-1"))
            .ReturnsAsync(existing);

        await _userService.GetOrCreateAsync(
            "Person",
            "person@example.com",
            "entra-1",
            UserRole.User);

        _users.Verify(repository => repository.UpdateAsync(It.IsAny<User>()), Times.Never);
        _users.Verify(repository => repository.GetByEmailAsync(It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task GetOrCreateAsync_UsesEmailPrefixForBlankNameAndTruncatesLongNames()
    {
        User? created = null;
        _users.Setup(repository => repository.GetByEntraObjectIdAsync("entra-2"))
            .ReturnsAsync((User?)null);
        _users.Setup(repository => repository.AddAsync(It.IsAny<User>()))
            .Callback<User>(user => created = user)
            .Returns(Task.CompletedTask);

        var fallback = await _userService.GetOrCreateAsync(
            "   ",
            "PERSON@example.com",
            "entra-2",
            UserRole.User);

        Assert.Equal("person", fallback.Name);
        Assert.Equal("person@example.com", fallback.Email);

        var longName = new string('n', 201);
        _users.Setup(repository => repository.GetByEntraObjectIdAsync("entra-3"))
            .ReturnsAsync((User?)null);
        _users.Setup(repository => repository.AddAsync(It.IsAny<User>()))
            .Callback<User>(user => created = user)
            .Returns(Task.CompletedTask);

        var truncated = await _userService.GetOrCreateAsync(
            longName,
            "person@example.com",
            "entra-3",
            UserRole.User);

        Assert.Same(created, truncated);
        Assert.Equal(200, truncated.Name.Length);
    }

    [Fact]
    public async Task ClaimsTransformation_ProvisionsUserAndAddsRoleIdentityClaims()
    {
        _users.Setup(repository => repository.GetByEntraObjectIdAsync("entra-1"))
            .ReturnsAsync((User?)null);
        _users.Setup(repository => repository.AddAsync(It.IsAny<User>()))
            .Callback<User>(user => user.Id = 24)
            .Returns(Task.CompletedTask);
        var transformation = new MicrosoftIdentityClaimsTransformation(_userService);
        var identity = new ClaimsIdentity(
        [
            new Claim("oid", "entra-1"),
            new Claim("preferred_username", "person@example.com"),
            new Claim("name", "Person"),
            new Claim("roles", "WinCapture.Admin")
        ],
        "Bearer");
        var principal = new ClaimsPrincipal(identity);

        var transformed = await transformation.TransformAsync(principal);

        Assert.Equal("24", transformed.FindFirst("wincapture_user_id")?.Value);
        Assert.Equal("Microsoft Entra ID", transformed.FindFirst("authentication_type")?.Value);
        Assert.Contains(transformed.FindAll("roles"), claim => claim.Value == "WinCapture.Admin");
        _users.Verify(repository => repository.AddAsync(It.Is<User>(user => user.Role == UserRole.Admin)), Times.Once);
    }

    [Fact]
    public async Task ClaimsTransformation_DoesNotProvisionWhenAppRoleIsMissing()
    {
        var transformation = new MicrosoftIdentityClaimsTransformation(_userService);
        var identity = new ClaimsIdentity(
        [
            new Claim("oid", "entra-1"),
            new Claim("preferred_username", "person@example.com")
        ],
        "Bearer");

        var transformed = await transformation.TransformAsync(new ClaimsPrincipal(identity));

        Assert.Null(transformed.FindFirst("wincapture_user_id"));
        _users.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task ClaimsTransformation_IsIdempotentForAlreadyMappedPrincipal()
    {
        var transformation = new MicrosoftIdentityClaimsTransformation(_userService);
        var identity = new ClaimsIdentity(
        [
            new Claim("wincapture_user_id", "12"),
            new Claim("oid", "entra-1"),
            new Claim("preferred_username", "person@example.com"),
            new Claim("roles", "WinCapture.User")
        ],
        "Bearer");
        var principal = new ClaimsPrincipal(identity);

        var result = await transformation.TransformAsync(principal);

        Assert.Same(principal, result);
        _users.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task ClaimsTransformation_MapsUserAppRole()
    {
        _users.Setup(repository => repository.GetByEntraObjectIdAsync("entra-1"))
            .ReturnsAsync((User?)null);
        _users.Setup(repository => repository.AddAsync(It.IsAny<User>()))
            .Callback<User>(user => user.Id = 24)
            .Returns(Task.CompletedTask);
        var transformation = new MicrosoftIdentityClaimsTransformation(_userService);
        var identity = new ClaimsIdentity(
        [
            new Claim("oid", "entra-1"),
            new Claim("email", "PERSON@example.com"),
            new Claim("roles", "WinCapture.User")
        ],
        "Bearer");

        var transformed = await transformation.TransformAsync(new ClaimsPrincipal(identity));

        Assert.Equal("24", transformed.FindFirst("wincapture_user_id")?.Value);
        Assert.Equal("Microsoft Entra ID", transformed.FindFirst("authentication_type")?.Value);
        _users.Verify(repository => repository.AddAsync(It.Is<User>(user => user.Role == UserRole.User)), Times.Once);
        _users.Verify(repository => repository.GetByEmailAsync(It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task ClaimsTransformation_DoesNotProvisionWhenBothWinCaptureRolesArePresent()
    {
        var transformation = new MicrosoftIdentityClaimsTransformation(_userService);
        var identity = new ClaimsIdentity(
        [
            new Claim("oid", "entra-1"),
            new Claim("preferred_username", "person@example.com"),
            new Claim("roles", "WinCapture.User"),
            new Claim("roles", "WinCapture.Admin")
        ], "Bearer");

        var transformed = await transformation.TransformAsync(new ClaimsPrincipal(identity));

        Assert.Null(transformed.FindFirst("wincapture_user_id"));
        _users.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task ClaimsTransformation_ReturnsUnauthenticatedPrincipalUnchanged()
    {
        var transformation = new MicrosoftIdentityClaimsTransformation(_userService);
        var principal = new ClaimsPrincipal(new ClaimsIdentity(
        [
            new Claim("oid", "entra-1"),
            new Claim("preferred_username", "person@example.com")
        ]));

        var transformed = await transformation.TransformAsync(principal);

        Assert.Same(principal, transformed);
        _users.VerifyNoOtherCalls();
    }

    private sealed class ConcurrentUserRepository : IUserRepository
    {
        private readonly TaskCompletionSource _initialLookups = new(
            TaskCreationOptions.RunContinuationsAsynchronously);
        private User? _created;
        private int _lookupCount;
        private int _addAttempts;
        private int _createCount;
        private int _emailLookupCount;

        public int CreateCount => _createCount;
        public int EmailLookupCount => _emailLookupCount;

        public async Task<User?> GetByEntraObjectIdAsync(string entraObjectId)
        {
            var lookup = Interlocked.Increment(ref _lookupCount);
            if (lookup <= 2)
            {
                if (lookup == 2) _initialLookups.TrySetResult();
                await _initialLookups.Task;
                return null;
            }

            return Volatile.Read(ref _created);
        }

        public Task<User?> GetByEmailAsync(string email)
        {
            Interlocked.Increment(ref _emailLookupCount);
            return Task.FromResult<User?>(null);
        }

        public Task AddAsync(User user)
        {
            if (Interlocked.Increment(ref _addAttempts) == 1)
            {
                user.Id = 42;
                Volatile.Write(ref _created, user);
                Interlocked.Increment(ref _createCount);
                return Task.CompletedTask;
            }

            throw new DbUpdateException("Simulated concurrent unique-key conflict.");
        }

        public Task UpdateAsync(User user) => Task.CompletedTask;
    }
}
