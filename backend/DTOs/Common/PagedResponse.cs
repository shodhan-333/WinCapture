namespace WinCapture.DTOs.Common;

public sealed record PagedResponse<T>(
    IReadOnlyList<T> Items,
    int TotalItems,
    int Page,
    int PageSize,
    int PageCount);
