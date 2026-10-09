using System.Buffers.Binary;
using System.IO.Compression;
using System.Text;
using System.Xml;
using System.Xml.Linq;
using Microsoft.AspNetCore.Http;
using WinCapture.Exceptions;

namespace WinCapture.Validators;

public sealed class FileValidator
{
    public const long MaximumFileSize = 10L * 1024L * 1024L;

    private const long MaximumExpandedArchiveSize = 64L * 1024L * 1024L;
    private const int MaximumArchiveEntries = 2048;

    private static readonly IReadOnlyDictionary<string, string> AllowedContentTypes =
        new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            [".jpg"] = "image/jpeg",
            [".jpeg"] = "image/jpeg",
            [".png"] = "image/png",
            [".webp"] = "image/webp",
            [".pdf"] = "application/pdf",
            [".txt"] = "text/plain",
            [".csv"] = "text/csv",
            [".docx"] = "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            [".xlsx"] = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            [".pptx"] = "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            [".mp4"] = "video/mp4",
            [".mov"] = "video/quicktime",
            [".webm"] = "video/webm",
            [".mp3"] = "audio/mpeg",
            [".wav"] = "audio/wav",
            [".m4a"] = "audio/mp4",
            [".zip"] = "application/zip"
        };

    private static readonly UTF8Encoding StrictUtf8 = new(false, true);
    private static readonly UTF8Encoding Utf8WithBom = new(true, true);
    private static readonly uint[] PngCrcTable = CreatePngCrcTable();

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
            throw new BadRequestException("The uploaded file type is not supported.");
        }

        if (!string.Equals(
                file.ContentType,
                expectedContentType,
                StringComparison.OrdinalIgnoreCase))
        {
            throw new BadRequestException("The uploaded file content type is invalid.");
        }

        var content = await ReadContentAsync(file);
        if (!HasValidContent(extension, content))
        {
            throw new BadRequestException(
                "The uploaded file content does not match its file type or is malformed.");
        }
    }

    private static async Task<byte[]> ReadContentAsync(IFormFile file)
    {
        await using var stream = file.OpenReadStream();
        using var buffer = new MemoryStream((int)file.Length);
        var chunk = new byte[81920];
        long totalRead = 0;

        while (true)
        {
            var count = await stream.ReadAsync(chunk.AsMemory());
            if (count == 0)
            {
                break;
            }

            totalRead += count;
            if (totalRead > MaximumFileSize)
            {
                throw new PayloadTooLargeException(
                    "The uploaded file exceeds the maximum allowed size of 10 MB.");
            }

            await buffer.WriteAsync(chunk.AsMemory(0, count));
        }

        if (totalRead != file.Length)
        {
            throw new BadRequestException(
                "The uploaded file is incomplete or malformed.");
        }

        if (stream.CanSeek)
        {
            stream.Position = 0;
        }

        return buffer.ToArray();
    }

    private static bool HasValidContent(string extension, byte[] content) => extension.ToLowerInvariant() switch
    {
        ".jpg" or ".jpeg" => IsValidJpeg(content),
        ".png" => IsValidPng(content),
        // GIF is recognized here for content detection, but intentionally remains outside the allowlist.
        ".gif" => IsValidGif(content),
        ".webp" => IsValidWebP(content),
        ".pdf" => IsValidPdf(content),
        ".txt" => IsValidText(content),
        ".csv" => IsValidCsv(content),
        ".docx" => IsValidOfficePackage(content, "word/document.xml", "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"),
        ".xlsx" => IsValidOfficePackage(content, "xl/workbook.xml", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"),
        ".pptx" => IsValidOfficePackage(content, "ppt/presentation.xml", "application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"),
        ".mp4" => IsValidIsoBmff(content, "mp4"),
        ".mov" => IsValidIsoBmff(content, "mov"),
        ".webm" => IsValidWebM(content),
        ".mp3" => IsValidMp3(content),
        ".wav" => IsValidWav(content),
        ".m4a" => IsValidIsoBmff(content, "m4a"),
        ".zip" => IsValidZip(content),
        _ => false
    };

    private static bool IsValidGif(ReadOnlySpan<byte> content)
    {
        if (content.Length < 14 ||
            !(content[..6].SequenceEqual("GIF87a"u8) || content[..6].SequenceEqual("GIF89a"u8)))
        {
            return false;
        }

        var offset = 13;
        var packed = content[10];
        if ((packed & 0x80) != 0)
        {
            offset += 3 * (1 << ((packed & 0x07) + 1));
            if (offset > content.Length) return false;
        }

        var hasImage = false;
        while (offset < content.Length)
        {
            var marker = content[offset++];
            if (marker == 0x3B)
            {
                return hasImage && offset == content.Length;
            }

            if (marker == 0x2C)
            {
                if (offset > content.Length - 9) return false;
                var descriptorFlags = content[offset + 8];
                offset += 9;
                if ((descriptorFlags & 0x80) != 0)
                {
                    offset += 3 * (1 << ((descriptorFlags & 0x07) + 1));
                    if (offset > content.Length) return false;
                }

                if (offset >= content.Length || content[offset++] is < 2 or > 12 ||
                    !SkipGifSubBlocks(content, ref offset))
                {
                    return false;
                }

                hasImage = true;
            }
            else if (marker == 0x21)
            {
                if (offset >= content.Length) return false;
                offset++; // Extension label.
                if (!SkipGifSubBlocks(content, ref offset)) return false;
            }
            else
            {
                return false;
            }
        }

        return false;
    }

    private static bool SkipGifSubBlocks(ReadOnlySpan<byte> content, ref int offset)
    {
        while (offset < content.Length)
        {
            var blockLength = content[offset++];
            if (blockLength == 0) return true;
            if (blockLength > content.Length - offset) return false;
            offset += blockLength;
        }

        return false;
    }

    private static bool IsValidJpeg(ReadOnlySpan<byte> content)
    {
        if (content.Length < 12 || content[0] != 0xFF || content[1] != 0xD8 ||
            content[2] != 0xFF || content[^2] != 0xFF || content[^1] != 0xD9)
        {
            return false;
        }

        var offset = 2;
        var hasFrame = false;
        var hasScan = false;

        while (offset < content.Length - 2)
        {
            if (content[offset++] != 0xFF)
            {
                return false;
            }

            while (offset < content.Length && content[offset] == 0xFF)
            {
                offset++;
            }

            if (offset >= content.Length)
            {
                return false;
            }

            var marker = content[offset++];
            if (marker == 0xD9)
            {
                return hasFrame && hasScan;
            }

            if (marker is 0x01 or >= 0xD0 and <= 0xD8)
            {
                continue;
            }

            if (offset + 2 > content.Length)
            {
                return false;
            }

            var segmentLength = BinaryPrimitives.ReadUInt16BigEndian(content[offset..]);
            if (segmentLength < 2 || segmentLength > content.Length - offset)
            {
                return false;
            }

            if (marker is >= 0xC0 and <= 0xCF && marker is not 0xC4 and not 0xC8 and not 0xCC)
            {
                hasFrame = true;
            }

            if (marker == 0xDA)
            {
                hasScan = true;
                var scanStart = offset + segmentLength;
                return hasFrame && scanStart < content.Length - 2;
            }

            offset += segmentLength;
        }

        return false;
    }

    private static bool IsValidPng(ReadOnlySpan<byte> content)
    {
        ReadOnlySpan<byte> signature = [137, 80, 78, 71, 13, 10, 26, 10];
        if (content.Length < 45 || !content.StartsWith(signature))
        {
            return false;
        }

        var offset = 8;
        var sawHeader = false;
        var sawImageData = false;
        var sawEnd = false;

        while (offset <= content.Length - 12)
        {
            var length = BinaryPrimitives.ReadUInt32BigEndian(content[offset..]);
            if (length > int.MaxValue || length > content.Length - offset - 12)
            {
                return false;
            }

            var dataLength = (int)length;
            var type = content.Slice(offset + 4, 4);
            var data = content.Slice(offset + 8, dataLength);
            var expectedCrc = BinaryPrimitives.ReadUInt32BigEndian(content.Slice(offset + 8 + dataLength, 4));
            if (ComputePngCrc(type, data) != expectedCrc)
            {
                return false;
            }

            if (!sawHeader)
            {
                if (!type.SequenceEqual("IHDR"u8) || dataLength != 13)
                {
                    return false;
                }

                var width = BinaryPrimitives.ReadUInt32BigEndian(data);
                var height = BinaryPrimitives.ReadUInt32BigEndian(data[4..]);
                var bitDepth = data[8];
                var colorType = data[9];
                if (width == 0 || height == 0 || data[10] != 0 || data[11] != 0 || data[12] > 1 ||
                    !IsValidPngBitDepth(colorType, bitDepth))
                {
                    return false;
                }

                sawHeader = true;
            }
            else if (type.SequenceEqual("IHDR"u8))
            {
                return false;
            }

            if (type.SequenceEqual("IDAT"u8))
            {
                sawImageData = true;
            }

            offset += 12 + dataLength;
            if (type.SequenceEqual("IEND"u8))
            {
                sawEnd = dataLength == 0 && offset == content.Length;
                break;
            }
        }

        return sawHeader && sawImageData && sawEnd;
    }

    private static bool IsValidPngBitDepth(byte colorType, byte bitDepth) => colorType switch
    {
        0 => bitDepth is 1 or 2 or 4 or 8 or 16,
        2 => bitDepth is 8 or 16,
        3 => bitDepth is 1 or 2 or 4 or 8,
        4 or 6 => bitDepth is 8 or 16,
        _ => false
    };

    private static uint ComputePngCrc(ReadOnlySpan<byte> type, ReadOnlySpan<byte> data)
    {
        var crc = 0xFFFFFFFFu;
        foreach (var value in type)
        {
            crc = PngCrcTable[(crc ^ value) & 0xFF] ^ (crc >> 8);
        }

        foreach (var value in data)
        {
            crc = PngCrcTable[(crc ^ value) & 0xFF] ^ (crc >> 8);
        }

        return ~crc;
    }

    private static uint[] CreatePngCrcTable()
    {
        var table = new uint[256];
        for (uint index = 0; index < table.Length; index++)
        {
            var value = index;
            for (var bit = 0; bit < 8; bit++)
            {
                value = (value & 1) == 1 ? 0xEDB88320u ^ (value >> 1) : value >> 1;
            }

            table[index] = value;
        }

        return table;
    }

    private static bool IsValidWebP(ReadOnlySpan<byte> content)
    {
        if (content.Length < 20 || !content[..4].SequenceEqual("RIFF"u8) ||
            !content.Slice(8, 4).SequenceEqual("WEBP"u8) ||
            BinaryPrimitives.ReadUInt32LittleEndian(content[4..]) != content.Length - 8)
        {
            return false;
        }

        var offset = 12;
        var hasImage = false;
        while (offset <= content.Length - 8)
        {
            var chunkLength = BinaryPrimitives.ReadUInt32LittleEndian(content[(offset + 4)..]);
            if (chunkLength > int.MaxValue || chunkLength > content.Length - offset - 8)
            {
                return false;
            }

            var chunkType = content.Slice(offset, 4);
            if (chunkType.SequenceEqual("VP8 "u8) || chunkType.SequenceEqual("VP8L"u8) ||
                chunkType.SequenceEqual("VP8X"u8))
            {
                hasImage = chunkLength > 0;
            }

            offset += 8 + (int)chunkLength + ((chunkLength & 1) == 1 ? 1 : 0);
            if (offset > content.Length)
            {
                return false;
            }
        }

        return offset == content.Length && hasImage;
    }

    private static bool IsValidPdf(ReadOnlySpan<byte> content)
    {
        if (content.Length < 16 || !content[..5].SequenceEqual("%PDF-"u8))
        {
            return false;
        }

        var searchStart = Math.Max(0, content.Length - 2048);
        var eofIndex = content[searchStart..].LastIndexOf("%%EOF"u8);
        if (eofIndex < 0)
        {
            return false;
        }

        var trailing = content[(searchStart + eofIndex + 5)..];
        foreach (var value in trailing)
        {
            if (value is not 0x00 and not 0x09 and not 0x0A and not 0x0C and not 0x0D and not 0x20)
            {
                return false;
            }
        }

        return true;
    }

    private static bool IsValidText(ReadOnlySpan<byte> content) => TryDecodeText(content, out var text) &&
        !string.IsNullOrWhiteSpace(text) && ContainsOnlyTextCharacters(text);

    private static bool IsValidCsv(ReadOnlySpan<byte> content)
    {
        if (!TryDecodeText(content, out var text) || string.IsNullOrWhiteSpace(text) ||
            !ContainsOnlyTextCharacters(text))
        {
            return false;
        }

        var insideQuotes = false;
        var afterQuote = false;
        var atFieldStart = true;

        for (var index = 0; index < text.Length; index++)
        {
            var character = text[index];
            if (insideQuotes)
            {
                if (character == '"')
                {
                    if (index + 1 < text.Length && text[index + 1] == '"')
                    {
                        index++;
                    }
                    else
                    {
                        insideQuotes = false;
                        afterQuote = true;
                    }
                }
                else if (character == '\r' && (index + 1 >= text.Length || text[index + 1] != '\n'))
                {
                    return false;
                }

                continue;
            }

            if (afterQuote)
            {
                if (character == ',')
                {
                    afterQuote = false;
                    atFieldStart = true;
                    continue;
                }

                if (character == '\n' || character == '\r' && index + 1 < text.Length && text[index + 1] == '\n')
                {
                    if (character == '\r') index++;
                    afterQuote = false;
                    atFieldStart = true;
                    continue;
                }

                return false;
            }

            if (character == '"')
            {
                if (!atFieldStart) return false;
                insideQuotes = true;
                atFieldStart = false;
            }
            else if (character == ',')
            {
                atFieldStart = true;
            }
            else if (character == '\n' || character == '\r' && index + 1 < text.Length && text[index + 1] == '\n')
            {
                if (character == '\r') index++;
                atFieldStart = true;
            }
            else
            {
                if (character == '\r') return false;
                atFieldStart = false;
            }
        }

        return !insideQuotes;
    }

    private static bool TryDecodeText(ReadOnlySpan<byte> content, out string text)
    {
        try
        {
            if (content.StartsWith(new byte[] { 0xEF, 0xBB, 0xBF }))
            {
                text = Utf8WithBom.GetString(content).TrimStart('\uFEFF');
            }
            else if (content.StartsWith(new byte[] { 0xFF, 0xFE }))
            {
                text = new UnicodeEncoding(false, true, true).GetString(content[2..]);
            }
            else if (content.StartsWith(new byte[] { 0xFE, 0xFF }))
            {
                text = new UnicodeEncoding(true, true, true).GetString(content[2..]);
            }
            else
            {
                text = StrictUtf8.GetString(content);
            }

            return true;
        }
        catch (DecoderFallbackException)
        {
            text = string.Empty;
            return false;
        }
    }

    private static bool ContainsOnlyTextCharacters(string text) => text.All(character =>
        !char.IsControl(character) || character is '\t' or '\r' or '\n');

    private static bool IsValidOfficePackage(
        byte[] content,
        string mainPart,
        string mainContentType)
    {
        try
        {
            using var stream = new MemoryStream(content, writable: false);
            using var archive = new ZipArchive(stream, ZipArchiveMode.Read, leaveOpen: true);
            if (archive.Entries.Count > MaximumArchiveEntries)
            {
                return false;
            }

            var parts = new HashSet<string>(StringComparer.Ordinal);
            long expandedLength = 0;
            foreach (var entry in archive.Entries)
            {
                if (entry.FullName.StartsWith('/') || entry.FullName.Contains("../", StringComparison.Ordinal) ||
                    entry.Length < 0 || entry.Length > MaximumExpandedArchiveSize - expandedLength)
                {
                    return false;
                }

                expandedLength += entry.Length;
                parts.Add(entry.FullName);
                using var entryStream = entry.Open();
                var actualLength = CopyWithLimit(entryStream, Stream.Null, entry.Length);
                if (actualLength != entry.Length)
                {
                    return false;
                }
            }

            if (!parts.Contains("[Content_Types].xml") || !parts.Contains("_rels/.rels") || !parts.Contains(mainPart))
            {
                return false;
            }

            var contentTypes = ReadXmlEntry(archive, "[Content_Types].xml");
            var relationships = ReadXmlEntry(archive, "_rels/.rels");
            _ = ReadXmlEntry(archive, mainPart);
            XNamespace contentTypeNamespace = "http://schemas.openxmlformats.org/package/2006/content-types";
            XNamespace relationshipNamespace = "http://schemas.openxmlformats.org/package/2006/relationships";

            var hasExpectedContentType = contentTypes
                .Root?
                .Elements(contentTypeNamespace + "Override")
                .Any(element =>
                    string.Equals((string?)element.Attribute("PartName"), $"/{mainPart}", StringComparison.Ordinal) &&
                    string.Equals((string?)element.Attribute("ContentType"), mainContentType, StringComparison.Ordinal)) == true;

            var hasOfficeDocumentRelationship = relationships
                .Root?
                .Elements(relationshipNamespace + "Relationship")
                .Any(element =>
                    string.Equals((string?)element.Attribute("Type"),
                        "http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument",
                        StringComparison.Ordinal) &&
                    NormalizePackagePart((string?)element.Attribute("Target")) == mainPart) == true;

            return hasExpectedContentType && hasOfficeDocumentRelationship;
        }
        catch (Exception exception) when (exception is InvalidDataException or IOException or XmlException or ArgumentException)
        {
            return false;
        }
    }

    private static XDocument ReadXmlEntry(ZipArchive archive, string name)
    {
        var entry = archive.GetEntry(name) ?? throw new InvalidDataException();
        if (entry.Length > 1024 * 1024)
        {
            throw new InvalidDataException();
        }

        using var stream = entry.Open();
        using var reader = XmlReader.Create(stream, new XmlReaderSettings
        {
            DtdProcessing = DtdProcessing.Prohibit,
            XmlResolver = null,
            MaxCharactersInDocument = 1024 * 1024
        });

        return XDocument.Load(reader);
    }

    private static string NormalizePackagePart(string? target) =>
        (target ?? string.Empty).TrimStart('/');

    private static long CopyWithLimit(Stream source, Stream destination, long limit)
    {
        var buffer = new byte[81920];
        long total = 0;
        int count;
        while ((count = source.Read(buffer, 0, buffer.Length)) > 0)
        {
            total += count;
            if (total > limit)
            {
                throw new InvalidDataException();
            }

            destination.Write(buffer, 0, count);
        }

        return total;
    }

    private static bool IsValidZip(ReadOnlySpan<byte> content)
    {
        if (content.Length < 22 || content[0] != (byte)'P' || content[1] != (byte)'K' ||
            content[2] is not 0x03 and not 0x05 and not 0x07)
        {
            return false;
        }

        try
        {
            using var stream = new MemoryStream(content.ToArray(), writable: false);
            using var archive = new ZipArchive(stream, ZipArchiveMode.Read);
            if (archive.Entries.Count > MaximumArchiveEntries)
            {
                return false;
            }

            long expandedLength = 0;
            foreach (var entry in archive.Entries)
            {
                if (entry.Length < 0 || entry.Length > MaximumExpandedArchiveSize - expandedLength)
                {
                    return false;
                }

                expandedLength += entry.Length;
                using var entryStream = entry.Open();
                if (CopyWithLimit(entryStream, Stream.Null, entry.Length) != entry.Length)
                {
                    return false;
                }
            }

            return true;
        }
        catch (Exception exception) when (exception is InvalidDataException or IOException or ArgumentException)
        {
            return false;
        }
    }

    private static bool IsValidIsoBmff(ReadOnlySpan<byte> content, string format)
    {
        if (content.Length < 24)
        {
            return false;
        }

        var offset = 0;
        var hasFtyp = false;
        var hasMediaData = false;
        var hasMovie = false;
        var compatibleBrands = new HashSet<string>(StringComparer.Ordinal);

        while (offset <= content.Length - 8)
        {
            var boxSize = BinaryPrimitives.ReadUInt32BigEndian(content[offset..]);
            var headerSize = 8;
            ulong actualSize = boxSize;
            if (boxSize == 1)
            {
                if (offset > content.Length - 16) return false;
                actualSize = BinaryPrimitives.ReadUInt64BigEndian(content[(offset + 8)..]);
                headerSize = 16;
            }
            else if (boxSize == 0)
            {
                actualSize = (ulong)(content.Length - offset);
            }

            if (actualSize < (ulong)headerSize || actualSize > (ulong)(content.Length - offset))
            {
                return false;
            }

            var boxType = content.Slice(offset + 4, 4);
            if (boxType.SequenceEqual("ftyp"u8))
            {
                if (hasFtyp || actualSize < (ulong)(headerSize + 8) || (actualSize - (ulong)headerSize - 8) % 4 != 0)
                {
                    return false;
                }

                hasFtyp = true;
                var payload = content.Slice(offset + headerSize, (int)actualSize - headerSize);
                compatibleBrands.Add(Encoding.ASCII.GetString(payload[..4]));
                for (var brandOffset = 8; brandOffset + 4 <= payload.Length; brandOffset += 4)
                {
                    compatibleBrands.Add(Encoding.ASCII.GetString(payload.Slice(brandOffset, 4)));
                }
            }
            else if (boxType.SequenceEqual("mdat"u8))
            {
                hasMediaData = actualSize > (ulong)headerSize;
            }
            else if (boxType.SequenceEqual("moov"u8) || boxType.SequenceEqual("moof"u8))
            {
                hasMovie = actualSize > (ulong)headerSize;
            }

            offset += (int)actualSize;
        }

        if (offset != content.Length || !hasFtyp || !hasMediaData || !hasMovie)
        {
            return false;
        }

        return format switch
        {
            "mov" => compatibleBrands.Contains("qt  "),
            "m4a" => compatibleBrands.Contains("M4A ") || compatibleBrands.Contains("M4B "),
            _ => compatibleBrands.Overlaps(["isom", "iso2", "mp41", "mp42", "avc1", "M4V "])
        };
    }

    private static bool IsValidWebM(ReadOnlySpan<byte> content)
    {
        if (content.Length < 32 || !content[..4].SequenceEqual(new byte[] { 0x1A, 0x45, 0xDF, 0xA3 }))
        {
            return false;
        }

        var offset = 4;
        if (!TryReadEbmlVInt(content, ref offset, isIdentifier: false, out var headerSize, out var unknownSize) ||
            unknownSize || headerSize > (ulong)(content.Length - offset))
        {
            return false;
        }

        var headerEnd = offset + (int)headerSize;
        var hasWebmDocType = false;
        while (offset < headerEnd)
        {
            if (!TryReadEbmlVInt(content, ref offset, isIdentifier: true, out var elementId, out _) ||
                !TryReadEbmlVInt(content, ref offset, isIdentifier: false, out var elementSize, out var elementUnknown) ||
                elementUnknown || elementSize > (ulong)(headerEnd - offset))
            {
                return false;
            }

            if (elementId == 0x4282 && Encoding.ASCII.GetString(content.Slice(offset, (int)elementSize)) == "webm")
            {
                hasWebmDocType = true;
            }

            offset += (int)elementSize;
        }

        if (!hasWebmDocType || offset > content.Length - 4 ||
            !TryReadEbmlVInt(content, ref offset, isIdentifier: true, out var segmentId, out _) || segmentId != 0x18538067 ||
            !TryReadEbmlVInt(content, ref offset, isIdentifier: false, out var segmentSize, out var segmentUnknown))
        {
            return false;
        }

        var segmentEnd = segmentUnknown ? content.Length : offset + (int)Math.Min(segmentSize, int.MaxValue);
        if (segmentEnd > content.Length || segmentEnd < offset)
        {
            return false;
        }

        var hasInfo = false;
        var hasTracks = false;
        var hasCluster = false;
        while (offset < segmentEnd)
        {
            if (!TryReadEbmlVInt(content, ref offset, isIdentifier: true, out var elementId, out _) ||
                !TryReadEbmlVInt(content, ref offset, isIdentifier: false, out var elementSize, out var elementUnknown))
            {
                return false;
            }

            if (elementUnknown)
            {
                if (elementId != 0x1F43B675) return false;
                hasCluster = true;
                offset = segmentEnd;
                break;
            }

            if (elementSize > (ulong)(segmentEnd - offset)) return false;
            if (elementId == 0x1549A966) hasInfo = true;
            if (elementId == 0x1654AE6B) hasTracks = true;
            if (elementId == 0x1F43B675) hasCluster = true;
            offset += (int)elementSize;
        }

        return offset == content.Length && hasInfo && hasTracks && hasCluster;
    }

    private static bool TryReadEbmlVInt(
        ReadOnlySpan<byte> content,
        ref int offset,
        bool isIdentifier,
        out ulong value,
        out bool unknownSize)
    {
        value = 0;
        unknownSize = false;
        if (offset >= content.Length || content[offset] == 0)
        {
            return false;
        }

        var first = content[offset];
        var length = 1;
        var mask = 0x80;
        while ((first & mask) == 0)
        {
            length++;
            mask >>= 1;
        }

        if (length > (isIdentifier ? 4 : 8) || length > content.Length - offset)
        {
            return false;
        }

        value = isIdentifier ? first : (ulong)(first & (mask - 1));
        for (var index = 1; index < length; index++)
        {
            value = (value << 8) | content[offset + index];
        }

        offset += length;
        if (!isIdentifier)
        {
            var valueBits = length * 7;
            unknownSize = value == (1UL << valueBits) - 1;
        }

        return true;
    }

    private static bool IsValidMp3(ReadOnlySpan<byte> content)
    {
        var offset = 0;
        if (content.Length >= 10 && content[..3].SequenceEqual("ID3"u8))
        {
            if ((content[6] | content[7] | content[8] | content[9]) >= 0x80)
            {
                return false;
            }

            var tagSize = (content[6] << 21) | (content[7] << 14) | (content[8] << 7) | content[9];
            offset = 10 + tagSize + ((content[5] & 0x10) != 0 ? 10 : 0);
            if (offset > content.Length)
            {
                return false;
            }
        }

        while (offset <= content.Length - 4)
        {
            var header = BinaryPrimitives.ReadUInt32BigEndian(content[offset..]);
            if ((header & 0xFFE00000) == 0xFFE00000)
            {
                var version = (int)((header >> 19) & 0x3);
                var layer = (int)((header >> 17) & 0x3);
                var bitrateIndex = (int)((header >> 12) & 0xF);
                var sampleIndex = (int)((header >> 10) & 0x3);
                if (version != 1 && layer == 1 && bitrateIndex is > 0 and < 15 && sampleIndex < 3)
                {
                    var mpeg1Layer3Bitrates = new[] { 0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320 };
                    var mpeg2Layer3Bitrates = new[] { 0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160 };
                    var sampleRates = version switch
                    {
                        3 => new[] { 44100, 48000, 32000 },
                        2 => new[] { 22050, 24000, 16000 },
                        _ => new[] { 11025, 12000, 8000 }
                    };
                    var bitrate = (version == 3 ? mpeg1Layer3Bitrates : mpeg2Layer3Bitrates)[bitrateIndex] * 1000;
                    var frameLength = (version == 3 ? 144 : 72) * bitrate / sampleRates[sampleIndex] + (int)((header >> 9) & 1);
                    return frameLength >= 24 && frameLength <= content.Length - offset;
                }
            }

            offset++;
        }

        return false;
    }

    private static bool IsValidWav(ReadOnlySpan<byte> content)
    {
        if (content.Length < 44 || !content[..4].SequenceEqual("RIFF"u8) ||
            !content.Slice(8, 4).SequenceEqual("WAVE"u8) ||
            BinaryPrimitives.ReadUInt32LittleEndian(content[4..]) != content.Length - 8)
        {
            return false;
        }

        var offset = 12;
        var hasFormat = false;
        var hasAudio = false;
        while (offset <= content.Length - 8)
        {
            var chunkSize = BinaryPrimitives.ReadUInt32LittleEndian(content[(offset + 4)..]);
            if (chunkSize > int.MaxValue || chunkSize > content.Length - offset - 8)
            {
                return false;
            }

            var chunkType = content.Slice(offset, 4);
            var chunkData = content.Slice(offset + 8, (int)chunkSize);
            if (chunkType.SequenceEqual("fmt "u8))
            {
                if (chunkSize < 16) return false;
                var channels = BinaryPrimitives.ReadUInt16LittleEndian(chunkData[2..]);
                var sampleRate = BinaryPrimitives.ReadUInt32LittleEndian(chunkData[4..]);
                var blockAlign = BinaryPrimitives.ReadUInt16LittleEndian(chunkData[12..]);
                var bitsPerSample = BinaryPrimitives.ReadUInt16LittleEndian(chunkData[14..]);
                if (channels == 0 || sampleRate == 0 || blockAlign == 0 || bitsPerSample == 0) return false;
                hasFormat = true;
            }
            else if (chunkType.SequenceEqual("data"u8))
            {
                hasAudio = chunkSize > 0;
            }

            offset += 8 + (int)chunkSize + ((chunkSize & 1) == 1 ? 1 : 0);
            if (offset > content.Length) return false;
        }

        return offset == content.Length && hasFormat && hasAudio;
    }
}
