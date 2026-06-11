using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartElderlyCare.Application.DTOs.Common;
using SmartElderlyCare.Application.DTOs.DailyReport;
using SmartElderlyCare.Application.DTOs.Family;
using SmartElderlyCare.Application.DTOs.Schedule;
using SmartElderlyCare.Application.DTOs.TeamLeader;
using SmartElderlyCare.Application.DTOs.User;
using SmartElderlyCare.Application.DTOs.Visit;
using SmartElderlyCare.Application.DTOs.Elderly;
using SmartElderlyCare.Application.DTOs.AI;
using SmartElderlyCare.Application.Interfaces;
using SmartElderlyCare.Application.Wrappers;
using SmartElderlyCare.Domain.Enums;

namespace SmartElderlyCare.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "TeamLeader,Admin")]
public class TeamLeaderController : ControllerBase
{
    private readonly ITeamLeaderService _teamLeaderService;
    private readonly ICurrentUserService _currentUserService;
    private readonly ILogger<TeamLeaderController> _logger;

    public TeamLeaderController(
        ITeamLeaderService teamLeaderService,
        ICurrentUserService currentUserService,
        ILogger<TeamLeaderController> logger)
    {
        _teamLeaderService = teamLeaderService;
        _currentUserService = currentUserService;
        _logger = logger;
    }

    /// <summary>
    /// Get the current team leader's user ID from claims
    /// </summary>
    private int GetCurrentTeamLeaderId()
    {
        return _currentUserService.UserId ?? 0;
    }

    #region Profile Management

    /// <summary>
    /// Get team leader profile
    /// </summary>
    [HttpGet("profile")]
    [ProducesResponseType(typeof(Response<UserDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetProfile()
    {
        var teamLeaderId = GetCurrentTeamLeaderId();
        var response = await _teamLeaderService.GetProfileAsync(teamLeaderId);
        return Ok(response);
    }

    /// <summary>
    /// Update team leader profile
    /// </summary>
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

        var teamLeaderId = GetCurrentTeamLeaderId();
        var response = await _teamLeaderService.UpdateProfileAsync(teamLeaderId, updateDto);
        return Ok(response);
    }

    #endregion

    #region Elderly Management

    /// <summary>
    /// Get all elderly residents
    /// </summary>
    [HttpGet("elderly")]
    [ProducesResponseType(typeof(Response<List<ElderlyDetailDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetAllElderly()
    {
        var response = await _teamLeaderService.GetAllElderlyAsync();
        return Ok(response);
    }

    #endregion

    #region Report Approval Workflow

    /// <summary>
    /// Get paginated list of pending reports for approval
    /// </summary>
    /// <param name="parameters">Filter and pagination parameters</param>
    /// <returns>Paginated list of pending reports</returns>
    [HttpGet("reports/pending")]
    [ProducesResponseType(typeof(Response<PaginatedResponse<List<DailyReportDto>>>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetPendingReports([FromQuery] ReportFilterParameters parameters)
    {
        var response = await _teamLeaderService.GetPendingReportsAsync(parameters);
        return Ok(response);
    }

    /// <summary>
    /// Get detailed report information for approval
    /// </summary>
    /// <param name="reportId">ID of the report</param>
    /// <returns>Report details with health metrics</returns>
    [HttpGet("reports/{reportId}")]
    [ProducesResponseType(typeof(Response<DailyReportDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetReportDetails(int reportId)
    {
        var response = await _teamLeaderService.GetReportDetailsAsync(reportId);
        return Ok(response);
    }

    /// <summary>
    /// Approve a pending report
    /// </summary>
    /// <param name="approveDto">Approval data with report ID</param>
    /// <returns>Approved report</returns>
    [HttpPost("reports/approve")]
    [ProducesResponseType(typeof(Response<DailyReportDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Response<string>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ApproveReport([FromBody] ApproveReportDto approveDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new Response<string>("Invalid request data"));
        }

        var teamLeaderId = GetCurrentTeamLeaderId();
        var response = await _teamLeaderService.ApproveReportAsync(teamLeaderId, approveDto);
        return Ok(response);
    }

    /// <summary>
    /// Reject a pending report with reason
    /// </summary>
    /// <param name="rejectDto">Rejection data with report ID and reason</param>
    /// <returns>Rejected report</returns>
    [HttpPost("reports/reject")]
    [ProducesResponseType(typeof(Response<DailyReportDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Response<string>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RejectReport([FromBody] RejectReportDto rejectDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new Response<string>("Invalid request data"));
        }

        var teamLeaderId = GetCurrentTeamLeaderId();
        var response = await _teamLeaderService.RejectReportAsync(teamLeaderId, rejectDto);
        return Ok(response);
    }

    /// <summary>
    /// Get reports summary for dashboard
    /// </summary>
    /// <returns>Report statistics summary</returns>
    [HttpGet("reports/summary")]
    [ProducesResponseType(typeof(Response<ReportSummaryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetReportsSummary()
    {
        var response = await _teamLeaderService.GetReportsSummaryAsync();
        return Ok(response);
    }

    /// <summary>
    /// Get approval history with optional date range
    /// </summary>
    /// <param name="fromDate">Start date (optional)</param>
    /// <param name="toDate">End date (optional)</param>
    /// <returns>List of approval history</returns>
    [HttpGet("reports/approval-history")]
    [ProducesResponseType(typeof(Response<List<ReportApprovalHistoryDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetApprovalHistory([FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate, [FromQuery] int? elderlyId, [FromQuery] ApprovalStatus? status)
    {
        var response = await _teamLeaderService.GetApprovalHistoryAsync(fromDate, toDate, elderlyId, status);
        return Ok(response);
    }

    #endregion

    #region Employee Performance Monitoring

    /// <summary>
    /// Get paginated list of employees
    /// </summary>
    /// <param name="parameters">Filter and pagination parameters</param>
    /// <returns>Paginated list of employees</returns>
    [HttpGet("employees")]
    [ProducesResponseType(typeof(Response<PaginatedResponse<List<UserDto>>>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetEmployees([FromQuery] UserFilterParameters parameters)
    {
        var response = await _teamLeaderService.GetEmployeesAsync(parameters);
        return Ok(response);
    }

    /// <summary>
    /// Get detailed performance metrics for a specific employee
    /// </summary>
    /// <param name="employeeId">Employee ID</param>
    /// <param name="fromDate">Start date (optional)</param>
    /// <param name="toDate">End date (optional)</param>
    /// <returns>Employee performance data</returns>
    [HttpGet("employees/{employeeId}/performance")]
    [ProducesResponseType(typeof(Response<EmployeePerformanceDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetEmployeePerformance(
        int employeeId,
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate)
    {
        var response = await _teamLeaderService.GetEmployeePerformanceAsync(employeeId, fromDate, toDate);
        return Ok(response);
    }

    /// <summary>
    /// Get performance summary for all employees for a specific date
    /// </summary>
    /// <param name="date">Date to get summary for (defaults to today)</param>
    /// <returns>List of employee performance summaries</returns>
    [HttpGet("employees/performance-summary")]
    [ProducesResponseType(typeof(Response<List<EmployeePerformanceSummaryDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetAllEmployeesPerformance([FromQuery] DateTime? date, [FromQuery] DateTime? endDate)
    {
        var response = await _teamLeaderService.GetAllEmployeesPerformanceAsync(date, endDate);
        return Ok(response);
    }

    /// <summary>
    /// Get detailed employee information with assignments
    /// </summary>
    /// <param name="employeeId">Employee ID</param>
    /// <returns>Employee details with assignments</returns>
    [HttpGet("employees/{employeeId}")]
    [ProducesResponseType(typeof(Response<EmployeeDetailsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetEmployeeDetails(int employeeId)
    {
        var response = await _teamLeaderService.GetEmployeeDetailsAsync(employeeId);
        return Ok(response);
    }

    #endregion

    #region Attendance Tracking

    /// <summary>
    /// Get attendance logs with filtering
    /// </summary>
    /// <param name="employeeId">Filter by employee ID (optional)</param>
    /// <param name="date">Filter by date (optional)</param>
    /// <param name="parameters">Pagination parameters</param>
    /// <returns>Paginated attendance logs</returns>
    [HttpGet("attendance")]
    [ProducesResponseType(typeof(Response<PaginatedResponse<List<AttendanceLogDto>>>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetAttendanceLogs(
        [FromQuery] int? employeeId,
        [FromQuery] DateTime? date,
        [FromQuery] PaginationParameters parameters)
    {
        var response = await _teamLeaderService.GetAttendanceLogsAsync(employeeId, date, parameters);
        return Ok(response);
    }

    /// <summary>
    /// Get attendance summary for a specific date
    /// </summary>
    /// <param name="date">Date to get summary for (defaults to today)</param>
    /// <returns>Attendance summary statistics</returns>
    [HttpGet("attendance/summary")]
    [ProducesResponseType(typeof(Response<AttendanceSummaryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetAttendanceSummary([FromQuery] DateTime? date)
    {
        var targetDate = date ?? DateTime.Today;
        var response = await _teamLeaderService.GetAttendanceSummaryAsync(targetDate);
        return Ok(response);
    }

    /// <summary>
    /// Get current attendance status for all employees
    /// </summary>
    /// <returns>List of employees with current attendance status</returns>
    [HttpGet("attendance/current-status")]
    [ProducesResponseType(typeof(Response<List<EmployeeAttendanceDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetCurrentAttendanceStatus()
    {
        var response = await _teamLeaderService.GetCurrentAttendanceStatusAsync();
        return Ok(response);
    }

    #endregion

    #region Schedule Management

    /// <summary>
    /// Create a new work schedule
    /// </summary>
    /// <param name="createDto">Schedule data</param>
    /// <returns>Created schedule</returns>
    [HttpPost("schedules")]
    [ProducesResponseType(typeof(Response<WorkScheduleDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(Response<string>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CreateSchedule([FromBody] CreateScheduleDto createDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new Response<string>("Invalid request data"));
        }

        var teamLeaderId = GetCurrentTeamLeaderId();
        var response = await _teamLeaderService.CreateScheduleAsync(teamLeaderId, createDto);
        return StatusCode(StatusCodes.Status201Created, response);
    }

    /// <summary>
    /// Update an existing schedule
    /// </summary>
    /// <param name="scheduleId">ID of the schedule to update</param>
    /// <param name="updateDto">Updated schedule data</param>
    /// <returns>Updated schedule</returns>
    [HttpPut("schedules/{scheduleId}")]
    [ProducesResponseType(typeof(Response<WorkScheduleDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Response<string>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateSchedule(int scheduleId, [FromBody] CreateScheduleDto updateDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new Response<string>("Invalid request data"));
        }

        var teamLeaderId = GetCurrentTeamLeaderId();
        var response = await _teamLeaderService.UpdateScheduleAsync(teamLeaderId, scheduleId, updateDto);
        return Ok(response);
    }

    /// <summary>
    /// Delete a schedule (soft delete)
    /// </summary>
    /// <param name="scheduleId">ID of the schedule to delete</param>
    /// <returns>Success status</returns>
    [HttpDelete("schedules/{scheduleId}")]
    [ProducesResponseType(typeof(Response<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteSchedule(int scheduleId)
    {
        var teamLeaderId = GetCurrentTeamLeaderId();
        var response = await _teamLeaderService.DeleteScheduleAsync(teamLeaderId, scheduleId);
        return Ok(response);
    }

    /// <summary>
    /// Get schedules for a date range
    /// </summary>
    /// <param name="startDate">Start date</param>
    /// <param name="endDate">End date</param>
    /// <param name="employeeId">Filter by employee ID (optional)</param>
    /// <returns>List of schedules</returns>
    [HttpGet("schedules")]
    [ProducesResponseType(typeof(Response<List<WorkScheduleDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetSchedules(
        [FromQuery] DateTime startDate,
        [FromQuery] DateTime endDate,
        [FromQuery] int? employeeId)
    {
        var response = await _teamLeaderService.GetSchedulesAsync(startDate, endDate, employeeId);
        return Ok(response);
    }

    /// <summary>
    /// Get today's schedule summary
    /// </summary>
    /// <returns>Today's schedule summary</returns>
    [HttpGet("schedules/today-summary")]
    [ProducesResponseType(typeof(Response<ScheduleSummaryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetTodayScheduleSummary()
    {
        var response = await _teamLeaderService.GetTodayScheduleSummaryAsync();
        return Ok(response);
    }

    #endregion

    #region Visit Request Management

    /// <summary>
    /// Get paginated list of pending visit requests
    /// </summary>
    /// <param name="parameters">Filter parameters</param>
    /// <returns>Paginated list of pending visit requests</returns>
    [HttpGet("visits/pending")]
    [ProducesResponseType(typeof(Response<PaginatedResponse<List<VisitRequestDto>>>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetPendingVisitRequests([FromQuery] VisitFilterParameters parameters)
    {
        var response = await _teamLeaderService.GetPendingVisitRequestsAsync(parameters);
        return Ok(response);
    }

    /// <summary>
    /// Get detailed visit request information for approval
    /// </summary>
    /// <param name="visitId">ID of the visit request</param>
    /// <returns>Visit request details</returns>
    [HttpGet("visits/{visitId}")]
    [ProducesResponseType(typeof(Response<VisitRequestDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetVisitRequestDetails(int visitId)
    {
        var response = await _teamLeaderService.GetVisitRequestDetailsAsync(visitId);
        return Ok(response);
    }

    /// <summary>
    /// Approve a visit request
    /// </summary>
    /// <param name="approveDto">Approval data</param>
    /// <returns>Approved visit request</returns>
    [HttpPost("visits/approve")]
    [ProducesResponseType(typeof(Response<VisitRequestDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Response<string>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ApproveVisitRequest([FromBody] ApproveVisitDto approveDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new Response<string>("Invalid request data"));
        }

        var teamLeaderId = GetCurrentTeamLeaderId();
        var response = await _teamLeaderService.ApproveVisitRequestAsync(teamLeaderId, approveDto);
        return Ok(response);
    }

    /// <summary>
    /// Reject a visit request with reason
    /// </summary>
    /// <param name="rejectDto">Rejection data with reason</param>
    /// <returns>Rejected visit request</returns>
    [HttpPost("visits/reject")]
    [ProducesResponseType(typeof(Response<VisitRequestDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Response<string>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RejectVisitRequest([FromBody] RejectVisitDto rejectDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new Response<string>("Invalid request data"));
        }

        var teamLeaderId = GetCurrentTeamLeaderId();
        var response = await _teamLeaderService.RejectVisitRequestAsync(teamLeaderId, rejectDto);
        return Ok(response);
    }

    /// <summary>
    /// Get visit requests summary for dashboard
    /// </summary>
    /// <returns>Visit summary statistics</returns>
    [HttpGet("visits/summary")]
    [ProducesResponseType(typeof(Response<VisitSummaryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetVisitRequestsSummary()
    {
        var response = await _teamLeaderService.GetVisitRequestsSummaryAsync();
        return Ok(response);
    }

    /// <summary>
    /// Get AI diet recommendation for a resident
    /// </summary>
    /// <param name="elderlyId">Resident ID</param>
    /// <returns>Diet recommendation detailing Breakfast, Lunch, Dinner and notes</returns>
    [HttpGet("elderly/{elderlyId}/diet-recommendation")]
    [ProducesResponseType(typeof(Response<DietRecommendationOutputDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetDietRecommendation(int elderlyId)
    {
        var response = await _teamLeaderService.GetDietRecommendationAsync(elderlyId);
        if (!response.Succeeded)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, response);
        }
        return Ok(response);
    }

    /// <summary>
    /// Get all active dietary recipes/meals
    /// </summary>
    [HttpGet("recipes")]
    [ProducesResponseType(typeof(Response<List<RecipeDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetRecipes()
    {
        var response = await _teamLeaderService.GetRecipesAsync();
        return Ok(response);
    }

    /// <summary>
    /// Add a new custom dietary recipe (triggers automatic retraining)
    /// </summary>
    [HttpPost("recipes")]
    [ProducesResponseType(typeof(Response<RecipeDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Response<string>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> AddRecipe([FromBody] RecipeDto recipeDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new Response<string>("Invalid request data"));
        }
        var response = await _teamLeaderService.AddRecipeAsync(recipeDto);
        if (!response.Succeeded)
        {
            return BadRequest(response);
        }
        return Ok(response);
    }

    /// <summary>
    /// Manually trigger AI model retraining
    /// </summary>
    [HttpPost("recipes/retrain")]
    [ProducesResponseType(typeof(Response<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> RetrainModel()
    {
        var response = await _teamLeaderService.RetrainModelAsync();
        return Ok(response);
    }

    /// <summary>
    /// Get details of a specific elderly resident
    /// </summary>
    [HttpGet("elderly/{elderlyId}")]
    [ProducesResponseType(typeof(Response<ElderlyDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetElderlyById(int elderlyId)
    {
        var response = await _teamLeaderService.GetElderlyByIdAsync(elderlyId);
        return Ok(response);
    }

    #endregion
}