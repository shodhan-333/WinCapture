using System.Linq.Expressions;
using WinCapture.DTOs.Common;
using WinCapture.Models;

namespace WinCapture.Repositories;

internal static class FileQueryExtensions
{
    private static readonly string[][] CategoryExtensions =
    [
        [".jpg", ".jpeg", ".png", ".webp"],
        [".pdf", ".txt", ".csv", ".docx", ".xlsx", ".pptx"],
        [".mp4", ".mov", ".webm"],
        [".mp3", ".wav", ".m4a"],
        [".zip"]
    ];

    private static readonly string[] CategoryNames =
        ["Images", "Documents", "Videos", "Audio", "Archives"];

    public static IQueryable<FileMetadata> ApplyFileFilters(
        this IQueryable<FileMetadata> query,
        PaginationQuery pagination)
    {
        var search = pagination.Search?.Trim();
        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(file =>
                file.OriginalFileName.Contains(search) ||
                file.ContentType.Contains(search) ||
                file.Id.ToString().Contains(search));
        }

        if (!string.IsNullOrEmpty(pagination.Category) && pagination.Category != "All")
        {
            var categoryIndex = Array.IndexOf(CategoryNames, pagination.Category);
            if (categoryIndex >= 0)
            {
                query = ApplyCategory(query, CategoryExtensions[categoryIndex]);
            }
        }

        return query;
    }

    public static IQueryable<FileMetadata> ApplyFileCategory(
        this IQueryable<FileMetadata> query,
        PaginationQuery pagination)
    {
        if (!string.IsNullOrEmpty(pagination.Category) && pagination.Category != "All")
        {
            var categoryIndex = Array.IndexOf(CategoryNames, pagination.Category);
            if (categoryIndex >= 0)
            {
                query = ApplyCategory(query, CategoryExtensions[categoryIndex]);
            }
        }

        return query;
    }

    public static Expression<Func<FileMetadata, int>> FileSearchRank(string? search) =>
        file => string.IsNullOrEmpty(search) ? 0 :
            file.OriginalFileName == search ? 0 :
            file.OriginalFileName.StartsWith(search) ? 1 :
            file.OriginalFileName.Contains(search) ? 2 :
            file.ContentType.Contains(search) ? 3 :
            file.Id.ToString().Contains(search) ? 4 :
            file.User.Name.Contains(search) ? 5 :
            (file.Album != null && file.Album.AlbumName.Contains(search)) ? 6 : 7;

    private static IQueryable<FileMetadata> ApplyCategory(
        IQueryable<FileMetadata> query,
        string[] extensions)
    {
        var file = Expression.Parameter(typeof(FileMetadata), "file");
        var fileName = Expression.Property(file, nameof(FileMetadata.OriginalFileName));
        var endsWith = typeof(string).GetMethod(nameof(string.EndsWith), [typeof(string)])!;
        Expression? categoryMatch = null;

        foreach (var extension in extensions)
        {
            var match = Expression.Call(fileName, endsWith, Expression.Constant(extension));
            categoryMatch = categoryMatch is null
                ? match
                : Expression.OrElse(categoryMatch, match);
        }

        return query.Where(Expression.Lambda<Func<FileMetadata, bool>>(categoryMatch!, file));
    }
}
