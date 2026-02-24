using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations;

namespace SmartElderlyCare.Application.DTOs.Visit;

/// <summary>
/// Approve visit request DTO
/// </summary>
public class ApproveVisitDto
{
    [Required(ErrorMessage = "Visit ID is required")]
    public int VisitId { get; set; }

    [StringLength(500, ErrorMessage = "Comments cannot exceed 500 characters")]
    public string? Comments { get; set; }
}

/// <summary>
/// Reject visit request DTO
/// </summary>
public class RejectVisitDto
{
    [Required(ErrorMessage = "Visit ID is required")]
    public int VisitId { get; set; }

    [Required(ErrorMessage = "Rejection reason is required")]
    [StringLength(500, MinimumLength = 10, ErrorMessage = "Rejection reason must be between 10 and 500 characters")]
    public string RejectionReason { get; set; } = string.Empty;
}

/// <summary>
/// Visit summary DTO for team leader dashboard
/// </summary>
public class VisitSummaryDto
{
    public int TotalPending { get; set; }
    public int ApprovedToday { get; set; }
    public int RejectedToday { get; set; }
    public int UpcomingVisits { get; set; }
    public List<VisitRequestDto> RecentRequests { get; set; } = new();
}

/// <summary>
/// Visit request details DTO for team leader review
/// </summary>
public class VisitRequestDetailsDto : VisitRequestDto
{
    public string FamilyMemberEmail { get; set; } = string.Empty;
    public string FamilyMemberPhone { get; set; } = string.Empty;
    public int TotalVisitsByFamily { get; set; }
    public List<PastVisitDto> PastVisits { get; set; } = new();
}

/// <summary>
/// Past visit DTO for reference
/// </summary>
public class PastVisitDto
{
    public int VisitId { get; set; }
    public DateTime VisitDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Notes { get; set; }
}