using Azure;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using WinCapture.Exceptions;

namespace WinCapture.Services;

public sealed class AzureBlobStorageService(
    BlobContainerClient containerClient,
    ILogger<AzureBlobStorageService> logger) : IStorageService
{
    public async Task<string> SaveAsync(IFormFile file)
    {
        if (file is null)
        {
            throw new StorageException(
                "The file could not be stored in Azure Blob Storage.",
                new ArgumentNullException(nameof(file)));
        }

        var extension = Path.GetExtension(file.FileName);
        var storedFileName = $"{Guid.NewGuid():N}{extension}";
        var blobClient = containerClient.GetBlobClient(storedFileName);

        try
        {
            await using var stream = file.OpenReadStream();

            await blobClient.UploadAsync(
                stream,
                new BlobUploadOptions
                {
                    HttpHeaders = new BlobHttpHeaders
                    {
                        ContentType = file.ContentType
                    }
                });

            return storedFileName;
        }
        catch (RequestFailedException exception)
        {
            logger.LogError(
                exception,
                "Failed to store file in Azure Blob Storage. StoredFileName: {StoredFileName}",
                storedFileName);

            throw new StorageException(
                "The file could not be stored in Azure Blob Storage.",
                exception);
        }
    }

    public async Task DeleteAsync(string storedFileName)
    {
        try
        {
            await containerClient.DeleteBlobIfExistsAsync(storedFileName);
        }
        catch (RequestFailedException exception)
        {
            logger.LogError(
                exception,
                "Failed to delete file from Azure Blob Storage. StoredFileName: {StoredFileName}",
                storedFileName);

            throw new StorageException(
                "The file could not be deleted from Azure Blob Storage.",
                exception);
        }
    }

    public async Task<Stream> GetAsync(string storedFileName)
    {
        try
        {
            var response = await containerClient
                .GetBlobClient(storedFileName)
                .DownloadStreamingAsync();

            return response.Value.Content;
        }
        catch (RequestFailedException exception)
            when (exception.Status == StatusCodes.Status404NotFound)
        {
            logger.LogError(
                exception,
                "Metadata points to a missing Blob. StoredFileName: {StoredFileName}",
                storedFileName);

            throw new NotFoundException("The requested file was not found in storage.");
        }
        catch (RequestFailedException exception)
        {
            logger.LogError(
                exception,
                "Failed to read file from Azure Blob Storage. StoredFileName: {StoredFileName}",
                storedFileName);

            throw new StorageException(
                "The file could not be read from Azure Blob Storage.",
                exception);
        }
    }
}