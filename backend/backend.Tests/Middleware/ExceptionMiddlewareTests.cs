using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Moq;
using WinCapture.DTOs.Common;
using WinCapture.Exceptions;
using WinCapture.Middleware;
using Xunit;

namespace WinCapture.Tests.Middleware;

public sealed class ExceptionMiddlewareTests
{
    public static IEnumerable<object[]> StatusMappings =>
    [
        [new BadRequestException("bad input"), StatusCodes.Status400BadRequest, "bad input"],
        [new UnauthorizedException("invalid identity"), StatusCodes.Status401Unauthorized, "invalid identity"],
        [new ForbiddenException("denied"), StatusCodes.Status403Forbidden, "denied"],
        [new NotFoundException("missing"), StatusCodes.Status404NotFound, "missing"],
        [new ConflictException("conflict"), StatusCodes.Status409Conflict, "conflict"],
        [new PayloadTooLargeException("too large"), StatusCodes.Status413PayloadTooLarge, "too large"],
        [new StorageException("storage detail", new IOException()), StatusCodes.Status500InternalServerError, "An unexpected error occurred."],
        [new InvalidOperationException("internal detail"), StatusCodes.Status500InternalServerError, "An unexpected error occurred."]
    ];

    [Theory]
    [MemberData(nameof(StatusMappings))]
    public async Task InvokeAsync_MapsExceptionsToSafeApiErrors(
        Exception exception,
        int expectedStatus,
        string expectedMessage)
    {
        var context = new DefaultHttpContext();
        await using var body = new MemoryStream();
        context.Response.Body = body;
        var middleware = new ExceptionMiddleware(
            _ => Task.FromException(exception),
            Mock.Of<ILogger<ExceptionMiddleware>>());

        await middleware.InvokeAsync(context);

        Assert.Equal(expectedStatus, context.Response.StatusCode);
        Assert.Equal("application/json", context.Response.ContentType);
        body.Position = 0;
        using var document = await JsonDocument.ParseAsync(body);
        Assert.Equal(expectedStatus, document.RootElement.GetProperty("status").GetInt32());
        Assert.Equal(expectedMessage, document.RootElement.GetProperty("message").GetString());
    }
}
