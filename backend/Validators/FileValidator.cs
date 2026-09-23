using WinCapture.Exceptions;

namespace WinCapture.Validators;

public sealed class FileValidator
{
    private static readonly Dictionary<string, string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        [".jpg"] = "image/jpeg",
        [".jpeg"] = "image/jpeg",
        [".png"] = "image/png",
        [".gif"] = "image/gif",
        [".pdf"] = "application/pdf"
    };

    private const long MaximumFileSize = 10L * 1024L * 1024L;

    public Task ValidateAsync(IFormFile file)
    {
        ArgumentNullException.ThrowIfNull(file);

        if (file.Length == 0)
        {
            throw new BadRequestException("The uploaded file cannot be empty.");
        }
        if (file.Length > MaximumFileSize)
        {
            throw new PayloadTooLargeException("The uploaded file exceeds the maximum allowed size.");
        }
        var extension = Path.GetExtension(file.FileName);

        if (!AllowedContentTypes.TryGetValue(extension, out var expectedContentType))
        {
            throw new BadRequestException("The uploaded file must have a supported extension.");
        }

        if (!string.Equals(file.ContentType, expectedContentType, StringComparison.OrdinalIgnoreCase))
        {
            throw new BadRequestException("The uploaded file content type is invalid.");
        }
        return Task.CompletedTask;
    }
}
