using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
namespace SmartElderlyCare.Application.DTOs.Common;

/// <summary>
/// Pagination parameters for list endpoints
/// </summary>
public class PaginationParameters
{
    private const int MaxPageSize = 1000;
    private int _pageSize = 10;

    public int PageNumber { get; set; } = 1;

    public int PageSize
    {
        get => _pageSize;
        set => _pageSize = value > MaxPageSize ? MaxPageSize : value;
    }

    public string? SortBy { get; set; }
    public bool SortDescending { get; set; }
}

/// <summary>
/// Filter parameters for daily reports
/// </summary>
public class ReportFilterParameters : PaginationParameters
{
    public int? ElderlyId { get; set; }
    public int? EmployeeId { get; set; }
    public string? Status { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
}

/// <summary>
/// Filter parameters for elderly residents
/// </summary>
public class ElderlyFilterParameters : PaginationParameters
{
    public string? SearchTerm { get; set; }
    public bool? IsActive { get; set; }
    public int? AssignedEmployeeId { get; set; }
    public string? RoomNumber { get; set; }
}

/// <summary>
/// Filter parameters for users
/// </summary>
public class UserFilterParameters : PaginationParameters
{
    public string? SearchTerm { get; set; }
    public string? UserType { get; set; }
    public bool? IsActive { get; set; }
    public string? Role { get; set; }
}

/// <summary>
/// Filter parameters for visits
/// </summary>
public class AdminVisitFilterParameters : PaginationParameters
{
    public int? ElderlyId { get; set; }
    public int? FamilyMemberId { get; set; }
    public string? Status { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
}

/// <summary>
/// Metadata for paginated responses
/// </summary>
public class PaginationMetadata
{
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
    public int TotalCount { get; set; }
    public int TotalPages { get; set; }
    public bool HasPreviousPage => PageNumber > 1;
    public bool HasNextPage => PageNumber < TotalPages;
}