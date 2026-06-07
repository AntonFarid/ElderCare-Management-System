using SmartElderlyCare.Application.DTOs.Common;
using SmartElderlyCare.Application.DTOs.Elderly;
using SmartElderlyCare.Application.DTOs.User;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SmartElderlyCare.Application.DTOs.DailyReport;

/// <summary>
/// Basic daily report DTO
/// </summary>
public class DailyReportDto : BaseDto
{
    public int EmployeeId { get; set; }
    public string EmployeeName { get; set; } = string.Empty;
    public int ElderlyId { get; set; }
    public string ElderlyName { get; set; } = string.Empty;
    public DateTime ReportDate { get; set; }
    public DateTime SubmissionDate { get; set; }
    public string ApprovalStatus { get; set; } = string.Empty;
    public int? ApprovedById { get; set; }
    public string? ApprovedByName { get; set; }
    public string? ApprovedByRole { get; set; }
    public DateTime? ApprovedDate { get; set; }
    public string? RejectionReason { get; set; }
    public string AdditionalNotes { get; set; } = string.Empty;
    public string AiGeneratedReport { get; set; } = string.Empty;
    public List<HealthMetricDto> HealthMetrics { get; set; } = new();
}

/// <summary>
/// Detailed daily report DTO
/// </summary>
public class DailyReportDetailDto : DailyReportDto
{
    public string StructuredData { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

/// <summary>
/// Health metric DTO
/// </summary>
public class HealthMetricDto
{
    public int Id { get; set; }
    public string MetricType { get; set; } = string.Empty;
    public string MetricName { get; set; } = string.Empty;
    public string MetricValue { get; set; } = string.Empty;
    public string? Unit { get; set; }
    public string? Notes { get; set; }
    public TimeSpan RecordedTime { get; set; }
}

/// <summary>
/// Create health metric DTO (for employee input)
/// </summary>
public class CreateHealthMetricDto
{
    [Required(ErrorMessage = "Metric type is required")]
    public string MetricType { get; set; } = string.Empty;

    [Required(ErrorMessage = "Metric name is required")]
    public string MetricName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Metric value is required")]
    public string MetricValue { get; set; } = string.Empty;

    public string? Unit { get; set; }
    public string? Notes { get; set; }

    [Required(ErrorMessage = "Recorded time is required")]
    public TimeSpan RecordedTime { get; set; }
}

/// <summary>
/// Create daily report DTO (employee submission)
/// </summary>
public class CreateDailyReportDto
{
    [Required(ErrorMessage = "Elderly ID is required")]
    public int ElderlyId { get; set; }

    [Required(ErrorMessage = "Report date is required")]
    public DateTime ReportDate { get; set; }

    [Required(ErrorMessage = "Health metrics are required")]
    [MinLength(1, ErrorMessage = "At least one health metric is required")]
    public List<CreateHealthMetricDto> HealthMetrics { get; set; } = new();

    public string? AdditionalNotes { get; set; }
}

/// <summary>
/// Approve report DTO (team leader action)
/// </summary>
public class ApproveReportDto
{
    [Required(ErrorMessage = "Report ID is required")]
    public int ReportId { get; set; }

    public string? Comments { get; set; }
}

/// <summary>
/// Reject report DTO (team leader action)
/// </summary>
public class RejectReportDto
{
    [Required(ErrorMessage = "Report ID is required")]
    public int ReportId { get; set; }

    [Required(ErrorMessage = "Rejection reason is required")]
    [StringLength(500, MinimumLength = 10, ErrorMessage = "Rejection reason must be between 10 and 500 characters")]
    public string RejectionReason { get; set; } = string.Empty;
}

/// <summary>
/// Report approval history DTO
/// </summary>
public class ReportApprovalHistoryDto
{
    public int ReportId { get; set; }
    public string ReportDate { get; set; } = string.Empty;
    public string ElderlyName { get; set; } = string.Empty;
    public string EmployeeName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? ApprovedBy { get; set; }
    public DateTime? ApprovedDate { get; set; }
    public string? RejectionReason { get; set; }
}

/// <summary>
/// Report summary DTO for dashboards
/// </summary>
public class ReportSummaryDto
{
    public int TotalReports { get; set; }
    public int PendingReports { get; set; }
    public int ApprovedReports { get; set; }
    public int RejectedReports { get; set; }
    public double ApprovalRate { get; set; }
    public List<ReportApprovalHistoryDto> RecentReports { get; set; } = new();
}