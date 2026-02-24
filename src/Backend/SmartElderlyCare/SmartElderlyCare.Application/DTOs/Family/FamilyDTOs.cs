using SmartElderlyCare.Application.DTOs.Common;
using SmartElderlyCare.Application.DTOs.DailyReport;
using SmartElderlyCare.Application.DTOs.Elderly;
using SmartElderlyCare.Application.DTOs.Notification;
using SmartElderlyCare.Application.DTOs.Visit;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SmartElderlyCare.Application.DTOs.Family;

/// <summary>
/// Health trends DTO for family dashboard
/// </summary>
public class HealthTrendsDto
{
    public int ElderlyId { get; set; }
    public string ElderlyName { get; set; } = string.Empty;
    public DateTime FromDate { get; set; }
    public DateTime ToDate { get; set; }

    // Summary statistics
    public int TotalReports { get; set; }
    public double AverageMood { get; set; }
    public int MedicationAdherenceRate { get; set; }
    public int MealCompletionRate { get; set; }

    // Trend data
    public List<HealthMetricTrendDto> MetricTrends { get; set; } = new();
    public List<DailySummaryDto> DailySummaries { get; set; } = new();
}

/// <summary>
/// Health metric trend DTO
/// </summary>
public class HealthMetricTrendDto
{
    public string MetricType { get; set; } = string.Empty;
    public string MetricName { get; set; } = string.Empty;
    public List<MetricDataPointDto> DataPoints { get; set; } = new();
    public double Average { get; set; }
    public double Min { get; set; }
    public double Max { get; set; }
    public string Trend { get; set; } = string.Empty; // Improving, Stable, Declining
}

/// <summary>
/// Metric data point DTO for charts
/// </summary>
public class MetricDataPointDto
{
    public DateTime Date { get; set; }
    public double Value { get; set; }
    public string? Unit { get; set; }
    public string? Notes { get; set; }
}

/// <summary>
/// Daily summary DTO for family view
/// </summary>
public class DailySummaryDto
{
    public DateTime Date { get; set; }
    public string? Mood { get; set; }
    public List<string> Medications { get; set; } = new();
    public List<string> Meals { get; set; } = new();
    public List<string> Activities { get; set; } = new();
    public string? Notes { get; set; }
    public string ReportStatus { get; set; } = string.Empty;
}

/// <summary>
/// Family dashboard DTO
/// </summary>
public class FamilyDashboardDto
{
    public List<ElderlySummaryDto> ElderlySummaries { get; set; } = new();
    public List<NotificationDto> RecentNotifications { get; set; } = new();
    public List<UpcomingVisitDto> UpcomingVisits { get; set; } = new();
    public HealthAlertDto? RecentAlert { get; set; }
    public int UnreadNotificationsCount { get; set; }
}

/// <summary>
/// Elderly summary for family dashboard
/// </summary>
public class ElderlySummaryDto
{
    public int ElderlyId { get; set; }
    public string ElderlyName { get; set; } = string.Empty;
    public string RoomNumber { get; set; } = string.Empty;
    public DateTime? LastReportDate { get; set; }
    public string LastReportStatus { get; set; } = string.Empty;
    public bool HasNewReport { get; set; }
    public string HealthStatus { get; set; } = string.Empty; // Good, Fair, Poor
    public List<string> RecentActivities { get; set; } = new();
}

/// <summary>
/// Upcoming visit DTO
/// </summary>
public class UpcomingVisitDto
{
    public int VisitId { get; set; }
    public int ElderlyId { get; set; }
    public string ElderlyName { get; set; } = string.Empty;
    public DateTime VisitDate { get; set; }
    public TimeSpan VisitTime { get; set; }
    public int DurationMinutes { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Notes { get; set; }
}

/// <summary>
/// Health alert DTO
/// </summary>
public class HealthAlertDto
{
    public int AlertId { get; set; }
    public int ElderlyId { get; set; }
    public string ElderlyName { get; set; } = string.Empty;
    public string AlertType { get; set; } = string.Empty;
    public string Severity { get; set; } = string.Empty; // High, Medium, Low
    public string Message { get; set; } = string.Empty;
    public DateTime DetectedAt { get; set; }
    public bool IsRead { get; set; }
}

/// <summary>
/// Visit filter parameters
/// </summary>
public class VisitFilterParameters : PaginationParameters
{
    public int? ElderlyId { get; set; }
    public string? Status { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public bool? UpcomingOnly { get; set; }
}

/// <summary>
/// Weekly health summary for email notifications
/// </summary>
public class WeeklyHealthSummaryDto
{
    public int ElderlyId { get; set; }
    public string ElderlyName { get; set; } = string.Empty;
    public DateTime WeekStartDate { get; set; }
    public DateTime WeekEndDate { get; set; }
    public int ReportsCount { get; set; }
    public double MoodAverage { get; set; }
    public int MedicationCompliance { get; set; }
    public int MealCompliance { get; set; }
    public List<string> Highlights { get; set; } = new();
    public List<string> Concerns { get; set; } = new();
}