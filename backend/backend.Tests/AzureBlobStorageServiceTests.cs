using Azure;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Moq;
using WinCapture.Exceptions;
using WinCapture.Services;
using Xunit;

namespace WinCapture.Tests;

public sealed class AzureBlobStorageServiceTests
{
    private readonly Mock<BlobContainerClient> _container = new();
    private readonly AzureBlobStorageService _service;

    public AzureBlobStorageServiceTests()
    {
        _service = new AzureBlobStorageService(
            _container.Object,
            Mock.Of<ILogger<AzureBlobStorageService>>());
    }

    [Fact]
    public async Task SaveAsync_RejectsNullFile()
    {
        var exception = await Assert.ThrowsAsync<StorageException>(
            () => _service.SaveAsync(null!));

        Assert.IsType<ArgumentNullException>(exception.InnerException);
        _container.Verify(client => client.GetBlobClient(It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task SaveAsync_ConvertsAzureUploadFailureToStorageException()
    {
        var blob = new Mock<BlobClient>();
        _container.Setup(client => client.GetBlobClient(It.IsAny<string>()))
            .Returns(blob.Object);
        blob.Setup(client => client.UploadAsync(
                It.IsAny<Stream>(),
                It.IsAny<BlobUploadOptions>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new RequestFailedException(500, "upload failed"));

        var exception = await Assert.ThrowsAsync<StorageException>(
            () => _service.SaveAsync(CreateFormFile()));

        Assert.IsType<RequestFailedException>(exception.InnerException);
        _container.Verify(client => client.GetBlobClient(It.Is<string>(name =>
            name.EndsWith(".txt", StringComparison.Ordinal))), Times.Once);
    }

    [Fact]
    public async Task DeleteAsync_ConvertsAzureFailureToStorageException()
    {
        _container.Setup(client => client.DeleteBlobIfExistsAsync(
                "stored.txt",
                It.IsAny<DeleteSnapshotsOption>(),
                It.IsAny<BlobRequestConditions>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new RequestFailedException(500, "delete failed"));

        var exception = await Assert.ThrowsAsync<StorageException>(
            () => _service.DeleteAsync("stored.txt"));

        Assert.IsType<RequestFailedException>(exception.InnerException);
    }

    [Fact]
    public async Task GetAsync_MapsMissingBlobToNotFound()
    {
        var blob = new Mock<BlobClient>();
        _container.Setup(client => client.GetBlobClient("missing.txt"))
            .Returns(blob.Object);
        blob.Setup(client => client.DownloadStreamingAsync(
                It.IsAny<BlobDownloadOptions>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new RequestFailedException(404, "missing"));

        await Assert.ThrowsAsync<NotFoundException>(
            () => _service.GetAsync("missing.txt"));
    }

    [Fact]
    public async Task GetAsync_ConvertsOtherAzureFailuresToStorageException()
    {
        var blob = new Mock<BlobClient>();
        _container.Setup(client => client.GetBlobClient("unavailable.txt"))
            .Returns(blob.Object);
        blob.Setup(client => client.DownloadStreamingAsync(
                It.IsAny<BlobDownloadOptions>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new RequestFailedException(503, "unavailable"));

        var exception = await Assert.ThrowsAsync<StorageException>(
            () => _service.GetAsync("unavailable.txt"));

        Assert.IsType<RequestFailedException>(exception.InnerException);
    }

    private static FormFile CreateFormFile()
    {
        var content = new byte[] { 1, 2, 3 };
        return new FormFile(new MemoryStream(content), 0, content.Length, "file", "original.txt")
        {
            Headers = new HeaderDictionary(),
            ContentType = "text/plain"
        };
    }
}
