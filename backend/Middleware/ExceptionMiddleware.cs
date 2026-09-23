using System.Text.Json;
using WinCapture.DTOs.Common;
using WinCapture.Exceptions;

namespace WinCapture.Middleware;

public sealed class ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception exception)
        {
            await HandleExceptionAsync(context, exception);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var statusCode = exception switch
        {
            BadRequestException => StatusCodes.Status400BadRequest,

            PayloadTooLargeException =>StatusCodes.Status413PayloadTooLarge,

            ForbiddenException =>StatusCodes.Status403Forbidden,

            NotFoundException =>StatusCodes.Status404NotFound,

            StorageException =>StatusCodes.Status500InternalServerError,

            _ =>StatusCodes.Status500InternalServerError
        };

        if (statusCode >= StatusCodes.Status500InternalServerError)
        {
            logger.LogError(exception, "Unhandled exception for {Method} {Path}. RequestId: {RequestId}", context.Request.Method, context.Request.Path, context.TraceIdentifier);
        }
        else
        {
            logger.LogWarning(exception, "Handled API error {StatusCode} for {Method} {Path}. RequestId: {RequestId}", statusCode, context.Request.Method, context.Request.Path, context.TraceIdentifier);
        }

        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/json";

        var message = statusCode switch
        {
            StatusCodes.Status500InternalServerError =>"An unexpected error occurred.",

            _ =>exception.Message
        };

        var response = new ErrorResponse(statusCode, message);

        await context.Response.WriteAsync(JsonSerializer.Serialize(response));
    }
}
