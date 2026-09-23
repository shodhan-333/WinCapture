using WinCapture.Exceptions;

namespace WinCapture.Validators;

public sealed class FileValidator
{
    public const long MaximumFileSize = 10L * 1024L * 1024L;

    private const int MaximumSignatureLength = 8;

    private static readonly Dictionary<string, string> AllowedContentTypes =
        new(StringComparer.OrdinalIgnoreCase)
        {
            [".jpg"] = "image/jpeg",
            [".jpeg"] = "image/jpeg",
            [".png"] = "image/png",
            [".gif"] = "image/gif",
            [".pdf"] = "application/pdf"
        };

    private static readonly Dictionary<string, byte[][]> FileSignatures =
        new(StringComparer.OrdinalIgnoreCase)
        {
            [".jpg"] =
            [
                [0xFF, 0xD8, 0xFF]
            ],
            [".jpeg"] =
            [
                [0xFF, 0xD8, 0xFF]
            ],
            [".png"] =
            [
                [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]
            ],
            [".gif"] =
            [
                [0x47, 0x49, 0x46, 0x38, 0x37, 0x61],
                [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]
            ],
            [".pdf"] =
            [
                [0x25, 0x50, 0x44, 0x46, 0x2D]
            ]
        };

    public async Task ValidateAsync(IFormFile file)
    {
        if (file is null)
        {
            throw new BadRequestException("A file is required.");
        }

        if (file.Length == 0)
        {
            throw new BadRequestException("The uploaded file cannot be empty.");
        }

        if (file.Length > MaximumFileSize)
        {
            throw new PayloadTooLargeException(
                "The uploaded file exceeds the maximum allowed size of 10 MB.");
        }

        var extension = Path.GetExtension(file.FileName);

        if (!AllowedContentTypes.TryGetValue(extension, out var expectedContentType))
        {
            throw new BadRequestException(
                "The uploaded file must be a supported JPG, PNG, GIF, or PDF file.");
        }

        if (!string.Equals(
                file.ContentType,
                expectedContentType,
                StringComparison.OrdinalIgnoreCase))
        {
            throw new BadRequestException("The uploaded file content type is invalid.");
        }

        if (!FileSignatures.TryGetValue(extension, out var signatures))
        {
            throw new BadRequestException("The uploaded file type is not supported.");
        }

        await using var stream = file.OpenReadStream();
        var buffer = new byte[MaximumSignatureLength];
        var bytesRead = await stream.ReadAsync(buffer.AsMemory(0, MaximumSignatureLength));

        if (!MatchesAnySignature(buffer, bytesRead, signatures))
        {
            throw new BadRequestException(
                "The uploaded file content does not match its file type.");
        }
    }

    private static bool MatchesAnySignature(
        byte[] buffer,
        int bytesRead,
        IEnumerable<byte[]> signatures)
    {
        foreach (var signature in signatures)
        {
            if (bytesRead < signature.Length)
            {
                continue;
            }

            var matches = true;

            for (var index = 0; index < signature.Length; index++)
            {
                if (buffer[index] != signature[index])
                {
                    matches = false;
                    break;
                }
            }

            if (matches)
            {
                return true;
            }
        }

        return false;
    }
}