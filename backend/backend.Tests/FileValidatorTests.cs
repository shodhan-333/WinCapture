using System.Buffers.Binary;
using System.IO.Compression;
using System.Reflection;
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
    public void HasValidContent_ReturnsFalseForAnUnmappedExtension()
    {
        var dispatch = typeof(FileValidator).GetMethod(
            "HasValidContent", BindingFlags.NonPublic | BindingFlags.Static);

        Assert.NotNull(dispatch);
        Assert.Equal(false, dispatch.Invoke(null, [".unmapped", Array.Empty<byte>()]));
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
    public async Task ValidateAsync_AcceptsJpegAliasAndCaseInsensitiveExtension()
    {
        var bytes = CreateJpeg();
        await _validator.ValidateAsync(CreateFormFile(
            "photo.JPEG", "image/jpeg", new MemoryStream(bytes), bytes.Length));
    }

    [Fact]
    public async Task ValidateAsync_RejectsPngWithInvalidSignatureOrChunkLength()
    {
        var badSignature = CreatePng();
        badSignature[0] = 0;

        var badChunkLength = CreatePng();
        var idat = Encoding.ASCII.GetString(badChunkLength).IndexOf("IDAT", StringComparison.Ordinal);
        BinaryPrimitives.WriteUInt32BigEndian(badChunkLength.AsSpan(idat - 4), uint.MaxValue);

        var truncatedSignature = new byte[20];
        new byte[] { 137, 80, 78, 71, 13, 10, 26, 10 }.CopyTo(truncatedSignature, 0);

        foreach (var content in new[] { badSignature, badChunkLength, truncatedSignature })
        {
            await Assert.ThrowsAsync<BadRequestException>(() => _validator.ValidateAsync(CreateFormFile(
                "bad.png", "image/png", new MemoryStream(content), content.Length)));
        }
    }

    public static IEnumerable<object[]> ValidPngColorModesAndBitDepths =>
    [
        [0, 1], [0, 2], [0, 4], [0, 8], [0, 16],
        [2, 8], [2, 16],
        [3, 1], [3, 2], [3, 4], [3, 8],
        [4, 8], [4, 16],
        [6, 8], [6, 16]
    ];

    [Theory]
    [MemberData(nameof(ValidPngColorModesAndBitDepths))]
    public async Task ValidateAsync_AcceptsEverySupportedPngColorModeAndBitDepth(int colorType, int bitDepth)
    {
        var bytes = CreatePng((byte)colorType, (byte)bitDepth);
        await _validator.ValidateAsync(CreateFormFile(
            "pixel.png", "image/png", new MemoryStream(bytes), bytes.Length));
    }

    [Fact]
    public async Task ValidateAsync_AcceptsMaximumSizedTrueColorPalette()
    {
        var bytes = CreatePng(colorType: 2, beforeImageData: [("PLTE", new byte[768])]);
        await _validator.ValidateAsync(CreateFormFile(
            "pixel.png", "image/png", new MemoryStream(bytes), bytes.Length));
    }

    [Theory]
    [InlineData(0, 3)]
    [InlineData(2, 4)]
    [InlineData(3, 16)]
    [InlineData(4, 4)]
    [InlineData(6, 4)]
    [InlineData(7, 8)]
    public async Task ValidateAsync_RejectsUnsupportedPngColorModeAndBitDepth(int colorType, int bitDepth)
    {
        var bytes = CreatePng((byte)colorType, (byte)bitDepth);
        await Assert.ThrowsAsync<BadRequestException>(() => _validator.ValidateAsync(CreateFormFile(
            "pixel.png", "image/png", new MemoryStream(bytes), bytes.Length)));
    }

    [Fact]
    public async Task ValidateAsync_RejectsPngWithInvalidChunkOrderOrCriticalChunks()
    {
        var invalidPngFiles = new[]
        {
            CreatePng(beforeImageData: [("IHDR", new byte[13])]),
            CreatePng(colorType: 0, beforeImageData: [("PLTE", [0, 0, 0])]),
            CreatePng(beforeImageData: [("ABCD", [1])]),
            CreatePng(beforeImageData: [("A1CD", [1])]),
            CreatePng(beforeImageData: [("ABcd", [1])]),
            CreatePng(colorType: 3, bitDepth: 1, beforeImageData: [("PLTE", [0, 0, 0])]),
            CreatePng(colorType: 3, beforeImageData: [("PLTE", [])], includeDefaultPalette: false),
            CreatePng(colorType: 3, beforeImageData: [("PLTE", [0, 0])], includeDefaultPalette: false),
            CreatePng(colorType: 3, bitDepth: 1, beforeImageData: [("PLTE", new byte[9])], includeDefaultPalette: false),
            CreatePng(colorType: 4, beforeImageData: [("PLTE", [0, 0, 0])]),
            CreatePng(colorType: 3, bitDepth: 1, beforeImageData: [("PLTE", new byte[771])], includeDefaultPalette: false),
            CreatePng(colorType: 3, includeDefaultPalette: false),
            CreatePng(afterImageData: [("tEXt", [1]), ("IDAT", [1])]),
            CreatePng(afterImageData: [("PLTE", [0, 0, 0])]),
            CreatePng(afterImageData: [("IEND", [1])])
        };

        for (var index = 0; index < invalidPngFiles.Length; index++)
        {
            var bytes = invalidPngFiles[index];
            var exception = await Record.ExceptionAsync(() => _validator.ValidateAsync(CreateFormFile(
                "invalid.png", "image/png", new MemoryStream(bytes), bytes.Length)));
            Assert.True(exception is BadRequestException, $"PNG test case {index} was accepted or threw an unexpected exception: {exception}");
        }
    }

    [Fact]
    public async Task ValidateAsync_RejectsInvalidPngHeaderDimensionsAndMethods()
    {
        var zeroWidth = CreatePngHeader();
        BinaryPrimitives.WriteUInt32BigEndian(zeroWidth, 0);
        var zeroHeight = CreatePngHeader();
        BinaryPrimitives.WriteUInt32BigEndian(zeroHeight.AsSpan(4), 0);
        var compressionMethod = CreatePngHeader();
        compressionMethod[10] = 1;
        var filterMethod = CreatePngHeader();
        filterMethod[11] = 1;
        var invalidInterlace = CreatePngHeader();
        invalidInterlace[12] = 2;
        var invalidPngFiles = new[]
        {
            CreatePng(headerData: zeroWidth),
            CreatePng(headerData: zeroHeight),
            CreatePng(headerData: compressionMethod),
            CreatePng(headerData: filterMethod),
            CreatePng(headerData: invalidInterlace),
            CreatePng(headerData: new byte[12]),
            CreatePng(headerType: "tEXt")
        };

        foreach (var bytes in invalidPngFiles)
        {
            await Assert.ThrowsAsync<BadRequestException>(() => _validator.ValidateAsync(CreateFormFile(
                "invalid.png", "image/png", new MemoryStream(bytes), bytes.Length)));
        }
    }

    public static IEnumerable<object[]> KnownPngAncillaryChunks =>
    [
        ["tRNS"], ["gAMA"], ["cHRM"], ["sRGB"], ["iCCP"], ["sBIT"],
        ["bKGD"], ["pHYs"], ["zTXt"], ["iTXt"], ["eXIf"], ["hIST"]
    ];

    [Theory]
    [MemberData(nameof(KnownPngAncillaryChunks))]
    public async Task ValidateAsync_AcceptsKnownPngAncillaryChunks(string chunkName)
    {
        var bytes = CreatePng(beforeImageData: [(chunkName, [1])]);
        await _validator.ValidateAsync(CreateFormFile(
            "pixel.png", "image/png", new MemoryStream(bytes), bytes.Length));
    }

    [Fact]
    public async Task ValidateAsync_AcceptsUnknownAncillaryPngChunk()
    {
        var bytes = CreatePng(beforeImageData: [("vpAg", [1, 2])]);

        await _validator.ValidateAsync(CreateFormFile(
            "pixel.png", "image/png", new MemoryStream(bytes), bytes.Length));
    }

    [Theory]
    [MemberData(nameof(ValidWebPChunkSets))]
    public async Task ValidateAsync_AcceptsSupportedWebPImageChunks((string Type, byte[] Data)[] chunks)
    {
        var bytes = CreateWebP(chunks);
        await _validator.ValidateAsync(CreateFormFile(
            "pixel.webp", "image/webp", new MemoryStream(bytes), bytes.Length));
    }

    public static IEnumerable<object[]> ValidWebPChunkSets =>
    [
        [new[] { ("VP8L", new byte[] { 1 }) }],
        [new[] { ("VP8X", new byte[10]), ("VP8 ", new byte[] { 1 }) }]
    ];

    [Fact]
    public async Task ValidateAsync_RejectsWebPWithoutImageOrWithInvalidExtendedChunk()
    {
        foreach (var chunks in new[]
        {
            new[] { ("META", new byte[] { 1 }) },
            new[] { ("VP8 ", Array.Empty<byte>()) },
            new[] { ("VP8X", new byte[] { 1 }) }
        })
        {
            var bytes = CreateWebP(chunks);
            await Assert.ThrowsAsync<BadRequestException>(() => _validator.ValidateAsync(CreateFormFile(
                "pixel.webp", "image/webp", new MemoryStream(bytes), bytes.Length)));
        }
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

    [Theory]
    [InlineData("%PDF-")]
    [InlineData("not a PDF header even though this is long enough")]
    public async Task ValidateAsync_RejectsShortOrInvalidPdfHeader(string content)
    {
        await Assert.ThrowsAsync<BadRequestException>(() => _validator.ValidateAsync(
            CreateFile("document.pdf", "application/pdf", content)));
    }

    [Fact]
    public async Task ValidateAsync_AcceptsQuotedCsvFields()
    {
        var file = CreateFile("records.csv", "text/csv", "name,notes\r\nAda,\"line one\r\nline two\"\r\n");

        await _validator.ValidateAsync(file);
    }

    [Theory]
    [InlineData("a,b\n\"x\"\"y\",z\n")]
    [InlineData("a,b\r\n\"x\",y\r\n")]
    [InlineData("a,b\n\"x\",\"y\"\n")]
    [InlineData("a,b\n\"x\"")]
    public async Task ValidateAsync_AcceptsEscapedQuotesAndQuotedRecordSeparators(string content)
    {
        await _validator.ValidateAsync(CreateFile("records.csv", "text/csv", content));
    }

    [Fact]
    public async Task ValidateAsync_RejectsMalformedCsvQuoting()
    {
        var file = CreateFile("records.csv", "text/csv", "name,notes\nAda,\"unfinished\n");

        await Assert.ThrowsAsync<BadRequestException>(() => _validator.ValidateAsync(file));
    }

    [Fact]
    public async Task ValidateAsync_RejectsCsvWithInvalidEncodingBlankContentOrControlCharacters()
    {
        var invalidUtf8 = new byte[] { 0xFF, 0xFE, 0xD8 };
        var blank = Encoding.UTF8.GetBytes(" \t\r\n ");
        var controlCharacter = Encoding.UTF8.GetBytes("a,b\n1,\u0001");

        foreach (var content in new[] { invalidUtf8, blank, controlCharacter })
        {
            await Assert.ThrowsAsync<BadRequestException>(() => _validator.ValidateAsync(CreateFormFile(
                "records.csv", "text/csv", new MemoryStream(content), content.Length)));
        }
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

    [Theory]
    [InlineData("/absolute.txt")]
    [InlineData("\\absolute.txt")]
    [InlineData("folder\\file.txt")]
    [InlineData("C:/file.txt")]
    [InlineData("./relative.txt")]
    [InlineData("folder/../outside.txt")]
    public async Task ValidateAsync_RejectsZipArchiveWithUnsafeEntryNames(string name)
    {
        var bytes = CreateZip((name, "unsafe content"));
        await Assert.ThrowsAsync<BadRequestException>(() => _validator.ValidateAsync(CreateFormFile(
            "archive.zip", "application/zip", new MemoryStream(bytes), bytes.Length)));
    }

    [Fact]
    public async Task ValidateAsync_RejectsZipWithTooManyEntriesOrInvalidDirectory()
    {
        var entries = Enumerable.Range(0, 2049)
            .Select(index => ($"file-{index}.txt", "x"))
            .ToArray();
        var oversizedArchive = CreateZip(entries);
        var invalidDirectory = new byte[32];
        invalidDirectory[0] = (byte)'P';
        invalidDirectory[1] = (byte)'K';
        invalidDirectory[2] = 0x03;
        invalidDirectory[3] = 0x04;

        foreach (var bytes in new[] { oversizedArchive, invalidDirectory })
        {
            await Assert.ThrowsAsync<BadRequestException>(() => _validator.ValidateAsync(CreateFormFile(
                "archive.zip", "application/zip", new MemoryStream(bytes), bytes.Length)));
        }
    }

    [Fact]
    public async Task ValidateAsync_RejectsZipHeadersWithInvalidSignatures()
    {
        var invalidFiles = new[]
        {
            new byte[21],
            new byte[] { (byte)'X', (byte)'K', 0x03 }.Concat(new byte[20]).ToArray(),
            new byte[] { (byte)'P', (byte)'X', 0x03 }.Concat(new byte[20]).ToArray(),
            new byte[] { (byte)'P', (byte)'K', 0x09 }.Concat(new byte[20]).ToArray()
        };

        foreach (var content in invalidFiles)
        {
            await Assert.ThrowsAsync<BadRequestException>(() => _validator.ValidateAsync(CreateFormFile(
                "invalid.zip", "application/zip", new MemoryStream(content), content.Length)));
        }
    }

    [Fact]
    public async Task ValidateAsync_RejectsZipEntryWhoseInflatedLengthDoesNotMatchItsHeader()
    {
        using var stream = new MemoryStream();
        using (var archive = new ZipArchive(stream, ZipArchiveMode.Create, leaveOpen: true))
        {
            using var entry = new StreamWriter(
                archive.CreateEntry("data.txt", CompressionLevel.NoCompression).Open(), Encoding.UTF8);
            entry.Write("x");
        }

        var content = stream.ToArray();
        BinaryPrimitives.WriteUInt32LittleEndian(content.AsSpan(22), 10);
        var centralDirectory = Array.IndexOf(content, (byte)0x50, 30);
        while (centralDirectory >= 0 &&
               (centralDirectory + 4 > content.Length ||
                !content.AsSpan(centralDirectory, 4).SequenceEqual(new byte[] { 0x50, 0x4B, 0x01, 0x02 })))
        {
            centralDirectory = Array.IndexOf(content, (byte)0x50, centralDirectory + 1);
        }

        Assert.True(centralDirectory >= 0, "Expected a ZIP central directory entry.");
        BinaryPrimitives.WriteUInt32LittleEndian(content.AsSpan(centralDirectory + 24), 10);

        await Assert.ThrowsAsync<BadRequestException>(() => _validator.ValidateAsync(CreateFormFile(
            "broken.zip", "application/zip", new MemoryStream(content), content.Length)));
    }

    [Fact]
    public void CopyWithLimit_ThrowsWhenStreamExceedsItsMaximum()
    {
        var copyWithLimit = typeof(FileValidator).GetMethod(
            "CopyWithLimit", BindingFlags.NonPublic | BindingFlags.Static);
        Assert.NotNull(copyWithLimit);

        var exception = Assert.Throws<TargetInvocationException>(() => copyWithLimit.Invoke(
            null, [new MemoryStream([1, 2]), Stream.Null, 1L]));

        Assert.IsType<InvalidDataException>(exception.InnerException);
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

    public static IEnumerable<object[]> CompatibleIsoBmffBrands =>
    [
        ["video.mp4", "video/mp4", CreateIsoBmff("isom", "mp41")],
        ["video.mp4", "video/mp4", CreateIsoBmff("iso2", "mp42")],
        ["video.mp4", "video/mp4", CreateIsoBmff("avc1")],
        ["video.mp4", "video/mp4", CreateIsoBmff("M4V ")],
        ["audio.m4a", "audio/mp4", CreateIsoBmff("M4B ")]
    ];

    [Theory]
    [MemberData(nameof(CompatibleIsoBmffBrands))]
    public async Task ValidateAsync_AcceptsCompatibleIsoBmffBrands(string fileName, string contentType, byte[] content)
    {
        await _validator.ValidateAsync(CreateFormFile(fileName, contentType, new MemoryStream(content), content.Length));
    }

    [Fact]
    public async Task ValidateAsync_AcceptsExtendedAndToEndIsoBmffBoxes()
    {
        var content = CreateExtendedIsoBmff("isom");
        await _validator.ValidateAsync(CreateFormFile(
            "video.mp4", "video/mp4", new MemoryStream(content), content.Length));
    }

    [Fact]
    public async Task ValidateAsync_AcceptsFiniteWebMSegmentAndUnknownSizeCluster()
    {
        var content = CreateWebM(unknownSegmentSize: false, unknownClusterSize: true);
        await _validator.ValidateAsync(CreateFormFile(
            "video.webm", "video/webm", new MemoryStream(content), content.Length));
    }

    [Fact]
    public async Task ValidateAsync_RejectsInvalidWebMDocumentTypeAndUnknownHeaderSize()
    {
        var invalidUnknownSize = CreateWebM();
        invalidUnknownSize[4] = 0xFF;
        var contents = new[] { CreateWebM(documentType: "matroska"), invalidUnknownSize };

        foreach (var content in contents)
        {
            await Assert.ThrowsAsync<BadRequestException>(() => _validator.ValidateAsync(CreateFormFile(
                "video.webm", "video/webm", new MemoryStream(content), content.Length)));
        }
    }

    [Fact]
    public async Task ValidateAsync_RejectsMalformedWebMHeadersSegmentsAndElements()
    {
        var invalidFiles = new List<byte[]>();

        var invalidMagic = CreateWebM();
        invalidMagic[0] = 0;
        invalidFiles.Add(invalidMagic);

        var oversizedHeader = CreateWebM();
        oversizedHeader[4] = 0xFE;
        invalidFiles.Add(oversizedHeader);

        var invalidHeaderId = CreateWebM();
        invalidHeaderId[5] = 0;
        invalidFiles.Add(invalidHeaderId);

        var nonDocTypeHeaderElement = CreateWebM();
        nonDocTypeHeaderElement[6] = 0x81;
        invalidFiles.Add(nonDocTypeHeaderElement);

        var tooLongIdentifier = CreateWebM();
        tooLongIdentifier[5] = 0x08;
        invalidFiles.Add(tooLongIdentifier);

        var unknownDocTypeSize = CreateWebM();
        unknownDocTypeSize[7] = 0xFF;
        invalidFiles.Add(unknownDocTypeSize);

        var invalidSegmentId = CreateWebM();
        invalidSegmentId[12] = 0;
        invalidFiles.Add(invalidSegmentId);

        var oversizedSegment = CreateWebM(unknownSegmentSize: false);
        oversizedSegment[16] = 0x94;
        invalidFiles.Add(oversizedSegment);

        var invalidElementId = CreateWebM();
        invalidElementId[17] = 0;
        invalidFiles.Add(invalidElementId);

        var unknownNonClusterElementSize = CreateWebM();
        unknownNonClusterElementSize[21] = 0xFF;
        invalidFiles.Add(unknownNonClusterElementSize);

        var oversizedElement = CreateWebM();
        oversizedElement[21] = 0xFE;
        invalidFiles.Add(oversizedElement);

        var truncatedSize = CreateWebM(unknownSegmentSize: false);
        truncatedSize = truncatedSize[..^6].Concat(new byte[] { 0xEC, 0x01, 0 }).ToArray();
        truncatedSize[16] = 0x8E;
        invalidFiles.Add(truncatedSize);

        foreach (var content in invalidFiles)
        {
            await Assert.ThrowsAsync<BadRequestException>(() => _validator.ValidateAsync(CreateFormFile(
                "video.webm", "video/webm", new MemoryStream(content), content.Length)));
        }
    }

    [Fact]
    public async Task ValidateAsync_RejectsIsoBmffWithUnsupportedBrand()
    {
        var content = CreateIsoBmff("xxxx");
        await Assert.ThrowsAsync<BadRequestException>(() => _validator.ValidateAsync(CreateFormFile(
            "video.mp4", "video/mp4", new MemoryStream(content), content.Length)));
    }

    [Fact]
    public async Task ValidateAsync_RejectsMalformedIsoBmffBoxesAndMissingRequiredBoxes()
    {
        var shortFile = new byte[23];
        var undersizedBox = new byte[24];
        BinaryPrimitives.WriteUInt32BigEndian(undersizedBox, 7);
        Encoding.ASCII.GetBytes("free").CopyTo(undersizedBox, 4);
        var oversizedBox = new byte[24];
        BinaryPrimitives.WriteUInt32BigEndian(oversizedBox, 100);
        Encoding.ASCII.GetBytes("free").CopyTo(oversizedBox, 4);
        var truncatedExtendedHeader = new byte[24];
        BinaryPrimitives.WriteUInt32BigEndian(truncatedExtendedHeader, 1);
        Encoding.ASCII.GetBytes("free").CopyTo(truncatedExtendedHeader, 4);
        var badExtendedSize = new byte[24];
        BinaryPrimitives.WriteUInt32BigEndian(badExtendedSize, 1);
        Encoding.ASCII.GetBytes("free").CopyTo(badExtendedSize, 4);
        BinaryPrimitives.WriteUInt64BigEndian(badExtendedSize.AsSpan(8), 8);

        var shortFtyp = new byte[30];
        WriteBox(shortFtyp, "ftyp", Encoding.ASCII.GetBytes("isom"));
        var unalignedFtyp = new byte[31];
        WriteBox(unalignedFtyp, "ftyp", Encoding.ASCII.GetBytes("isom" + "\0\0\0\0" + "x"));

        using var duplicateStream = new MemoryStream();
        WriteBox(duplicateStream, "ftyp", Encoding.ASCII.GetBytes("isom\0\0\0\0"));
        WriteBox(duplicateStream, "ftyp", Encoding.ASCII.GetBytes("isom\0\0\0\0"));
        WriteBox(duplicateStream, "mdat", [1]);
        WriteBox(duplicateStream, "moov", [1]);

        using var noMediaStream = new MemoryStream();
        WriteBox(noMediaStream, "ftyp", Encoding.ASCII.GetBytes("isom\0\0\0\0"));
        WriteBox(noMediaStream, "mdat", []);
        WriteBox(noMediaStream, "moov", [1]);

        using var noMovieStream = new MemoryStream();
        WriteBox(noMovieStream, "ftyp", Encoding.ASCII.GetBytes("isom\0\0\0\0"));
        WriteBox(noMovieStream, "mdat", [1]);
        WriteBox(noMovieStream, "moov", []);

        var malformedFiles = new[]
        {
            shortFile, undersizedBox, oversizedBox, truncatedExtendedHeader, badExtendedSize,
            shortFtyp, unalignedFtyp, duplicateStream.ToArray(), noMediaStream.ToArray(), noMovieStream.ToArray()
        };

        foreach (var content in malformedFiles)
        {
            await Assert.ThrowsAsync<BadRequestException>(() => _validator.ValidateAsync(CreateFormFile(
                "video.mp4", "video/mp4", new MemoryStream(content), content.Length)));
        }
    }

    [Fact]
    public async Task ValidateAsync_RejectsExtendedIsoBmffHeaderAtEndAndMissingFtyp()
    {
        using var truncatedExtended = new MemoryStream();
        WriteBox(truncatedExtended, "free", [1]);
        truncatedExtended.Write([0, 0, 0, 1]);
        truncatedExtended.Write(Encoding.ASCII.GetBytes("free"));
        truncatedExtended.Write(new byte[7]);

        using var missingFtyp = new MemoryStream();
        WriteBox(missingFtyp, "free", [1]);
        WriteBox(missingFtyp, "mdat", [1]);
        WriteBox(missingFtyp, "moov", [1]);

        foreach (var content in new[] { truncatedExtended.ToArray(), missingFtyp.ToArray() })
        {
            await Assert.ThrowsAsync<BadRequestException>(() => _validator.ValidateAsync(CreateFormFile(
                "video.mp4", "video/mp4", new MemoryStream(content), content.Length)));
        }
    }

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

    [Theory]
    [MemberData(nameof(ValidJpegScanVariants))]
    public async Task ValidateAsync_AcceptsJpegMarkerAndScanVariants(byte[] content)
    {
        await _validator.ValidateAsync(CreateFormFile(
            "image.jpg", "image/jpeg", new MemoryStream(content), content.Length));
    }

    public static IEnumerable<object[]> ValidJpegScanVariants =>
    [
        [CreateJpeg(beforeFrame: [0xFF, 0x01])],
        [CreateJpeg(beforeFrame: [0xFF, 0xFF, 0x01])],
        [CreateJpeg(beforeFrame: [0xFF, 0xC4, 0, 2])],
        [CreateJpeg(beforeFrame: [0xFF, 0xC8, 0, 2])],
        [CreateJpeg(beforeFrame: [0xFF, 0xCC, 0, 2])],
        [CreateJpeg(scanData: [0x01, 0xFF, 0x00, 0x02])],
        [CreateJpeg(scanData: [0x01, 0xFF, 0xD0, 0x02])],
        [CreateJpeg(scanData: [0x01, 0xFF, 0xFF, 0xD7, 0x02])]
    ];

    [Theory]
    [MemberData(nameof(InvalidJpegSegments))]
    public async Task ValidateAsync_RejectsMalformedJpegMarkersAndSegments(byte[] content)
    {
        await Assert.ThrowsAsync<BadRequestException>(() => _validator.ValidateAsync(CreateFormFile(
            "image.jpg", "image/jpeg", new MemoryStream(content), content.Length)));
    }

    public static IEnumerable<object[]> InvalidJpegSegments =>
    [
        [new byte[] { 0xFF, 0xD8, 0xFF, 0xD9 }],
        [new byte[] { 0xFF, 0xD8, 0xFF, 0xFE, 0, 6, 1, 2, 3, 4, 0xFF, 0xD9 }],
        [new byte[] { 0xFF, 0xD8, 0xFF, 0xFE, 0, 12, 1, 2, 3, 4, 5, 6, 7, 8, 0xFF, 0xD9 }],
        [CreateJpeg(beforeFrame: [0xFE, 0x00, 0x02])],
        [CreateJpeg(beforeFrame: [0xFF, 0xFE, 0x00, 0x01])],
        [CreateJpeg(beforeFrame: [0xFF, 0xFE, 0xFF, 0xFF])],
        [CreateJpeg(frame: [0xFF, 0xC0, 0x00, 0x0A, 0x08, 0, 1, 0, 1, 1, 1, 0x11])],
        [CreateJpeg(frame: [0xFF, 0xDA, 0, 7, 1, 1, 0, 0, 0x3F, 0])],
        [CreateJpeg(scan: [0xFF, 0xDA, 0, 7, 1, 1, 0, 0, 0x3F, 0])],
        [CreateJpeg(scan: [0xFF, 0xDA, 0, 8, 0, 1, 0, 0, 0x3F, 0])],
        [CreateJpeg(scan: [0xFF, 0xDA, 0, 8, 2, 1, 0, 0, 0x3F, 0])],
        [CreateJpeg(beforeFrame: [0x01])],
        [CreateJpeg(beforeFrame: [0xFF, 0xD8])],
        [CreateJpeg(beforeFrame: [0xFF, 0xD0])],
        [CreateJpeg(frame: [0xFF, 0xE0, 0x00, 0x01])],
        [CreateJpeg(frame: [0xFF, 0xC0, 0x00, 0x0A, 0x08, 0, 1, 0, 1, 1, 1, 0x11, 0])],
        [CreateJpeg(frame: [0xFF, 0xC0, 0x00, 0x0B, 0x08, 0, 1, 0, 0, 1, 1, 0x11, 0])],
        [CreateJpeg(frame: [0xFF, 0xC0, 0x00, 0x0B, 0x08, 0, 1, 0, 1, 0, 1, 0x11, 0])],
        [CreateJpeg(frame: [0xFF, 0xC0, 0x00, 0x0B, 0x08, 0, 1, 0, 1, 1, 1, 0x11, 0], scan: [0xFF, 0xDA, 0, 7, 1, 1, 0, 0, 0x3F, 0])],
        [CreateJpeg(frame: [], scanData: [])],
        [CreateJpeg(scan: [0xFF, 0xDA, 0, 7, 0, 1, 0, 0, 0x3F, 0])],
        [CreateJpeg(scanData: [])],
        [CreateJpeg(scanData: [0x01, 0xFF, 0xD9])]
    ];

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
    public async Task ValidateAsync_NormalizesLeadingSlashInOfficeRelationshipTarget()
    {
        var bytes = CreateOfficePackage(
            "word/document.xml",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml",
            relationshipTarget: "/word/document.xml");

        await _validator.ValidateAsync(CreateFormFile(
            "document.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            new MemoryStream(bytes), bytes.Length));
    }

    [Fact]
    public async Task ValidateAsync_RejectsOfficePackagesWithInvalidXmlOrUnnormalizedTarget()
    {
        var invalidPackages = new[]
        {
            CreateOfficePackage(
                "word/document.xml",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml",
                relationshipTarget: "../word/document.xml"),
            CreateOfficePackage(
                "word/document.xml",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml",
                mainXml: "<document")
        };

        foreach (var bytes in invalidPackages)
        {
            await Assert.ThrowsAsync<BadRequestException>(() => _validator.ValidateAsync(CreateFormFile(
                "document.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                new MemoryStream(bytes), bytes.Length)));
        }
    }

    [Fact]
    public async Task ValidateAsync_RejectsOfficePackagesWithMissingPartsOrInvalidMetadata()
    {
        var mainPart = "word/document.xml";
        var mainType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml";
        var missingParts = new[]
        {
            CreateZip(("_rels/.rels", "<Relationships />"), (mainPart, "<document />")),
            CreateZip(("[Content_Types].xml", "<Types />"), (mainPart, "<document />")),
            CreateZip(("[Content_Types].xml", "<Types />"), ("_rels/.rels", "<Relationships />"))
        };
        var wrongContentType = CreateOfficePackage(
            mainPart, mainType,
            contentTypesXml: "<Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\"><Override PartName=\"/word/document.xml\" ContentType=\"wrong\" /></Types>");
        var wrongRelationshipType = CreateOfficePackage(
            mainPart, mainType,
            relationshipsXml: "<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\"><Relationship Type=\"wrong\" Target=\"word/document.xml\" /></Relationships>");
        var missingTarget = CreateOfficePackage(
            mainPart, mainType,
            relationshipsXml: "<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\"><Relationship Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument\" /></Relationships>");
        var wrongPartName = CreateOfficePackage(
            mainPart, mainType,
            contentTypesXml: "<Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\"><Override PartName=\"/other.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml\" /></Types>");
        var noContentTypesRoot = CreateOfficePackage(mainPart, mainType, contentTypesXml: "<!-- no root element -->");
        var noRelationshipsRoot = CreateOfficePackage(mainPart, mainType, relationshipsXml: "<!-- no root element -->");
        var mismatchedEntryLength = CreateOfficePackage(mainPart, mainType);
        SetZipEntryUncompressedLength(mismatchedEntryLength, mainPart, 10);
        var invalidPackages = missingParts.Concat([
            wrongContentType, wrongRelationshipType, missingTarget, wrongPartName,
            noContentTypesRoot, noRelationshipsRoot, mismatchedEntryLength
        ]);

        foreach (var bytes in invalidPackages)
        {
            await Assert.ThrowsAsync<BadRequestException>(() => _validator.ValidateAsync(CreateFormFile(
                "document.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                new MemoryStream(bytes), bytes.Length)));
        }
    }

    [Fact]
    public async Task ValidateAsync_RejectsOfficePackageWithDuplicateEntries()
    {
        var bytes = CreateZip(
            ("[Content_Types].xml", "<Types />"),
            ("_rels/.rels", "<Relationships />"),
            ("word/document.xml", "<document />"),
            ("word/document.xml", "<document />"));

        await Assert.ThrowsAsync<BadRequestException>(() => _validator.ValidateAsync(CreateFormFile(
            "document.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            new MemoryStream(bytes), bytes.Length)));
    }

    [Fact]
    public async Task ValidateAsync_RejectsOfficePackagesExceedingEntryAndExpandedSizeLimits()
    {
        var manyEntries = Enumerable.Range(0, 2049)
            .Select(index => ($"part-{index}.xml", "x"))
            .ToArray();
        var oversizedEntry = new string('x', 64 * 1024 * 1024 + 1);
        var oversizedArchive = CreateZip(("large.txt", oversizedEntry));

        foreach (var bytes in new[] { CreateZip(manyEntries), oversizedArchive })
        {
            await Assert.ThrowsAsync<BadRequestException>(() => _validator.ValidateAsync(CreateFormFile(
                "document.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                new MemoryStream(bytes), bytes.Length)));
        }
    }

    [Fact]
    public async Task ValidateAsync_RejectsOfficePackageWithOversizedXmlPart()
    {
        var mainPart = "word/document.xml";
        var mainType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml";
        var bytes = CreateOfficePackage(mainPart, mainType,
            mainXml: "<d>" + new string('x', 1024 * 1024) + "</d>");

        await Assert.ThrowsAsync<BadRequestException>(() => _validator.ValidateAsync(CreateFormFile(
            "document.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            new MemoryStream(bytes), bytes.Length)));
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
    [InlineData("name,notes\n\"unterminated\r")]
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
    public async Task ValidateAsync_RejectsWebpWithMissingOddChunkPadding()
    {
        var content = CreateWebP()[..^1];
        BinaryPrimitives.WriteUInt32LittleEndian(content.AsSpan(4), (uint)(content.Length - 8));
        await Assert.ThrowsAsync<BadRequestException>(() => _validator.ValidateAsync(CreateFormFile(
            "image.webp", "image/webp", new MemoryStream(content), content.Length)));
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
    public async Task ValidateAsync_RejectsMp3WithInvalidFrameHeadersAndLengths()
    {
        var invalidHeaders = new[]
        {
            0xFFE39064u, // MPEG reserved version
            0xFFF99064u, // reserved layer
            0xFFFB0064u, // free bitrate
            0xFFFBF064u, // invalid bitrate
            0xFFFB9C64u  // invalid sample rate
        };

        foreach (var header in invalidHeaders)
        {
            var content = new byte[417];
            BinaryPrimitives.WriteUInt32BigEndian(content, header);
            await Assert.ThrowsAsync<BadRequestException>(() => _validator.ValidateAsync(CreateFormFile(
                "audio.mp3", "audio/mpeg", new MemoryStream(content), content.Length)));
        }

        var shortFrame = new byte[23];
        BinaryPrimitives.WriteUInt32BigEndian(shortFrame, 0xFFFB9064);
        await Assert.ThrowsAsync<BadRequestException>(() => _validator.ValidateAsync(CreateFormFile(
            "audio.mp3", "audio/mpeg", new MemoryStream(shortFrame), shortFrame.Length)));

        var oversizedTag = new byte[12];
        Encoding.ASCII.GetBytes("ID3").CopyTo(oversizedTag, 0);
        oversizedTag[9] = 10;
        await Assert.ThrowsAsync<BadRequestException>(() => _validator.ValidateAsync(CreateFormFile(
            "audio.mp3", "audio/mpeg", new MemoryStream(oversizedTag), oversizedTag.Length)));
    }

    [Fact]
    public async Task ValidateAsync_AcceptsMpeg2LayerThreeFrame()
    {
        var content = new byte[300];
        BinaryPrimitives.WriteUInt32BigEndian(content, 0xFFF39064);
        await _validator.ValidateAsync(CreateFormFile(
            "audio.mp3", "audio/mpeg", new MemoryStream(content), content.Length));
    }

    [Fact]
    public async Task ValidateAsync_RejectsWavWithInvalidFormatFields()
    {
        var content = CreateWav();
        BinaryPrimitives.WriteUInt16LittleEndian(content.AsSpan(22), 0);
        var file = CreateFormFile("audio.wav", "audio/wav", new MemoryStream(content), content.Length);

        await Assert.ThrowsAsync<BadRequestException>(() => _validator.ValidateAsync(file));
    }

    [Fact]
    public async Task ValidateAsync_RejectsWavWithFormatChunkShorterThanSixteenBytes()
    {
        var content = new byte[44];
        WriteWavHeader(content);
        Encoding.ASCII.GetBytes("fmt ").CopyTo(content, 12);
        BinaryPrimitives.WriteUInt32LittleEndian(content.AsSpan(16), 8);
        Encoding.ASCII.GetBytes("data").CopyTo(content, 28);
        BinaryPrimitives.WriteUInt32LittleEndian(content.AsSpan(32), 0);
        Encoding.ASCII.GetBytes("JUNK").CopyTo(content, 36);
        BinaryPrimitives.WriteUInt32LittleEndian(content.AsSpan(40), 0);

        await Assert.ThrowsAsync<BadRequestException>(() => _validator.ValidateAsync(CreateFormFile(
            "audio.wav", "audio/wav", new MemoryStream(content), content.Length)));
    }

    [Fact]
    public async Task ValidateAsync_RejectsWavWithMalformedChunksOrMissingAudio()
    {
        var malformedSize = CreateWav();
        BinaryPrimitives.WriteUInt32LittleEndian(malformedSize.AsSpan(40), uint.MaxValue);

        var shortFormat = new byte[38];
        WriteWavHeader(shortFormat);
        Encoding.ASCII.GetBytes("fmt ").CopyTo(shortFormat, 12);
        BinaryPrimitives.WriteUInt32LittleEndian(shortFormat.AsSpan(16), 8);

        var missingAudio = CreateWav();
        BinaryPrimitives.WriteUInt32LittleEndian(missingAudio.AsSpan(40), 0);
        BinaryPrimitives.WriteUInt32LittleEndian(missingAudio.AsSpan(4), (uint)(missingAudio.Length - 8));

        var missingFormat = new byte[46];
        WriteWavHeader(missingFormat);
        Encoding.ASCII.GetBytes("junk").CopyTo(missingFormat, 12);
        BinaryPrimitives.WriteUInt32LittleEndian(missingFormat.AsSpan(16), 26);

        foreach (var content in new[] { malformedSize, shortFormat, missingAudio, missingFormat })
        {
            await Assert.ThrowsAsync<BadRequestException>(() => _validator.ValidateAsync(CreateFormFile(
                "audio.wav", "audio/wav", new MemoryStream(content), content.Length)));
        }
    }

    [Fact]
    public async Task ValidateAsync_RejectsWavWithMissingOddChunkPadding()
    {
        var content = CreateWav()[..^1];
        BinaryPrimitives.WriteUInt32LittleEndian(content.AsSpan(4), (uint)(content.Length - 8));

        await Assert.ThrowsAsync<BadRequestException>(() => _validator.ValidateAsync(CreateFormFile(
            "audio.wav", "audio/wav", new MemoryStream(content), content.Length)));
    }

    [Theory]
    [InlineData("name,notes\n\"closed\"x,value")]
    [InlineData("name,notes\n\"line\ronly\",value")]
    [InlineData("name,notes\n\"closed\"\rvalue")]
    public async Task ValidateAsync_RejectsCsvCharactersAfterClosingQuoteOrBareCarriageReturn(string content)
    {
        await Assert.ThrowsAsync<BadRequestException>(() => _validator.ValidateAsync(
            CreateFile("records.csv", "text/csv", content)));
    }

    private static byte[] CreateJpeg(
        byte[]? beforeFrame = null,
        byte[]? frame = null,
        byte[]? scan = null,
        byte[]? scanData = null)
    {
        using var stream = new MemoryStream();
        stream.Write([0xFF, 0xD8]);
        stream.Write(beforeFrame ?? []);
        stream.Write(frame ?? [
            0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01, 0x11, 0x00
        ]);
        stream.Write(scan ?? [0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F, 0x00]);
        stream.Write(scanData ?? [0x01]);
        stream.Write([0xFF, 0xD9]);
        return stream.ToArray();
    }

    private static byte[] CreateWebP(params (string Type, byte[] Data)[] chunks)
    {
        using var stream = new MemoryStream();
        using var writer = new BinaryWriter(stream, Encoding.ASCII, leaveOpen: true);
        writer.Write(Encoding.ASCII.GetBytes("RIFF"));
        writer.Write(0U);
        writer.Write(Encoding.ASCII.GetBytes("WEBP"));
        foreach (var (type, data) in chunks.Length == 0 ? [("VP8 ", new byte[] { 0 })] : chunks)
        {
            writer.Write(Encoding.ASCII.GetBytes(type));
            writer.Write((uint)data.Length);
            writer.Write(data);
            if ((data.Length & 1) == 1)
            {
                writer.Write((byte)0);
            }
        }

        var bytes = stream.ToArray();
        BinaryPrimitives.WriteUInt32LittleEndian(bytes.AsSpan(4), (uint)(bytes.Length - 8));
        return bytes;
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

    private static void WriteWavHeader(byte[] content)
    {
        Encoding.ASCII.GetBytes("RIFF").CopyTo(content, 0);
        BinaryPrimitives.WriteUInt32LittleEndian(content.AsSpan(4), (uint)(content.Length - 8));
        Encoding.ASCII.GetBytes("WAVE").CopyTo(content, 8);
    }

    private static byte[] CreateIsoBmff(string brand, params string[] compatibleBrands)
    {
        using var stream = new MemoryStream();
        var compatibleBrandBytes = compatibleBrands.SelectMany(Encoding.ASCII.GetBytes).ToArray();
        WriteBox(stream, "ftyp", Encoding.ASCII.GetBytes(brand).Concat(new byte[4]).Concat(compatibleBrandBytes).ToArray());
        WriteBox(stream, "mdat", [0x01]);
        WriteBox(stream, "moov", [0x01]);
        return stream.ToArray();
    }

    private static byte[] CreateExtendedIsoBmff(string brand)
    {
        using var stream = new MemoryStream();
        WriteExtendedBox(stream, "ftyp", Encoding.ASCII.GetBytes(brand).Concat(new byte[4]).ToArray());
        WriteBox(stream, "moov", [0x01]);
        stream.Write([0, 0, 0, 0]);
        stream.Write(Encoding.ASCII.GetBytes("mdat"));
        stream.Write([0x01]);
        return stream.ToArray();
    }

    private static void WriteExtendedBox(Stream stream, string type, byte[] payload)
    {
        Span<byte> header = stackalloc byte[16];
        BinaryPrimitives.WriteUInt32BigEndian(header, 1);
        Encoding.ASCII.GetBytes(type).CopyTo(header[4..]);
        BinaryPrimitives.WriteUInt64BigEndian(header[8..], (ulong)(payload.Length + header.Length));
        stream.Write(header);
        stream.Write(payload);
    }

    private static void WriteBox(Stream stream, string type, byte[] payload)
    {
        Span<byte> size = stackalloc byte[4];
        BinaryPrimitives.WriteUInt32BigEndian(size, (uint)(payload.Length + 8));
        stream.Write(size);
        stream.Write(Encoding.ASCII.GetBytes(type));
        stream.Write(payload);
    }

    private static void WriteBox(byte[] destination, string type, byte[] payload)
    {
        BinaryPrimitives.WriteUInt32BigEndian(destination, (uint)(payload.Length + 8));
        Encoding.ASCII.GetBytes(type).CopyTo(destination, 4);
        payload.CopyTo(destination, 8);
    }

    private static byte[] CreateWebM(
        string documentType = "webm",
        bool unknownSegmentSize = true,
        bool unknownClusterSize = false)
    {
        using var stream = new MemoryStream();
        var docType = Encoding.ASCII.GetBytes(documentType);
        stream.Write([0x1A, 0x45, 0xDF, 0xA3, (byte)(0x80 | (docType.Length + 3)), 0x42, 0x82,
            (byte)(0x80 | docType.Length)]);
        stream.Write(docType);

        using var segment = new MemoryStream();
        WriteEbmlElement(segment, [0x15, 0x49, 0xA9, 0x66], [0]);
        WriteEbmlElement(segment, [0x16, 0x54, 0xAE, 0x6B], [0]);
        WriteEbmlElement(segment, [0x1F, 0x43, 0xB6, 0x75], [0], unknownClusterSize);

        stream.Write([0x18, 0x53, 0x80, 0x67]);
        stream.WriteByte(unknownSegmentSize ? (byte)0xFF : (byte)(0x80 | segment.Length));
        segment.Position = 0;
        segment.CopyTo(stream);
        return stream.ToArray();
    }

    private static void WriteEbmlElement(Stream stream, byte[] id, byte[] data, bool unknownSize = false)
    {
        stream.Write(id);
        stream.WriteByte(unknownSize ? (byte)0xFF : (byte)(0x80 | data.Length));
        stream.Write(data);
    }

    private static byte[] CreateOfficePackage(
        string mainPart,
        string mainContentType,
        string? targetMode = null,
        string? relationshipTarget = null,
        string mainXml = "<document />",
        string? contentTypesXml = null,
        string? relationshipsXml = null)
    {
        var contentTypes = contentTypesXml ?? $"""
            <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
              <Override PartName="/{mainPart}" ContentType="{mainContentType}" />
            </Types>
            """;
        var targetModeAttribute = targetMode is null ? string.Empty : $" TargetMode=\"{targetMode}\"";
        var relationships = relationshipsXml ?? $"""
            <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
              <Relationship Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="{relationshipTarget ?? mainPart}"{targetModeAttribute} />
            </Relationships>
            """;

        return CreateZip(
            ("[Content_Types].xml", contentTypes),
            ("_rels/.rels", relationships),
            (mainPart, mainXml));
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

    private static void SetZipEntryUncompressedLength(byte[] content, string entryName, uint length)
    {
        var entryNameBytes = Encoding.UTF8.GetBytes(entryName);
        for (var offset = 0; offset <= content.Length - 30; offset++)
        {
            if (!content.AsSpan(offset, 4).SequenceEqual(new byte[] { 0x50, 0x4B, 0x03, 0x04 }))
            {
                continue;
            }

            var nameLength = BinaryPrimitives.ReadUInt16LittleEndian(content.AsSpan(offset + 26));
            var extraLength = BinaryPrimitives.ReadUInt16LittleEndian(content.AsSpan(offset + 28));
            var nameStart = offset + 30;
            if (nameLength == entryNameBytes.Length &&
                content.AsSpan(nameStart, nameLength).SequenceEqual(entryNameBytes))
            {
                BinaryPrimitives.WriteUInt32LittleEndian(content.AsSpan(offset + 22), length);
                var centralStart = nameStart + nameLength + extraLength;
                while (centralStart <= content.Length - 46)
                {
                    if (content.AsSpan(centralStart, 4).SequenceEqual(new byte[] { 0x50, 0x4B, 0x01, 0x02 }))
                    {
                        var centralNameLength = BinaryPrimitives.ReadUInt16LittleEndian(content.AsSpan(centralStart + 28));
                        var centralExtraLength = BinaryPrimitives.ReadUInt16LittleEndian(content.AsSpan(centralStart + 30));
                        var centralCommentLength = BinaryPrimitives.ReadUInt16LittleEndian(content.AsSpan(centralStart + 32));
                        var centralNameStart = centralStart + 46;
                        if (centralNameLength == entryNameBytes.Length &&
                            content.AsSpan(centralNameStart, centralNameLength).SequenceEqual(entryNameBytes))
                        {
                            BinaryPrimitives.WriteUInt32LittleEndian(content.AsSpan(centralStart + 24), length);
                            return;
                        }

                        centralStart += 46 + centralNameLength + centralExtraLength + centralCommentLength;
                        continue;
                    }

                    centralStart++;
                }
            }
        }

        throw new InvalidOperationException($"ZIP entry '{entryName}' was not found.");
    }

    private static byte[] CreatePng(
        byte colorType = 6,
        byte bitDepth = 8,
        (string Type, byte[] Data)[]? beforeImageData = null,
        (string Type, byte[] Data)[]? afterImageData = null,
        byte[]? headerData = null,
        string headerType = "IHDR",
        bool includeDefaultPalette = true)
    {
        using var stream = new MemoryStream();
        stream.Write([137, 80, 78, 71, 13, 10, 26, 10]);

        var header = headerData ?? CreatePngHeader(colorType, bitDepth);
        WritePngChunk(stream, headerType, header);

        if (colorType == 3 && includeDefaultPalette)
        {
            WritePngChunk(stream, "PLTE", [0, 0, 0]);
        }

        foreach (var (type, data) in beforeImageData ?? [])
        {
            WritePngChunk(stream, type, data);
        }

        using var compressed = new MemoryStream();
        using (var zlib = new ZLibStream(compressed, CompressionLevel.Optimal, leaveOpen: true))
        {
            var bitsPerPixel = colorType switch
            {
                0 or 3 => bitDepth,
                2 => bitDepth * 3,
                4 => bitDepth * 2,
                6 => bitDepth * 4,
                _ => 8
            };
            zlib.Write(new byte[1 + (bitsPerPixel + 7) / 8]);
        }

        WritePngChunk(stream, "IDAT", compressed.ToArray());
        foreach (var (type, data) in afterImageData ?? [])
        {
            WritePngChunk(stream, type, data);
        }

        WritePngChunk(stream, "IEND", []);
        return stream.ToArray();
    }

    private static byte[] CreatePngHeader(byte colorType = 6, byte bitDepth = 8)
    {
        var header = new byte[13];
        BinaryPrimitives.WriteUInt32BigEndian(header, 1);
        BinaryPrimitives.WriteUInt32BigEndian(header.AsSpan(4), 1);
        header[8] = bitDepth;
        header[9] = colorType;
        return header;
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
