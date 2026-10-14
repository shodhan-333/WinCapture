using Microsoft.EntityFrameworkCore;
using WinCapture.DTOs.Common;

namespace WinCapture.Repositories;

internal static class PaginationExtensions
{
    public static async Task<PagedResponse<T>> ToPagedResponseAsync<T>(
        this IQueryable<T> query,
        PaginationQuery pagination)
    {
        var totalItems = await query.CountAsync();
        var pageCount = Math.Max(1, (int)Math.Ceiling(totalItems / (double)pagination.PageSize));
        var page = Math.Clamp(pagination.Page, 1, pageCount);
        var items = await query
            .Skip((int)Math.Min((long)(page - 1) * pagination.PageSize, int.MaxValue))
            .Take(pagination.PageSize)
            .ToListAsync();

        return new PagedResponse<T>(items, totalItems, page, pagination.PageSize, pageCount);
    }
}
