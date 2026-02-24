using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using SmartElderlyCare.Application.DTOs.Elderly;
using SmartElderlyCare.Application.DTOs.User;

namespace SmartElderlyCare.Application.DTOs.Admin;

/// <summary>
/// Role DTO for role management
/// </summary>
public class RoleDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int UserCount { get; set; }
}

/// <summary>
/// System statistics DTO for admin dashboard
/// </summary>
public class SystemStatisticsDto
{
    // User Statistics
    public int TotalUsers { get; set; }
    public int ActiveUsers { get; set; }
    public int InactiveUsers { get; set; }
    public Dictionary<string, int> UsersByRole { get; set; } = new();
    public Dictionary<string, int> UsersByType { get; set; } = new();

    // Elderly Statistics
    public int TotalElderly { get; set; }
    public int ActiveElderly { get; set; }
    public int ElderlyWithFamily { get; set; }
    public int ElderlyWithoutFamily { get; set; }
    public double AverageAge { get; set; }

    // Report Statistics
    public int TotalReports { get; set; }
    public int ReportsToday { get; set; }
    public int ReportsThisWeek { get; set; }
    public int ReportsThisMonth { get; set; }
    public Dictionary<string, int> ReportsByStatus { get; set; } = new();

    // Activity Statistics
    public int LoginsToday { get; set; }
    public int ActiveSessions { get; set; }
    public double AverageReportsPerDay { get; set; }

    // System Health
    public DateTime LastBackup { get; set; }
    public long DatabaseSize { get; set; } // In MB
    public int PendingNotifications { get; set; }
}

/// <summary>
/// Audit log DTO for system monitoring
/// </summary>
public class AuditLogDto
{
    public int Id { get; set; }
    public int? UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string EntityName { get; set; } = string.Empty;
    public int? EntityId { get; set; }
    public string? OldValues { get; set; }
    public string? NewValues { get; set; }
    public string? IpAddress { get; set; }
    public DateTime Timestamp { get; set; }
}

/// <summary>
/// Activity summary DTO
/// </summary>
public class ActivitySummaryDto
{
    public DateTime Date { get; set; }
    public int NewUsers { get; set; }
    public int NewElderly { get; set; }
    public int ReportsSubmitted { get; set; }
    public int ReportsApproved { get; set; }
    public int Logins { get; set; }
    public List<RecentActivityDto> RecentActivities { get; set; } = new();
}

/// <summary>
/// Recent activity DTO
/// </summary>
public class RecentActivityDto
{
    public string UserName { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
}

/// <summary>
/// Admin dashboard DTO
/// </summary>
public class AdminDashboardDto
{
    public SystemStatisticsDto Statistics { get; set; } = new();
    public List<RecentActivityDto> RecentActivities { get; set; } = new();
    public List<UserDto> RecentUsers { get; set; } = new();
    public List<ElderlyDto> RecentElderly { get; set; } = new();
    public List<ChartDataDto> UserGrowthData { get; set; } = new();
    public List<ChartDataDto> ReportActivityData { get; set; } = new();
}

/// <summary>
/// Chart data DTO for visualizations
/// </summary>
public class ChartDataDto
{
    public string Label { get; set; } = string.Empty;
    public int Value { get; set; }
    public string? Color { get; set; }
}

/// <summary>
/// Bulk operation result DTO
/// </summary>
public class BulkOperationResultDto
{
    public int TotalProcessed { get; set; }
    public int Successful { get; set; }
    public int Failed { get; set; }
    public List<string> Errors { get; set; } = new();
}