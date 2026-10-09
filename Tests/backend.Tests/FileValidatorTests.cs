using System.Buffers.Binary;
using System.IO.Compression;
using System.Text;
using Microsoft.AspNetCore.Http;
using WinCapture.Exceptions;
using WinCapture.Validators;
using Xunit;

namespace WinCapture.Tests;

public sealed class FileValidatorTests
{
    private readonly FileValidator _validator = new();

    [Fact]
    public async Task ValidateAsync_AcceptsWellFormedTextFile()
    {
        var file = CreateFile("notes.txt", "text/plain", "hello WinCapture\n");

        await _validator.ValidateAsync(file);
    }

    [Fact]
    public async Task ValidateAsync_RejectsEmptyFile()
    {
        var file = CreateFile("notes.txt", "text/plain", string.Empty);

        await Assert.ThrowsAsync<BadRequestException>(
            () => _validator.ValidateAsync(file));
    }

    [Fact]
    public async Task ValidateAsync_RejectsUnsupportedExtension()
    {
        var file = CreateFile("script.exe", "application/octet-stream", "content");

        await Assert.ThrowsAsync<BadRequestException>(
            () => _validator.ValidateAsync(file));
    }

    [Fact]
    public async Task ValidateAsync_RejectsMismatchedContentType()
    {
        var file = CreateFile("notes.txt", "application/pdf", "hello");

        await Assert.ThrowsAsync<BadRequestException>(
            () => _validator.ValidateAsync(file));
    }

    [Fact]
    public async Task ValidateAsync_RejectsMalformedTextEncoding()
    {
        var file = CreateFormFile(
            "notes.txt",
            "text/plain",
            new MemoryStream([0xFF, 0xFE, 0xD8]),
            3);

        await Assert.ThrowsAsync<BadRequestException>(
            () => _validator.ValidateAsync(file));
    }

    [Fact]
    public async Task ValidateAsync_RejectsFilesLargerThanLimit()
    {
        var stream = new MemoryStream(new byte[FileValidator.MaximumFileSize + 1]);
        var file = CreateFormFile("notes.txt", "text/plain", stream, stream.Length);

        await Assert.ThrowsAsync<PayloadTooLargeException>(
            () => _validator.ValidateAsync(file));
    }

    [Fact]
    public async Task ValidateAsync_AcceptsStructurallyValidPng()
    {
        var bytes = CreatePng();
        var file = CreateFormFile("pixel.png", "image/png", new MemoryStream(bytes), bytes.Length);

        await _validator.ValidateAsync(file);
    }

    [Fact]
    public async Task ValidateAsync_RejectsImageWithInvalidChunkChecksum()
    {
        var bytes = CreatePng();
        var idatOffset = Encoding.ASCII.GetString(bytes).IndexOf("IDAT", StringComparison.Ordinal);
        var idatLength = BinaryPrimitives.ReadInt32BigEndian(bytes.AsSpan(idatOffset - 4));
        bytes[idatOffset + 4 + idatLength] ^= 0x01;
        var file = CreateFormFile("pixel.png", "image/png", new MemoryStream(bytes), bytes.Length);

        await Assert.ThrowsAsync<BadRequestException>(() => _validator.ValidateAsync(file));
    }

    [Fact]
    public async Task ValidateAsync_AcceptsPdfWithEndMarker()
    {
        var file = CreateFile("document.pdf", "application/pdf", "%PDF-1.4\nminimal test\n%%EOF\n");

        await _validator.ValidateAsync(file);
    }

    [Fact]
    public async Task ValidateAsync_RejectsPdfWithoutEndMarker()
    {
        var file = CreateFile("document.pdf", "application/pdf", "%PDF-1.4\nno end marker");

        await Assert.ThrowsAsync<BadRequestException>(() => _validator.ValidateAsync(file));
    }

    [Fact]
    public async Task ValidateAsync_AcceptsQuotedCsvFields()
    {
        var file = CreateFile("records.csv", "text/csv", "name,notes\r\nAda,\"line one\r\nline two\"\r\n");

        await _validator.ValidateAsync(file);
    }

    [Fact]
    public async Task ValidateAsync_RejectsMalformedCsvQuoting()
    {
        var file = CreateFile("records.csv", "text/csv", "name,notes\nAda,\"unfinished\n");

        await Assert.ThrowsAsync<BadRequestException>(() => _validator.ValidateAsync(file));
    }

    [Fact]
    public async Task ValidateAsync_AcceptsWellFormedZipArchive()
    {
        var bytes = CreateZip(("readme.txt", "safe content"));
        var file = CreateFormFile("archive.zip", "application/zip", new MemoryStream(bytes), bytes.Length);

        await _validator.ValidateAsync(file);
    }

    [Fact]
    public async Task ValidateAsync_RejectsZipArchiveWithTraversalEntry()
    {
        var bytes = CreateZip(("../outside.txt", "unsafe content"));
        var file = CreateFormFile("archive.zip", "application/zip", new MemoryStream(bytes), bytes.Length);

        await Assert.ThrowsAsync<BadRequestException>(() => _validator.ValidateAsync(file));
    }

    [Fact]
    public async Task ValidateAsync_AcceptsSpreadsheetPackageWithRequiredParts()
    {
        var bytes = CreateZip(
            ("[Content_Types].xml", """
                <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
                  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml" />
                </Types>
                """),
            ("_rels/.rels", """
                <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
                  <Relationship Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml" />
                </Relationships>
                """),
            ("xl/workbook.xml", "<workbook />"));
        var file = CreateFormFile(
            "workbook.xlsx",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            new MemoryStream(bytes),
            bytes.Length);

        await _validator.ValidateAsync(file);
    }

    public static IEnumerable<object[]> SupportedMediaFiles =>
    [
        ["image.jpg", "image/jpeg", CreateJpeg()],
        ["image.webp", "image/webp", CreateWebP()],
        ["audio.mp3", "audio/mpeg", CreateMp3()],
        ["audio.wav", "audio/wav", CreateWav()],
        ["video.mp4", "video/mp4", CreateIsoBmff("isom")],
        ["video.mov", "video/quicktime", CreateIsoBmff("qt  ")],
        ["audio.m4a", "audio/mp4", CreateIsoBmff("M4A ")],
        ["video.webm", "video/webm", CreateWebM()]
    ];

    [Theory]
    [MemberData(nameof(SupportedMediaFiles))]
    public async Task ValidateAsync_AcceptsWellFormedSupportedMedia(
        string fileName,
        string contentType,
        byte[] content)
    {
        await _validator.ValidateAsync(CreateFormFile(
            fileName,
            contentType,
            new MemoryStream(content),
            content.Length));
    }

    [Fact]
    public async Task ValidateAsync_AcceptsWordProcessingPackage()
    {
        var bytes = CreateOfficePackage(
            "word/document.xml",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml");

        await _validator.ValidateAsync(CreateFormFile(
            "document.docx",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            new MemoryStream(bytes),
            bytes.Length));
    }

    [Fact]
    public async Task ValidateAsync_AcceptsPresentationPackage()
    {
        var bytes = CreateOfficePackage(
            "ppt/presentation.xml",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml");

        await _validator.ValidateAsync(CreateFormFile(
            "presentation.pptx",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            new MemoryStream(bytes),
            bytes.Length));
    }

    [Theory]
    [InlineData("image.jpg", "image/jpeg")]
    [InlineData("image.webp", "image/webp")]
    [InlineData("audio.mp3", "audio/mpeg")]
    [InlineData("audio.wav", "audio/wav")]
    [InlineData("video.mp4", "video/mp4")]
    [InlineData("video.mov", "video/quicktime")]
    [InlineData("audio.m4a", "audio/mp4")]
    [InlineData("video.webm", "video/webm")]
    public async Task ValidateAsync_RejectsTruncatedMedia(
        string fileName,
        string contentType)
    {
        var file = CreateFormFile(
            fileName,
            contentType,
            new MemoryStream([0x01, 0x02, 0x03]),
            3);

        await Assert.ThrowsAsync<BadRequestException>(() => _validator.ValidateAsync(file));
    }

    [Fact]
    public async Task ValidateAsync_RejectsOfficePackageWithExternalRootRelationship()
    {
        var bytes = CreateOfficePackage(
            "word/document.xml",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml",
            "External");

        var file = CreateFormFile(
            "document.docx",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            new MemoryStream(bytes),
            bytes.Length);

        await Assert.ThrowsAsync<BadRequestException>(() => _validator.ValidateAsync(file));
    }

    [Fact]
    public async Task ValidateAsync_RejectsDeclaredLengthThatDiffersFromStream()
    {
        var file = CreateFormFile(
            "notes.txt",
            "text/plain",
            new MemoryStream(Encoding.UTF8.GetBytes("short")),
            10);

        await Assert.ThrowsAsync<BadRequestException>(() => _validator.ValidateAsync(file));
    }

    [Theory]
    [MemberData(nameof(BomEncodedTextFiles))]
    public async Task ValidateAsync_AcceptsSupportedBomTextEncodings(byte[] content)
    {
        var file = CreateFormFile(
            "notes.txt",
            "text/plain",
            new MemoryStream(content),
            content.Length);

        await _validator.ValidateAsync(file);
    }

    public static IEnumerable<object[]> BomEncodedTextFiles =>
    [
        [Encoding.UTF8.GetPreamble().Concat(Encoding.UTF8.GetBytes("hello")).ToArray()],
        [Encoding.Unicode.GetPreamble().Concat(Encoding.Unicode.GetBytes("hello")).ToArray()],
        [Encoding.BigEndianUnicode.GetPreamble().Concat(Encoding.BigEndianUnicode.GetBytes("hello")).ToArray()]
    ];

    [Fact]
    public async Task ValidateAsync_RejectsUnsupportedControlCharactersInText()
    {
        var file = CreateFile("notes.txt", "text/plain", "hello\u0001world");

        await Assert.ThrowsAsync<BadRequestException>(() => _validator.ValidateAsync(file));
    }

    [Theory]
    [InlineData("name,notes\nAda,unquoted\"quote")]
    [InlineData("name,notes\rAda,Grace")]
    public async Task ValidateAsync_RejectsInvalidCsvQuoteAndLineEndingPlacement(string csv)
    {
        var file = CreateFile("records.csv", "text/csv", csv);

        await Assert.ThrowsAsync<BadRequestException>(() => _validator.ValidateAsync(file));
    }

    [Fact]
    public async Task ValidateAsync_RejectsPdfWithNonWhitespaceAfterEndMarker()
    {
        var file = CreateFile("document.pdf", "application/pdf", "%PDF-1.4\n%%EOF\nunexpected");

        await Assert.ThrowsAsync<BadRequestException>(() => _validator.ValidateAsync(file));
    }

    [Fact]
    public async Task ValidateAsync_RejectsWebpWithInvalidChunkLength()
    {
        var bytes = CreateWebP();
        BinaryPrimitives.WriteUInt32LittleEndian(bytes.AsSpan(16), uint.MaxValue);
        var file = CreateFormFile("image.webp", "image/webp", new MemoryStream(bytes), bytes.Length);

        await Assert.ThrowsAsync<BadRequestException>(() => _validator.ValidateAsync(file));
    }

    [Fact]
    public async Task ValidateAsync_AcceptsMp3WithId3HeaderAndFooter()
    {
        var frame = CreateMp3();
        var content = new byte[20 + frame.Length];
        Encoding.ASCII.GetBytes("ID3").CopyTo(content, 0);
        content[3] = 4;
        content[5] = 0x10;
        frame.CopyTo(content, 20);
        var file = CreateFormFile("audio.mp3", "audio/mpeg", new MemoryStream(content), content.Length);

        await _validator.ValidateAsync(file);
    }

    [Fact]
    public async Task ValidateAsync_RejectsMp3WithInvalidSyncSafeTagSize()
    {
        var content = new byte[20];
        Encoding.ASCII.GetBytes("ID3").CopyTo(content, 0);
        content[6] = 0x80;
        var file = CreateFormFile("audio.mp3", "audio/mpeg", new MemoryStream(content), content.Length);

        await Assert.ThrowsAsync<BadRequestException>(() => _validator.ValidateAsync(file));
    }

    [Fact]
    public async Task ValidateAsync_RejectsWavWithInvalidFormatFields()
    {
        var content = CreateWav();
        BinaryPrimitives.WriteUInt16LittleEndian(content.AsSpan(22), 0);
        var file = CreateFormFile("audio.wav", "audio/wav", new MemoryStream(content), content.Length);

        await Assert.ThrowsAsync<BadRequestException>(() => _validator.ValidateAsync(file));
    }

    private static byte[] CreateJpeg()
    {
        return
        [
            0xFF, 0xD8,
            0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01, 0x11, 0x00,
            0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F, 0x00,
            0x01, 0xFF, 0xD9
        ];
    }

    private static byte[] CreateWebP()
    {
        using var stream = new MemoryStream();
        using var writer = new BinaryWriter(stream, Encoding.ASCII, leaveOpen: true);
        writer.Write(Encoding.ASCII.GetBytes("RIFF"));
        writer.Write(14U);
        writer.Write(Encoding.ASCII.GetBytes("WEBP"));
        writer.Write(Encoding.ASCII.GetBytes("VP8 "));
        writer.Write(1U);
        writer.Write((byte)0);
        writer.Write((byte)0);
        return stream.ToArray();
    }

    private static byte[] CreateMp3()
    {
        var content = new byte[417];
        BinaryPrimitives.WriteUInt32BigEndian(content, 0xFFFB9064);
        return content;
    }

    private static byte[] CreateWav()
    {
        var content = new byte[46];
        Encoding.ASCII.GetBytes("RIFF").CopyTo(content, 0);
        BinaryPrimitives.WriteUInt32LittleEndian(content.AsSpan(4), (uint)(content.Length - 8));
        Encoding.ASCII.GetBytes("WAVEfmt ").CopyTo(content, 8);
        BinaryPrimitives.WriteUInt32LittleEndian(content.AsSpan(16), 16);
        BinaryPrimitives.WriteUInt16LittleEndian(content.AsSpan(20), 1);
        BinaryPrimitives.WriteUInt16LittleEndian(content.AsSpan(22), 1);
        BinaryPrimitives.WriteUInt32LittleEndian(content.AsSpan(24), 8000);
        BinaryPrimitives.WriteUInt32LittleEndian(content.AsSpan(28), 8000);
        BinaryPrimitives.WriteUInt16LittleEndian(content.AsSpan(32), 1);
        BinaryPrimitives.WriteUInt16LittleEndian(content.AsSpan(34), 8);
        Encoding.ASCII.GetBytes("data").CopyTo(content, 36);
        BinaryPrimitives.WriteUInt32LittleEndian(content.AsSpan(40), 1);
        return content;
    }

    private static byte[] CreateIsoBmff(string brand)
    {
        using var stream = new MemoryStream();
        WriteBox(stream, "ftyp", Encoding.ASCII.GetBytes(brand).Concat(new byte[4]).ToArray());
        WriteBox(stream, "mdat", [0x01]);
        WriteBox(stream, "moov", [0x01]);
        return stream.ToArray();
    }

    private static void WriteBox(Stream stream, string type, byte[] payload)
    {
        Span<byte> size = stackalloc byte[4];
        BinaryPrimitives.WriteUInt32BigEndian(size, (uint)(payload.Length + 8));
        stream.Write(size);
        stream.Write(Encoding.ASCII.GetBytes(type));
        stream.Write(payload);
    }

    private static byte[] CreateWebM()
    {
        return
        [
            0x1A, 0x45, 0xDF, 0xA3, 0x87, 0x42, 0x82, 0x84, (byte)'w', (byte)'e', (byte)'b', (byte)'m',
            0x18, 0x53, 0x80, 0x67, 0xFF,
            0x15, 0x49, 0xA9, 0x66, 0x81, 0x00,
            0x16, 0x54, 0xAE, 0x6B, 0x81, 0x00,
            0x1F, 0x43, 0xB6, 0x75, 0x81, 0x00
        ];
    }

    private static byte[] CreateOfficePackage(
        string mainPart,
        string mainContentType,
        string? targetMode = null)
    {
        var contentTypes = $"""
            <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
              <Override PartName="/{mainPart}" ContentType="{mainContentType}" />
            </Types>
            """;
        var targetModeAttribute = targetMode is null ? string.Empty : $" TargetMode=\"{targetMode}\"";
        var relationships = $"""
            <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
              <Relationship Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="{mainPart}"{targetModeAttribute} />
            </Relationships>
            """;

        return CreateZip(
            ("[Content_Types].xml", contentTypes),
            ("_rels/.rels", relationships),
            (mainPart, "<document />"));
    }

    private static byte[] CreateZip(params (string Name, string Content)[] entries)
    {
        using var stream = new MemoryStream();

        using (var archive = new ZipArchive(stream, ZipArchiveMode.Create, leaveOpen: true))
        {
            foreach (var (name, content) in entries)
            {
                using var entry = new StreamWriter(archive.CreateEntry(name).Open(), Encoding.UTF8);
                entry.Write(content);
            }
        }

        return stream.ToArray();
    }

    private static byte[] CreatePng()
    {
        using var stream = new MemoryStream();
        stream.Write([137, 80, 78, 71, 13, 10, 26, 10]);

        var header = new byte[13];
        BinaryPrimitives.WriteUInt32BigEndian(header, 1);
        BinaryPrimitives.WriteUInt32BigEndian(header.AsSpan(4), 1);
        header[8] = 8;
        header[9] = 6;
        WritePngChunk(stream, "IHDR", header);

        using var compressed = new MemoryStream();
        using (var zlib = new ZLibStream(compressed, CompressionLevel.Optimal, leaveOpen: true))
        {
            zlib.Write([0, 0, 0, 0, 0]);
        }

        WritePngChunk(stream, "IDAT", compressed.ToArray());
        WritePngChunk(stream, "IEND", []);
        return stream.ToArray();
    }

    private static void WritePngChunk(Stream stream, string type, byte[] data)
    {
        Span<byte> length = stackalloc byte[4];
        BinaryPrimitives.WriteUInt32BigEndian(length, (uint)data.Length);
        stream.Write(length);

        var typeBytes = Encoding.ASCII.GetBytes(type);
        stream.Write(typeBytes);
        stream.Write(data);

        var crc = uint.MaxValue;
        foreach (var value in typeBytes.Concat(data))
        {
            crc ^= value;
            for (var bit = 0; bit < 8; bit++)
            {
                crc = (crc & 1) != 0 ? (crc >> 1) ^ 0xEDB88320 : crc >> 1;
            }
        }

        Span<byte> checksum = stackalloc byte[4];
        BinaryPrimitives.WriteUInt32BigEndian(checksum, ~crc);
        stream.Write(checksum);
    }

    private static FormFile CreateFile(string fileName, string contentType, string content)
    {
        var bytes = System.Text.Encoding.UTF8.GetBytes(content);
        return CreateFormFile(fileName, contentType, new MemoryStream(bytes), bytes.Length);
    }

    private static FormFile CreateFormFile(
        string fileName,
        string contentType,
        Stream stream,
        long length)
    {
        var file = new FormFile(stream, 0, length, "file", fileName)
        {
            Headers = new HeaderDictionary()
        };
        file.ContentType = contentType;
        return file;
    }
}
