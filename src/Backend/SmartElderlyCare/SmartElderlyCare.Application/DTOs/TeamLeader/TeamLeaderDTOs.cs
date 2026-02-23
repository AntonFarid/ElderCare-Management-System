using SmartElderlyCare.Application.DTOs.DailyReport;
using SmartElderlyCare.Application.DTOs.Schedule;
using SmartElderlyCare.Application.DTOs.User;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SmartElderlyCare.Application.DTOs.TeamLeader;

/// <summary>
/// Employee performance DTO for team leader dashboard
/// </summary>
public class EmployeePerformanceDto
{
    public int EmployeeId { get; set; }
    public string EmployeeName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public DateTime? LastLoginAt { get; set; }

    // Report Statistics
    public int TotalReports { get; set; }
    public int PendingReports { get; set; }
    public int ApprovedReports { get; set; }
    public int RejectedReports { get; set; }
    public double ApprovalRate { get; set; }
    public double AverageResponseTime { get; set; } // In hours

    // Attendance Statistics
    public int DaysPresent { get; set; }
    public int DaysAbsent { get; set; }
    public int LateDays { get; set; }
    public double AverageWorkHours { get; set; }

    // Recent Activity
    public List<RecentReportDto> RecentReports { get; set; } = new();
    public List<AttendanceLogDto> RecentAttendance { get; set; } = new();
}

/// <summary>
/// Employee performance summary for list view
/// </summary>
public class EmployeePerformanceSummaryDto
{
    public int EmployeeId { get; set; }
    public string EmployeeName { get; set; } = string.Empty;
    public int ReportsSubmitted { get; set; }
    public int ReportsApproved { get; set; }
    public int ReportsRejected { get; set; }
    public bool ClockedIn { get; set; }
    public DateTime? ClockInTime { get; set; }
    public TimeSpan? CurrentShift { get; set; }
    public string Status { get; set; } = string.Empty; // On Time, Late, Absent, etc.
}

/// <summary>
/// Recent report DTO for employee performance
/// </summary>
public class RecentReportDto
{
    public int ReportId { get; set; }
    public string ElderlyName { get; set; } = string.Empty;
    public DateTime ReportDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime? ApprovedDate { get; set; }
}

/// <summary>
/// Employee details with assignments
/// </summary>
public class EmployeeDetailsDto : UserDto
{
    public List<AssignedElderlyInfoDto> AssignedElderly { get; set; } = new();
    public WorkScheduleDto? TodaySchedule { get; set; }
    public AttendanceLogDto? TodayAttendance { get; set; }
}

/// <summary>
/// Assigned elderly information
/// </summary>
public class AssignedElderlyInfoDto
{
    public int ElderlyId { get; set; }
    public string ElderlyName { get; set; } = string.Empty;
    public string RoomNumber { get; set; } = string.Empty;
    public bool IsPrimary { get; set; }
    public DateTime? LastReportDate { get; set; }
    public string LastReportStatus { get; set; } = string.Empty;
}

/// <summary>
/// Attendance summary for team leader dashboard
/// </summary>
public class AttendanceSummaryDto
{
    public DateTime Date { get; set; }
    public int TotalEmployees { get; set; }
    public int Present { get; set; }
    public int Absent { get; set; }
    public int Late { get; set; }
    public int OnLeave { get; set; }
    public double AttendanceRate { get; set; }
    public List<EmployeeAttendanceDto> AttendanceDetails { get; set; } = new();
}

/// <summary>
/// Employee attendance status DTO
/// </summary>
public class EmployeeAttendanceDto
{
    public int EmployeeId { get; set; }
    public string EmployeeName { get; set; } = string.Empty;
    public bool IsPresent { get; set; }
    public DateTime? ClockInTime { get; set; }
    public DateTime? ClockOutTime { get; set; }
    public TimeSpan? WorkDuration { get; set; }
    public string Status { get; set; } = string.Empty; // Present, Absent, Late, Left Early
    public TimeSpan? ScheduledStartTime { get; set; }
    public TimeSpan? ScheduledEndTime { get; set; }
}

/// <summary>
/// Approval statistics DTO
/// </summary>
public class ApprovalStatisticsDto
{
    public int TotalPending { get; set; }
    public int ApprovedToday { get; set; }
    public int RejectedToday { get; set; }
    public double AverageApprovalTime { get; set; } // In hours
    public List<ReportApprovalHistoryDto> RecentActivity { get; set; } = new();
}