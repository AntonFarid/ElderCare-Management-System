using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using SmartElderlyCare.Application.DTOs.Common;
using SmartElderlyCare.Application.DTOs.DailyReport;
using SmartElderlyCare.Application.DTOs.Elderly;
using SmartElderlyCare.Application.DTOs.Family;
using SmartElderlyCare.Application.DTOs.Notification;
using SmartElderlyCare.Application.DTOs.User;
using SmartElderlyCare.Application.DTOs.Visit;
using SmartElderlyCare.Application.Interfaces;
using SmartElderlyCare.Application.Wrappers;

namespace SmartElderlyCare.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "FamilyMember")]
public class FamilyController : ControllerBase
{
    private readonly IFamilyMemberService _familyMemberService;
    private readonly ICurrentUserService _currentUserService;
    private readonly ILogger<FamilyController> _logger;

    public FamilyController(
        IFamilyMemberService familyMemberService,
        ICurrentUserService currentUserService,
        ILogger<FamilyController> logger)
    {
        _familyMemberService = familyMemberService;
        _currentUserService = currentUserService;
        _logger = logger;
    }

    /// <summary>
    /// Get the current family member's user ID from claims
    /// </summary>
    private int GetCurrentFamilyMemberId()
    {
        return _currentUserService.UserId ?? 0;
    }

    #region Profile Management

    /// <summary>
    /// Get family member profile
    /// </summary>
    [HttpGet("profile")]
    [ProducesResponseType(typeof(Response<UserDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetProfile()
    {
        var familyMemberId = GetCurrentFamilyMemberId();
        var response = await _familyMemberService.GetProfileAsync(familyMemberId);
        return Ok(response);
    }

    /// <summary>
    /// Update family member profile
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

        var familyMemberId = GetCurrentFamilyMemberId();
        var response = await _familyMemberService.UpdateProfileAsync(familyMemberId, updateDto);
        return Ok(response);
    }

    #endregion

    #region Elderly Management

    /// <summary>
    /// Get all elderly residents linked to the family member
    /// </summary>
    [HttpGet("linked-elderly")]
    [ProducesResponseType(typeof(Response<List<ElderlyDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetLinkedElderly()
    {
        var familyMemberId = GetCurrentFamilyMemberId();
        var response = await _familyMemberService.GetLinkedElderlyAsync(familyMemberId);
        return Ok(response);
    }

    /// <summary>
    /// Get detailed information for a specific elderly resident
    /// </summary>
    [HttpGet("linked-elderly/{elderlyId}")]
    [ProducesResponseType(typeof(Response<ElderlyDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetElderlyDetails(int elderlyId)
    {
        var familyMemberId = GetCurrentFamilyMemberId();
        var response = await _familyMemberService.GetElderlyDetailsAsync(familyMemberId, elderlyId);
        return Ok(response);
    }

    #endregion

    #region Approved Reports

    /// <summary>
    /// Get paginated list of approved reports for an elderly
    /// </summary>
    [HttpGet("elderly/{elderlyId}/reports")]
    [ProducesResponseType(typeof(Response<PaginatedResponse<List<DailyReportDto>>>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetApprovedReports(
        int elderlyId,
        [FromQuery] ReportFilterParameters parameters)
    {
        var familyMemberId = GetCurrentFamilyMemberId();
        var response = await _familyMemberService.GetApprovedReportsAsync(familyMemberId, elderlyId, parameters);
        return Ok(response);
    }

    /// <summary>
    /// Get approved report by ID
    /// </summary>
    [HttpGet("reports/{reportId}")]
    [ProducesResponseType(typeof(Response<DailyReportDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetApprovedReportById(int reportId)
    {
        var familyMemberId = GetCurrentFamilyMemberId();
        var response = await _familyMemberService.GetApprovedReportByIdAsync(familyMemberId, reportId);
        return Ok(response);
    }

    /// <summary>
    /// Get reports summary for an elderly
    /// </summary>
    [HttpGet("elderly/{elderlyId}/reports/summary")]
    [ProducesResponseType(typeof(Response<ReportSummaryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetReportsSummary(int elderlyId)
    {
        var familyMemberId = GetCurrentFamilyMemberId();
        var response = await _familyMemberService.GetReportsSummaryAsync(familyMemberId, elderlyId);
        return Ok(response);
    }

    #endregion

    #region Health Trends

    /// <summary>
    /// Get health trends for an elderly
    /// </summary>
    [HttpGet("elderly/{elderlyId}/health-trends")]
    [ProducesResponseType(typeof(Response<HealthTrendsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetHealthTrends(
        int elderlyId,
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate)
    {
        var familyMemberId = GetCurrentFamilyMemberId();
        var response = await _familyMemberService.GetHealthTrendsAsync(familyMemberId, elderlyId, fromDate, toDate);
        return Ok(response);
    }

    /// <summary>
    /// Get metric trends for a specific metric type
    /// </summary>
    [HttpGet("elderly/{elderlyId}/metric-trends/{metricType}")]
    [ProducesResponseType(typeof(Response<List<HealthMetricTrendDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Response<string>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetMetricTrends(
        int elderlyId,
        string metricType,
        [FromQuery] int days = 30)
    {
        var familyMemberId = GetCurrentFamilyMemberId();
        var response = await _familyMemberService.GetMetricTrendsAsync(familyMemberId, elderlyId, metricType, days);
        return Ok(response);
    }

    #endregion

    #region Notifications

    /// <summary>
    /// Get notifications for family member
    /// </summary>
    [HttpGet("notifications")]
    [ProducesResponseType(typeof(Response<PaginatedResponse<List<NotificationDto>>>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetNotifications(
        [FromQuery] PaginationParameters parameters,
        [FromQuery] bool unreadOnly = false)
    {
        var familyMemberId = GetCurrentFamilyMemberId();
        var response = await _familyMemberService.GetNotificationsAsync(familyMemberId, parameters, unreadOnly);
        return Ok(response);
    }

    /// <summary>
    /// Mark a notification as read
    /// </summary>
    [HttpPost("notifications/{notificationId}/read")]
    [ProducesResponseType(typeof(Response<NotificationDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> MarkNotificationAsRead(int notificationId)
    {
        var familyMemberId = GetCurrentFamilyMemberId();
        var response = await _familyMemberService.MarkNotificationAsReadAsync(familyMemberId, notificationId);
        return Ok(response);
    }

    /// <summary>
    /// Mark all notifications as read
    /// </summary>
    [HttpPost("notifications/read-all")]
    [ProducesResponseType(typeof(Response<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> MarkAllNotificationsAsRead()
    {
        var familyMemberId = GetCurrentFamilyMemberId();
        var response = await _familyMemberService.MarkAllNotificationsAsReadAsync(familyMemberId);
        return Ok(response);
    }

    /// <summary>
    /// Get notification summary
    /// </summary>
    [HttpGet("notifications/summary")]
    [ProducesResponseType(typeof(Response<NotificationSummaryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetNotificationSummary()
    {
        var familyMemberId = GetCurrentFamilyMemberId();
        var response = await _familyMemberService.GetNotificationSummaryAsync(familyMemberId);
        return Ok(response);
    }

    #endregion

    #region Visit Scheduling

    /// <summary>
    /// Schedule a new visit
    /// </summary>
    [HttpPost("visits")]
    [ProducesResponseType(typeof(Response<VisitRequestDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(Response<string>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ScheduleVisit([FromBody] CreateVisitRequestDto createDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new Response<string>("Invalid request data"));
        }

        var familyMemberId = GetCurrentFamilyMemberId();
        var response = await _familyMemberService.ScheduleVisitAsync(familyMemberId, createDto);
        return StatusCode(StatusCodes.Status201Created, response);
    }

    /// <summary>
    /// Update a visit request
    /// </summary>
    [HttpPut("visits/{visitId}")]
    [ProducesResponseType(typeof(Response<VisitRequestDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Response<string>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateVisit(int visitId, [FromBody] CreateVisitRequestDto updateDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new Response<string>("Invalid request data"));
        }

        var familyMemberId = GetCurrentFamilyMemberId();
        var response = await _familyMemberService.UpdateVisitRequestAsync(familyMemberId, visitId, updateDto);
        return Ok(response);
    }

    /// <summary>
    /// Cancel a visit request
    /// </summary>
    [HttpDelete("visits/{visitId}")]
    [ProducesResponseType(typeof(Response<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CancelVisit(int visitId)
    {
        var familyMemberId = GetCurrentFamilyMemberId();
        var response = await _familyMemberService.CancelVisitRequestAsync(familyMemberId, visitId);
        return Ok(response);
    }

    /// <summary>
    /// Get visit requests for family member
    /// </summary>
    [HttpGet("visits")]
    [ProducesResponseType(typeof(Response<PaginatedResponse<List<VisitRequestDto>>>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetVisitRequests([FromQuery] VisitFilterParameters parameters)
    {
        var familyMemberId = GetCurrentFamilyMemberId();
        var response = await _familyMemberService.GetVisitRequestsAsync(familyMemberId, parameters);
        return Ok(response);
    }

    /// <summary>
    /// Get visit request by ID
    /// </summary>
    [HttpGet("visits/{visitId}")]
    [ProducesResponseType(typeof(Response<VisitRequestDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetVisitById(int visitId)
    {
        var familyMemberId = GetCurrentFamilyMemberId();
        var response = await _familyMemberService.GetVisitRequestByIdAsync(familyMemberId, visitId);
        return Ok(response);
    }

    #endregion

    #region Dashboard

    /// <summary>
    /// Get family dashboard data
    /// </summary>
    [HttpGet("dashboard")]
    [ProducesResponseType(typeof(Response<FamilyDashboardDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetDashboardData()
    {
        var familyMemberId = GetCurrentFamilyMemberId();
        var response = await _familyMemberService.GetDashboardDataAsync(familyMemberId);
        return Ok(response);
    }

    #endregion
}