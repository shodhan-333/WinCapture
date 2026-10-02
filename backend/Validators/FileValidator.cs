using Microsoft.AspNetCore.Http;
using WinCapture.Exceptions;

namespace WinCapture.Validators;

public sealed class FileValidator
{
    public const long MaximumFileSize =
        10L * 1024L * 1024L;

    private static readonly Dictionary<string, string>
        AllowedContentTypes =
            new(StringComparer.OrdinalIgnoreCase)
            {
                [".jpg"] = "image/jpeg",
                [".jpeg"] = "image/jpeg",
                [".png"] = "image/png",
                [".gif"] = "image/gif",
                [".pdf"] = "application/pdf"
            };

    public Task ValidateAsync(IFormFile file)
    {
        if (file is null)
        {
            throw new BadRequestException(
                "A file is required.");
        }

        if (file.Length == 0)
        {
            throw new BadRequestException(
                "The uploaded file cannot be empty.");
        }

        if (file.Length > MaximumFileSize)
        {
            throw new PayloadTooLargeException(
                "The uploaded file exceeds the maximum allowed size of 10 MB.");
        }

        var extension =
            Path.GetExtension(
                file.FileName);

        if (!AllowedContentTypes.TryGetValue(
                extension,
                out var expectedContentType))
        {
            throw new BadRequestException(
                "The uploaded file must be a supported JPG, PNG, GIF, or PDF file.");
        }

        if (!string.Equals(
                file.ContentType,
                expectedContentType,
                StringComparison.OrdinalIgnoreCase))
        {
            throw new BadRequestException(
                "The uploaded file content type is invalid.");
        }

        return Task.CompletedTask;
    }
}