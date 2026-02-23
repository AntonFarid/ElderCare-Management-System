using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
namespace SmartElderlyCare.Application.DTOs.DailyReport;

/// <summary>
/// Task summary DTO for employee dashboard
/// </summary>
public class TaskSummaryDto
{
    public DateTime Date { get; set; }
    public int TotalTasks { get; set; }
    public int CompletedTasks { get; set; }
    public int PendingTasks { get; set; }
    public double CompletionRate { get; set; }
    public List<TaskItemDto> Tasks { get; set; } = new();
}

/// <summary>
/// Individual task item DTO
/// </summary>
public class TaskItemDto
{
    public int Id { get; set; }
    public int ElderlyId { get; set; }
    public string ElderlyName { get; set; } = string.Empty;
    public string TaskType { get; set; } = string.Empty; // Report submission, medication, etc.
    public string Description { get; set; } = string.Empty;
    public DateTime DueDate { get; set; }
    public bool IsCompleted { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string Priority { get; set; } = "Normal"; // High, Normal, Low
}

/// <summary>
/// Task completion request DTO
/// </summary>
public class CompleteTaskDto
{
    public int TaskId { get; set; }
    public string? Notes { get; set; }
}

/// <summary>
/// Daily task status DTO
/// </summary>
public class DailyTaskStatusDto
{
    public int ElderlyId { get; set; }
    public string ElderlyName { get; set; } = string.Empty;
    public bool ReportSubmitted { get; set; }
    public int? ReportId { get; set; }
    public DateTime? SubmissionTime { get; set; }
    public List<string> PendingItems { get; set; } = new();
}