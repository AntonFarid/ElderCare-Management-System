using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartElderlyCare.Application.DTOs.Common;
using SmartElderlyCare.Application.DTOs.DailyReport;
using SmartElderlyCare.Application.DTOs.Elderly;
using SmartElderlyCare.Application.DTOs.Schedule;
using SmartElderlyCare.Application.DTOs.User;
using SmartElderlyCare.Application.Interfaces;
using SmartElderlyCare.Application.Wrappers;
using System.Security.Claims;
using SmartElderlyCare.Application.DTOs.AI;

namespace SmartElderlyCare.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Employee")]
public class EmployeeController : ControllerBase
{
    private readonly IEmployeeService _employeeService;
    private readonly ICurrentUserService _currentUserService;
    private readonly ILogger<EmployeeController> _logger;

    public EmployeeController(
        IEmployeeService employeeService,
        ICurrentUserService currentUserService,
        ILogger<EmployeeController> logger)
    {
        _employeeService = employeeService;
        _currentUserService = currentUserService;
        _logger = logger;
    }

    /// <summary>
    /// Get the current employee's user ID from claims
    /// </summary>
    private int GetCurrentEmployeeId()
    {
        return _currentUserService.UserId ?? 0;
    }

    #region Profile Management

    /// <summary>
    /// Get employee profile
    /// </summary>
    /// <returns>Employee profile information</returns>
    [HttpGet("profile")]
    [ProducesResponseType(typeof(Response<UserDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetProfile()
    {
        var employeeId = GetCurrentEmployeeId();
        var response = await _employeeService.GetProfileAsync(employeeId);
        return Ok(response);
    }

    /// <summary>
    /// Update employee profile
    /// </summary>
    /// <param name="updateDto">Profile update data</param>
    /// <returns>Updated profile</returns>
    [HttpPut("profile")]
    [ProducesResponseType(typeof(Response<UserDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Response<string>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateUserDto updateDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new Response<string>("Invalid request data"));
        }

        var employeeId = GetCurrentEmployeeId();
        var response = await _employeeService.UpdateProfileAsync(employeeId, updateDto);
        return Ok(response);
    }

    #endregion

    #region Assigned Elderly

    /// <summary>
    /// Get all elderly residents assigned to the employee
    /// </summary>
    /// <returns>List of assigned elderly</returns>
    [HttpGet("assigned-elderly")]
    [ProducesResponseType(typeof(Response<List<ElderlyDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetAssignedElderly()
    {
        var employeeId = GetCurrentEmployeeId();
        var response = await _employeeService.GetAssignedElderlyAsync(employeeId);
        return Ok(response);
    }

    /// <summary>
    /// Get detailed information for a specific elderly resident
    /// </summary>
    /// <param name="elderlyId">ID of the elderly resident</param>
    /// <returns>Elderly details with related information</returns>
    [HttpGet("assigned-elderly/{elderlyId}")]
    [ProducesResponseType(typeof(Response<ElderlyDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetElderlyDetails(int elderlyId)
    {
        var employeeId = GetCurrentEmployeeId();
        var response = await _employeeService.GetElderlyDetailsAsync(employeeId, elderlyId);
        return Ok(response);
    }

    #endregion

    #region Daily Reports

    /// <summary>
    /// Create a new daily report
    /// </summary>
    /// <param name="createDto">Report data</param>
    /// <returns>Created report</returns>
    [HttpPost("reports")]
    [ProducesResponseType(typeof(Response<DailyReportDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(Response<string>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> CreateReport([FromBody] CreateDailyReportDto createDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new Response<string>("Invalid request data"));
        }

        var employeeId = GetCurrentEmployeeId();
        var response = await _employeeService.CreateDailyReportAsync(employeeId, createDto);
        return StatusCode(StatusCodes.Status201Created, response);
    }

    /// <summary>
    /// Update an existing daily report (only if pending)
    /// </summary>
    /// <param name="reportId">ID of the report to update</param>
    /// <param name="updateDto">Updated report data</param>
    /// <returns>Updated report</returns>
    [HttpPut("reports/{reportId}")]
    [ProducesResponseType(typeof(Response<DailyReportDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Response<string>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateReport(int reportId, [FromBody] CreateDailyReportDto updateDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new Response<string>("Invalid request data"));
        }

        var employeeId = GetCurrentEmployeeId();
        var response = await _employeeService.UpdateDailyReportAsync(employeeId, reportId, updateDto);
        return Ok(response);
    }

    /// <summary>
    /// Get a specific daily report by ID
    /// </summary>
    /// <param name="reportId">ID of the report</param>
    /// <returns>Report details</returns>
    [HttpGet("reports/{reportId}")]
    [ProducesResponseType(typeof(Response<DailyReportDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetReportById(int reportId)
    {
        var employeeId = GetCurrentEmployeeId();
        var response = await _employeeService.GetDailyReportByIdAsync(employeeId, reportId);
        return Ok(response);
    }

    /// <summary>
    /// Get paginated list of employee's reports with filtering
    /// </summary>
    /// <param name="parameters">Filter and pagination parameters</param>
    /// <returns>Paginated list of reports</returns>
    [HttpGet("reports")]
    [ProducesResponseType(typeof(Response<PaginatedResponse<List<DailyReportDto>>>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetMyReports([FromQuery] ReportFilterParameters parameters)
    {
        var employeeId = GetCurrentEmployeeId();
        var response = await _employeeService.GetMyReportsAsync(employeeId, parameters);
        return Ok(response);
    }

    /// <summary>
    /// Get summary of employee's reports
    /// </summary>
    /// <returns>Report summary statistics</returns>
    [HttpGet("reports/summary")]
    [ProducesResponseType(typeof(Response<ReportSummaryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetReportsSummary()
    {
        var employeeId = GetCurrentEmployeeId();
        var response = await _employeeService.GetReportsSummaryAsync(employeeId);
        return Ok(response);
    }

    #endregion

    #region Task Completion Tracking

    /// <summary>
    /// Get task summary for a specific date
    /// </summary>
    /// <param name="date">Date to get tasks for (defaults to today)</param>
    /// <returns>Task summary with completion status</returns>
    [HttpGet("tasks/summary")]
    [ProducesResponseType(typeof(Response<TaskSummaryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetTaskSummary([FromQuery] DateTime? date)
    {
        var targetDate = date ?? DateTime.Today;
        var employeeId = GetCurrentEmployeeId();
        var response = await _employeeService.GetTaskSummaryAsync(employeeId, targetDate);
        return Ok(response);
    }

    /// <summary>
    /// Get pending tasks for today
    /// </summary>
    /// <returns>List of pending tasks</returns>
    [HttpGet("tasks/pending")]
    [ProducesResponseType(typeof(Response<List<TaskItemDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetPendingTasks()
    {
        var employeeId = GetCurrentEmployeeId();
        var response = await _employeeService.GetPendingTasksAsync(employeeId);
        return Ok(response);
    }

    /// <summary>
    /// Mark a task as completed
    /// </summary>
    /// <param name="taskId">ID of the task/report to mark as completed</param>
    /// <returns>Success status</returns>
    [HttpPost("tasks/{taskId}/complete")]
    [ProducesResponseType(typeof(Response<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> MarkTaskAsCompleted(int taskId)
    {
        var employeeId = GetCurrentEmployeeId();
        var response = await _employeeService.MarkTaskAsCompletedAsync(employeeId, taskId);
        return Ok(response);
    }

    #endregion

    #region Work Schedule

    /// <summary>
    /// Get work schedule for a date range
    /// </summary>
    /// <param name="startDate">Start date (defaults to today)</param>
    /// <param name="endDate">End date (defaults to 7 days from start)</param>
    /// <returns>List of scheduled shifts</returns>
    [HttpGet("schedule")]
    [ProducesResponseType(typeof(Response<List<WorkScheduleDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetSchedule([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
    {
        var start = startDate ?? DateTime.Today;
        var end = endDate ?? start.AddDays(7);

        var employeeId = GetCurrentEmployeeId();
        var response = await _employeeService.GetScheduleAsync(employeeId, start, end);
        return Ok(response);
    }

    /// <summary>
    /// Get today's schedule
    /// </summary>
    /// <returns>Today's shift information</returns>
    [HttpGet("schedule/today")]
    [ProducesResponseType(typeof(Response<WorkScheduleDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetTodaySchedule()
    {
        var employeeId = GetCurrentEmployeeId();
        var response = await _employeeService.GetTodayScheduleAsync(employeeId);
        return Ok(response);
    }

    #endregion

    #region Attendance

    /// <summary>
    /// Clock in for the day
    /// </summary>
    /// <returns>Attendance log entry</returns>
    [HttpPost("attendance/clock-in")]
    [ProducesResponseType(typeof(Response<AttendanceLogDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Response<string>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ClockIn()
    {
        var employeeId = GetCurrentEmployeeId();
        var response = await _employeeService.ClockInAsync(employeeId);
        return Ok(response);
    }

    /// <summary>
    /// Clock out for the day
    /// </summary>
    /// <returns>Attendance log entry with logout time</returns>
    [HttpPost("attendance/clock-out")]
    [ProducesResponseType(typeof(Response<AttendanceLogDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Response<string>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ClockOut()
    {
        var employeeId = GetCurrentEmployeeId();
        var response = await _employeeService.ClockOutAsync(employeeId);
        return Ok(response);
    }

    /// <summary>
    /// Get current attendance status
    /// </summary>
    /// <returns>Today's attendance status</returns>
    [HttpGet("attendance/status")]
    [ProducesResponseType(typeof(Response<AttendanceLogDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetAttendanceStatus()
    {
        var employeeId = GetCurrentEmployeeId();
        var response = await _employeeService.GetCurrentAttendanceStatusAsync(employeeId);
        return Ok(response);
    }

    #endregion

    #region AI Diet Advisor

    /// <summary>
    /// Get AI diet recommendation for an assigned resident
    /// </summary>
    /// <param name="elderlyId">Resident ID</param>
    /// <returns>Diet recommendation detailing Breakfast, Lunch, Dinner and notes</returns>
    [HttpGet("assigned-elderly/{elderlyId}/diet-recommendation")]
    [ProducesResponseType(typeof(Response<DietRecommendationOutputDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetDietRecommendation(int elderlyId)
    {
        var employeeId = GetCurrentEmployeeId();
        var response = await _employeeService.GetDietRecommendationAsync(employeeId, elderlyId);
        if (!response.Succeeded)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, response);
        }
        return Ok(response);
    }

    #endregion
}