using System.ComponentModel.DataAnnotations;

namespace WinCapture.DTOs.Common;

public sealed class PaginationQuery
{
    [Range(1, int.MaxValue)]
    public int Page { get; set; } = 1;

    [Range(1, 100)]
    public int PageSize { get; set; } = 10;

    public string? Search { get; set; }

    [RegularExpression("^(All|Images|Documents|Videos|Audio|Archives)$")]
    public string? Category { get; set; }

    public int Offset => (int)Math.Min((long)(Page - 1) * PageSize, int.MaxValue);
}
