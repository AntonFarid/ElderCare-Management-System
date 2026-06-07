using SmartElderlyCare.Application.DTOs.Common;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SmartElderlyCare.Application.DTOs.Schedule;

/// <summary>
/// Work schedule DTO
/// </summary>
public class WorkScheduleDto : BaseDto
{
    public int EmployeeId { get; set; }
    public string EmployeeName { get; set; } = string.Empty;
    public DateTime ShiftDate { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public string ShiftType { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public DateTime? ActualStartTime { get; set; }
    public DateTime? ActualEndTime { get; set; }
}

/// <summary>
/// Create schedule DTO (team leader action)
/// </summary>
public class CreateScheduleDto
{
    [Required(ErrorMessage = "Employee ID is required")]
    public int EmployeeId { get; set; }

    [Required(ErrorMessage = "Shift date is required")]
    public DateTime ShiftDate { get; set; }

    [Required(ErrorMessage = "Start time is required")]
    public TimeSpan StartTime { get; set; }

    [Required(ErrorMessage = "End time is required")]
    public TimeSpan EndTime { get; set; }

    [Required(ErrorMessage = "Shift type is required")]
    public string ShiftType { get; set; } = string.Empty;

    public string? Notes { get; set; }
}

/// <summary>
/// Attendance log DTO
/// </summary>
public class AttendanceLogDto : BaseDto
{
    public int EmployeeId { get; set; }
    public string EmployeeName { get; set; } = string.Empty;
    public DateTime LoginTime { get; set; }
    public DateTime? LogoutTime { get; set; }
    public DateOnly LogDate { get; set; }
    public TimeSpan? WorkDuration => LogoutTime.HasValue
        ? LogoutTime.Value - LoginTime
        : null;
}

/// <summary>
/// Clock in DTO (employee action)
/// </summary>
public class ClockInDto
{
    [Required]
    public int EmployeeId { get; set; }
}

/// <summary>
/// Clock out DTO (employee action)
/// </summary>
public class ClockOutDto
{
    [Required]
    public int EmployeeId { get; set; }
}

/// <summary>
/// Schedule summary DTO for team leader dashboard
/// </summary>
public class ScheduleSummaryDto
{
    public DateOnly Date { get; set; }
    public int TotalScheduled { get; set; }
    public int ClockedIn { get; set; }
    public int NotClockedIn { get; set; }
    public int OnLeave { get; set; }
    public List<WorkScheduleDto> TodaySchedules { get; set; } = new();
}