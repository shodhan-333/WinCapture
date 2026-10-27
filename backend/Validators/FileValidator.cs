using System;
using System.Buffers.Binary;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
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
    private const int MaximumXmlCharacters = 1024 * 1024;
    private const int BufferSize = 81920;

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

    // Checks the file size, extension, content type, and actual file structure before accepting an upload.
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

    // Reads the file into memory while enforcing the upload size limit and checking for incomplete input.
    private static async Task<byte[]> ReadContentAsync(IFormFile file)
    {
        await using var stream = file.OpenReadStream();
        using var buffer = new MemoryStream((int)file.Length);

        var chunk = new byte[BufferSize];
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

        return buffer.ToArray();
    }

    // Selects the content validator that matches the uploaded file extension.
    private static bool HasValidContent(string extension, byte[] content) =>
        extension.ToLowerInvariant() switch
        {
            ".jpg" or ".jpeg" => IsValidJpeg(content),
            ".png" => IsValidPng(content),
            ".webp" => IsValidWebP(content),
            ".pdf" => IsValidPdf(content),
            ".txt" => IsValidText(content),
            ".csv" => IsValidCsv(content),
            ".docx" => IsValidOfficePackage(
                content,
                "word/document.xml",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"),
            ".xlsx" => IsValidOfficePackage(
                content,
                "xl/workbook.xml",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"),
            ".pptx" => IsValidOfficePackage(
                content,
                "ppt/presentation.xml",
                "application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"),
            ".mp4" => IsValidIsoBmff(content, "mp4"),
            ".mov" => IsValidIsoBmff(content, "mov"),
            ".webm" => IsValidWebM(content),
            ".mp3" => IsValidMp3(content),
            ".wav" => IsValidWav(content),
            ".m4a" => IsValidIsoBmff(content, "m4a"),
            ".zip" => IsValidZip(content),
            _ => false
        };

    // Checks JPEG markers and walks image scan data until the end marker or another valid segment is found.
    private static bool IsValidJpeg(ReadOnlySpan<byte> content)
    {
        if (content.Length < 12 ||
            content[0] != 0xFF || content[1] != 0xD8 ||
            content[^2] != 0xFF || content[^1] != 0xD9)
        {
            return false;
        }

        var offset = 2;
        var hasFrame = false;
        var hasScan = false;
        var hasScanData = false;

        while (offset < content.Length)
        {
            if (content[offset] != 0xFF)
            {
                return false;
            }

            // A valid file ends with FF D9, so the marker walk always sees the EOI byte before EOF.
            while (content[offset] == 0xFF)
            {
                offset++;
            }

            var marker = content[offset++];

            if (marker == 0xD9)
            {
                return hasFrame && hasScan && hasScanData && offset == content.Length;
            }

            // These markers do not contain a length field; a second SOI marker is not valid here.
            if (marker == 0xD8)
            {
                return false;
            }

            if (marker == 0x01)
            {
                continue;
            }

            if (marker is >= 0xD0 and <= 0xD7)
            {
                return false;
            }

            var segmentLength = BinaryPrimitives.ReadUInt16BigEndian(content[offset..]);

            if (segmentLength < 2 || segmentLength > content.Length - offset)
            {
                return false;
            }

            var segmentEnd = offset + segmentLength;

            if (marker is >= 0xC0 and <= 0xCF && marker is not 0xC4 and not 0xC8 and not 0xCC)
            {
                if (segmentLength < 11)
                {
                    return false;
                }

                var frameData = content.Slice(offset + 2, segmentLength - 2);
                var height = BinaryPrimitives.ReadUInt16BigEndian(frameData[1..]);
                var width = BinaryPrimitives.ReadUInt16BigEndian(frameData[3..]);
                var componentCount = frameData[5];

                if (width == 0 || height == 0 || componentCount == 0 ||
                    segmentLength != 8 + 3 * componentCount)
                {
                    return false;
                }

                hasFrame = true;
            }

            offset = segmentEnd;

            if (marker != 0xDA)
            {
                continue;
            }

            if (!hasFrame || segmentLength < 8)
            {
                return false;
            }

            var scanData = content.Slice(offset - segmentLength + 2, segmentLength - 2);
            var scanComponentCount = scanData[0];

            if (scanComponentCount == 0 || segmentLength != 6 + 2 * scanComponentCount)
            {
                return false;
            }

            hasScan = true;
            hasScanData = false;

            // Within scan data, FF 00 is a stuffed byte and D0-D7 are restart markers.
            while (offset < content.Length)
            {
                if (content[offset] != 0xFF)
                {
                    hasScanData = true;
                    offset++;
                    continue;
                }

                var markerStart = offset++;

                while (content[offset] == 0xFF)
                {
                    offset++;
                }

                var scanMarker = content[offset];

                if (scanMarker == 0x00 || scanMarker is >= 0xD0 and <= 0xD7)
                {
                    hasScanData = true;
                    offset++;
                    continue;
                }

                if (!hasScanData)
                {
                    return false;
                }

                // Let the outer loop process the next marker, including EOI or another scan segment.
                offset = markerStart;
                break;
            }
        }

        return false;
    }

    // Checks PNG chunk lengths, CRC values, chunk ordering, and required image data.
    private static bool IsValidPng(ReadOnlySpan<byte> content)
    {
        ReadOnlySpan<byte> signature = [137, 80, 78, 71, 13, 10, 26, 10];

        if (content.Length < 45 || !content.StartsWith(signature))
        {
            return false;
        }

        var offset = 8;
        var sawHeader = false;
        var sawPalette = false;
        var sawImageData = false;
        var imageDataEnded = false;
        var sawEnd = false;
        byte colorType = 0;
        byte bitDepth = 0;

        while (offset <= content.Length - 12)
        {
            var length = BinaryPrimitives.ReadUInt32BigEndian(content[offset..]);

            if (length > content.Length - offset - 12)
            {
                return false;
            }

            var dataLength = (int)length;
            var type = content.Slice(offset + 4, 4);

            if (!IsValidPngChunkType(type))
            {
                return false;
            }

            var data = content.Slice(offset + 8, dataLength);
            var expectedCrc = BinaryPrimitives.ReadUInt32BigEndian(
                content.Slice(offset + 8 + dataLength, 4));

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
                bitDepth = data[8];
                colorType = data[9];

                if (width == 0 || height == 0 ||
                    data[10] != 0 || data[11] != 0 || data[12] > 1 ||
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

            if (type.SequenceEqual("PLTE"u8))
            {
                if (sawImageData || sawPalette || dataLength == 0 || dataLength % 3 != 0 || dataLength > 768 ||
                    colorType is 0 or 4 ||
                    colorType == 3 && dataLength / 3 > (1 << bitDepth))
                {
                    return false;
                }

                sawPalette = true;
            }

            if (type.SequenceEqual("IDAT"u8))
            {
                if (imageDataEnded)
                {
                    return false;
                }

                sawImageData = true;
            }
            else if (sawImageData && !type.SequenceEqual("IEND"u8))
            {
                imageDataEnded = true;
            }

            // Unknown critical chunks cannot safely be ignored by this structural validator.
            if (!IsKnownPngChunk(type) && type[0] >= (byte)'A' && type[0] <= (byte)'Z')
            {
                return false;
            }

            offset += 12 + dataLength;

            if (type.SequenceEqual("IEND"u8))
            {
                sawEnd = dataLength == 0 && offset == content.Length;
                break;
            }
        }

        return sawHeader && sawImageData && sawEnd && (colorType != 3 || sawPalette);
    }

    // Rejects chunk names that do not follow the PNG chunk-type format.
    private static bool IsValidPngChunkType(ReadOnlySpan<byte> type)
    {
        foreach (var value in type)
        {
            var isUppercase = value >= (byte)'A' && value <= (byte)'Z';
            var isLowercase = value >= (byte)'a' && value <= (byte)'z';

            if (!isUppercase && !isLowercase)
            {
                return false;
            }
        }

        // The loop above establishes that type[2] is an ASCII letter, so this upper bound
        // distinguishes uppercase from lowercase without checking the lower bound again.
        return type[2] <= (byte)'Z';
    }

    // Recognizes PNG chunk types handled by this validator or defined as common ancillary chunks.
    private static bool IsKnownPngChunk(ReadOnlySpan<byte> type) =>
        type.SequenceEqual("IHDR"u8) ||
        type.SequenceEqual("PLTE"u8) ||
        type.SequenceEqual("IDAT"u8) ||
        type.SequenceEqual("IEND"u8) ||
        type.SequenceEqual("tRNS"u8) ||
        type.SequenceEqual("gAMA"u8) ||
        type.SequenceEqual("cHRM"u8) ||
        type.SequenceEqual("sRGB"u8) ||
        type.SequenceEqual("iCCP"u8) ||
        type.SequenceEqual("sBIT"u8) ||
        type.SequenceEqual("bKGD"u8) ||
        type.SequenceEqual("pHYs"u8) ||
        type.SequenceEqual("tEXt"u8) ||
        type.SequenceEqual("zTXt"u8) ||
        type.SequenceEqual("iTXt"u8) ||
        type.SequenceEqual("eXIf"u8) ||
        type.SequenceEqual("hIST"u8);

    // Checks whether the PNG bit depth is supported for the selected color type.
    private static bool IsValidPngBitDepth(byte colorType, byte bitDepth) =>
        colorType switch
        {
            0 => bitDepth is 1 or 2 or 4 or 8 or 16,
            2 => bitDepth is 8 or 16,
            3 => bitDepth is 1 or 2 or 4 or 8,
            4 or 6 => bitDepth is 8 or 16,
            _ => false
        };

    // Calculates the CRC used to verify PNG chunks.
    private static uint ComputePngCrc(ReadOnlySpan<byte> type, ReadOnlySpan<byte> data)
    {
        var crc = 0xFFFFFFFFu;

        foreach (var value in type)
        {
            crc = PngCrcTable[(int)((crc ^ value) & 0xFF)] ^ (crc >> 8);
        }

        foreach (var value in data)
        {
            crc = PngCrcTable[(int)((crc ^ value) & 0xFF)] ^ (crc >> 8);
        }

        return ~crc;
    }

    // Creates the lookup table used for PNG CRC calculations.
    private static uint[] CreatePngCrcTable()
    {
        var table = new uint[256];

        for (var index = 0; index < table.Length; index++)
        {
            var value = (uint)index;

            for (var bit = 0; bit < 8; bit++)
            {
                value = (value & 1) == 1
                    ? 0xEDB88320u ^ (value >> 1)
                    : value >> 1;
            }

            table[index] = value;
        }

        return table;
    }

    // Checks the WebP container size, chunk boundaries, and presence of an image chunk.
    private static bool IsValidWebP(ReadOnlySpan<byte> content)
    {
        if (content.Length < 20 ||
            !content[..4].SequenceEqual("RIFF"u8) ||
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

            if (chunkLength > content.Length - offset - 8)
            {
                return false;
            }

            var chunkType = content.Slice(offset, 4);

            if ((chunkType.SequenceEqual("VP8 "u8) ||
                 chunkType.SequenceEqual("VP8L"u8)) && chunkLength > 0)
            {
                hasImage = true;
            }

            if (chunkType.SequenceEqual("VP8X"u8) && chunkLength != 10)
            {
                return false;
            }

            offset += 8 + (int)chunkLength + ((chunkLength & 1) == 1 ? 1 : 0);

            if (offset > content.Length)
            {
                return false;
            }
        }

        return offset == content.Length && hasImage;
    }

    // Checks the PDF header and requires an end-of-file marker near the end of the file.
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

    // Decodes supported text encodings and rejects invalid byte sequences.
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

    // Rejects empty text and text containing unsupported control characters.
    private static bool IsValidText(ReadOnlySpan<byte> content) =>
        TryDecodeText(content, out var text) &&
        !string.IsNullOrWhiteSpace(text) &&
        ContainsOnlyTextCharacters(text);

    // Checks CSV field quoting and line endings after decoding the file.
    private static bool IsValidCsv(ReadOnlySpan<byte> content)
    {
        if (!TryDecodeText(content, out var text) ||
            string.IsNullOrWhiteSpace(text) ||
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
                else if (character == '\r' &&
                         (index + 1 >= text.Length || text[index + 1] != '\n'))
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

                if (character == '\n' ||
                    (character == '\r' && index + 1 < text.Length && text[index + 1] == '\n'))
                {
                    if (character == '\r')
                    {
                        index++;
                    }

                    afterQuote = false;
                    atFieldStart = true;
                    continue;
                }

                return false;
            }

            if (character == '"')
            {
                if (!atFieldStart)
                {
                    return false;
                }

                insideQuotes = true;
                atFieldStart = false;
            }
            else if (character == ',')
            {
                atFieldStart = true;
            }
            else if (character == '\n' ||
                     (character == '\r' && index + 1 < text.Length && text[index + 1] == '\n'))
            {
                if (character == '\r')
                {
                    index++;
                }

                atFieldStart = true;
            }
            else
            {
                if (character == '\r')
                {
                    return false;
                }

                atFieldStart = false;
            }
        }

        return !insideQuotes;
    }

    // Allows ordinary text characters, tabs, and line breaks while rejecting other control characters.
    private static bool ContainsOnlyTextCharacters(string text) =>
        text.All(character =>
            !char.IsControl(character) || character is '\t' or '\r' or '\n');

    // Checks Office package parts, expanded size, required XML, content types, and root relationships.
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
                if (!IsSafeArchiveEntryName(entry.FullName) ||
                    entry.Length > MaximumExpandedArchiveSize - expandedLength ||
                    !parts.Add(entry.FullName))
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

            if (!parts.Contains("[Content_Types].xml") ||
                !parts.Contains("_rels/.rels") ||
                !parts.Contains(mainPart))
            {
                return false;
            }

            var contentTypes = ReadXmlEntry(archive, "[Content_Types].xml");
            var relationships = ReadXmlEntry(archive, "_rels/.rels");
            _ = ReadXmlEntry(archive, mainPart);

            XNamespace contentTypeNamespace =
                "http://schemas.openxmlformats.org/package/2006/content-types";

            XNamespace relationshipNamespace =
                "http://schemas.openxmlformats.org/package/2006/relationships";

            var hasExpectedContentType = contentTypes
                .Root?
                .Elements(contentTypeNamespace + "Override")
                .Any(element =>
                    string.Equals(
                        (string?)element.Attribute("PartName"),
                        $"/{mainPart}",
                        StringComparison.Ordinal) &&
                    string.Equals(
                        (string?)element.Attribute("ContentType"),
                        mainContentType,
                        StringComparison.Ordinal)) == true;

            var hasOfficeDocumentRelationship = relationships
                .Root?
                .Elements(relationshipNamespace + "Relationship")
                .Any(element =>
                    string.Equals(
                        (string?)element.Attribute("Type"),
                        "http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument",
                        StringComparison.Ordinal) &&
                    !string.Equals(
                        (string?)element.Attribute("TargetMode"),
                        "External",
                        StringComparison.OrdinalIgnoreCase) &&
                    NormalizePackagePart((string?)element.Attribute("Target")) == mainPart) == true;

            return hasExpectedContentType && hasOfficeDocumentRelationship;
        }
        catch (Exception exception) when (
            exception is IOException or InvalidDataException or XmlException or ArgumentException or InvalidOperationException)
        {
            return false;
        }
    }

    // Rejects absolute or traversal-like archive paths before processing package entries.
    private static bool IsSafeArchiveEntryName(string name) =>
        !string.IsNullOrWhiteSpace(name) &&
        !name.StartsWith("/", StringComparison.Ordinal) &&
        !name.StartsWith('\\') &&
        !name.Contains('\\') &&
        !name.Contains(":", StringComparison.Ordinal) &&
        !name.Split('/').Any(part => part is "." or "..");

    // Reads an Office XML entry without allowing DTD processing or excessive document sizes.
    private static XDocument ReadXmlEntry(ZipArchive archive, string name)
    {
        // The package validator verifies required entry names before reading XML parts.
        var entry = archive.GetEntry(name)!;

        if (entry.Length > MaximumXmlCharacters)
        {
            throw new InvalidDataException();
        }

        using var stream = entry.Open();

        using var reader = XmlReader.Create(stream, new XmlReaderSettings
        {
            DtdProcessing = DtdProcessing.Prohibit,
            XmlResolver = null,
            MaxCharactersInDocument = MaximumXmlCharacters
        });

        return XDocument.Load(reader);
    }

    // Removes a leading slash from an Office package relationship target.
    private static string NormalizePackagePart(string? target) =>
        (target ?? string.Empty).TrimStart('/');

    // Copies a stream while rejecting content that exceeds its allowed length.
    private static long CopyWithLimit(Stream source, Stream destination, long limit)
    {
        var buffer = new byte[BufferSize];
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

    // Checks ZIP structure and limits the number and expanded size of its entries.
    private static bool IsValidZip(ReadOnlySpan<byte> content)
    {
        if (content.Length < 22 ||
            content[0] != (byte)'P' ||
            content[1] != (byte)'K' ||
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
                if (!IsSafeArchiveEntryName(entry.FullName) ||
                    entry.Length > MaximumExpandedArchiveSize - expandedLength)
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
        catch (Exception exception) when (
            exception is IOException or InvalidDataException or ArgumentException or InvalidOperationException)
        {
            return false;
        }
    }

    // Validates ISO Base Media File Format boxes and the expected brands for MP4, MOV, or M4A.
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
                if (offset > content.Length - 16)
                {
                    return false;
                }

                actualSize = BinaryPrimitives.ReadUInt64BigEndian(content[(offset + 8)..]);
                headerSize = 16;
            }
            else if (boxSize == 0)
            {
                actualSize = (ulong)(content.Length - offset);
            }

            if (actualSize < (ulong)headerSize ||
                actualSize > (ulong)(content.Length - offset))
            {
                return false;
            }

            var boxType = content.Slice(offset + 4, 4);

            if (boxType.SequenceEqual("ftyp"u8))
            {
                if (hasFtyp ||
                    actualSize < (ulong)(headerSize + 8) ||
                    (actualSize - (ulong)headerSize - 8) % 4 != 0)
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
                hasMediaData |= actualSize > (ulong)headerSize;
            }
            else if (boxType.SequenceEqual("moov"u8) || boxType.SequenceEqual("moof"u8))
            {
                hasMovie |= actualSize > (ulong)headerSize;
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
            _ => compatibleBrands.Overlaps(new[] { "isom", "iso2", "mp41", "mp42", "avc1", "M4V " })
        };
    }

    // Validates the WebM header, document type, segment, and required media elements.
    private static bool IsValidWebM(ReadOnlySpan<byte> content)
    {
        if (content.Length < 32 ||
            !content[..4].SequenceEqual(new byte[] { 0x1A, 0x45, 0xDF, 0xA3 }))
        {
            return false;
        }

        var offset = 4;

        if (!TryReadEbmlVInt(content, ref offset, false, out var headerSize, out var unknownSize) ||
            unknownSize ||
            headerSize > (ulong)(content.Length - offset))
        {
            return false;
        }

        var headerEnd = offset + (int)headerSize;
        var hasWebmDocType = false;

        while (offset < headerEnd)
        {
            if (!TryReadEbmlVInt(content, ref offset, true, out var elementId, out _) ||
                !TryReadEbmlVInt(content, ref offset, false, out var elementSize, out var elementUnknown) ||
                elementUnknown ||
                elementSize > (ulong)(headerEnd - offset))
            {
                return false;
            }

            if (elementId == 0x4282 &&
                Encoding.ASCII.GetString(content.Slice(offset, (int)elementSize)) == "webm")
            {
                hasWebmDocType = true;
            }

            offset += (int)elementSize;
        }

        if (!hasWebmDocType ||
            offset > content.Length - 4 ||
            !TryReadEbmlVInt(content, ref offset, true, out var segmentId, out _) ||
            segmentId != 0x18538067 ||
            !TryReadEbmlVInt(content, ref offset, false, out var segmentSize, out var segmentUnknown))
        {
            return false;
        }

        if (!segmentUnknown && segmentSize > (ulong)(content.Length - offset))
        {
            return false;
        }

        var segmentEnd = segmentUnknown ? content.Length : offset + (int)segmentSize;
        var hasInfo = false;
        var hasTracks = false;
        var hasCluster = false;

        while (offset < segmentEnd)
        {
            if (!TryReadEbmlVInt(content, ref offset, true, out var elementId, out _) ||
                !TryReadEbmlVInt(content, ref offset, false, out var elementSize, out var elementUnknown))
            {
                return false;
            }

            if (elementUnknown)
            {
                if (elementId != 0x1F43B675)
                {
                    return false;
                }

                hasCluster = true;
                offset = segmentEnd;
                break;
            }

            if (elementSize > (ulong)(segmentEnd - offset))
            {
                return false;
            }

            if (elementId == 0x1549A966)
            {
                hasInfo = true;
            }

            if (elementId == 0x1654AE6B)
            {
                hasTracks = true;
            }

            if (elementId == 0x1F43B675)
            {
                hasCluster = true;
            }

            offset += (int)elementSize;
        }

        return offset == content.Length && hasInfo && hasTracks && hasCluster;
    }

    // Reads an EBML variable-length integer and checks its length and unknown-size marker.
    private static bool TryReadEbmlVInt(
        ReadOnlySpan<byte> content,
        ref int offset,
        bool isIdentifier,
        out ulong value,
        out bool unknownSize)
    {
        value = 0;
        unknownSize = false;

        if (content[offset] == 0)
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

    // Checks the MP3 frame header and verifies that an audio frame fits within the file.
    private static bool IsValidMp3(ReadOnlySpan<byte> content)
    {
        var offset = 0;

        if (content.Length >= 10 && content[..3].SequenceEqual("ID3"u8))
        {
            if ((content[6] | content[7] | content[8] | content[9]) >= 0x80)
            {
                return false;
            }

            var tagSize = (content[6] << 21) |
                          (content[7] << 14) |
                          (content[8] << 7) |
                          content[9];

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
                    var mpeg1Layer3Bitrates = new[]
                    {
                        0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320
                    };

                    var mpeg2Layer3Bitrates = new[]
                    {
                        0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160
                    };

                    var sampleRates = version switch
                    {
                        3 => new[] { 44100, 48000, 32000 },
                        2 => new[] { 22050, 24000, 16000 },
                        _ => new[] { 11025, 12000, 8000 }
                    };

                    var bitrate = (version == 3
                        ? mpeg1Layer3Bitrates
                        : mpeg2Layer3Bitrates)[bitrateIndex] * 1000;

                    var frameLength = (version == 3 ? 144 : 72) * bitrate /
                                      sampleRates[sampleIndex] +
                                      (int)((header >> 9) & 1);

                    // The supported version, layer, bitrate, and sample-rate ranges yield
                    // minimum frame sizes above 24 bytes.
                    return frameLength <= content.Length - offset;
                }
            }

            offset++;
        }

        return false;
    }

    // Checks the WAV header, format chunk, audio data, and declared RIFF size.
    private static bool IsValidWav(ReadOnlySpan<byte> content)
    {
        if (content.Length < 44 ||
            !content[..4].SequenceEqual("RIFF"u8) ||
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

            if (chunkSize > content.Length - offset - 8)
            {
                return false;
            }

            var chunkType = content.Slice(offset, 4);
            var chunkData = content.Slice(offset + 8, (int)chunkSize);

            if (chunkType.SequenceEqual("fmt "u8))
            {
                if (chunkSize < 16)
                {
                    return false;
                }

                var channels = BinaryPrimitives.ReadUInt16LittleEndian(chunkData[2..]);
                var sampleRate = BinaryPrimitives.ReadUInt32LittleEndian(chunkData[4..]);
                var blockAlign = BinaryPrimitives.ReadUInt16LittleEndian(chunkData[12..]);
                var bitsPerSample = BinaryPrimitives.ReadUInt16LittleEndian(chunkData[14..]);

                if (channels == 0 || sampleRate == 0 || blockAlign == 0 || bitsPerSample == 0)
                {
                    return false;
                }

                hasFormat = true;
            }
            else if (chunkType.SequenceEqual("data"u8))
            {
                hasAudio |= chunkSize > 0;
            }

            offset += 8 + (int)chunkSize + ((chunkSize & 1) == 1 ? 1 : 0);

            if (offset > content.Length)
            {
                return false;
            }
        }

        return offset == content.Length && hasFormat && hasAudio;
    }
}
