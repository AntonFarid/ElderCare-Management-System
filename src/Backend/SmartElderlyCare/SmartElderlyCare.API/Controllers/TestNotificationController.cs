using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartElderlyCare.Application.Interfaces;

namespace SmartElderlyCare.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] // Require authentication
public class TestNotificationController : ControllerBase
{
    private readonly INotificationService _notificationService;
    private readonly ICurrentUserService _currentUserService;
    private readonly ILogger<TestNotificationController> _logger;

    public TestNotificationController(
        INotificationService notificationService,
        ICurrentUserService currentUserService,
        ILogger<TestNotificationController> logger)
    {
        _notificationService = notificationService;
        _currentUserService = currentUserService;
        _logger = logger;
    }

    /// <summary>
    /// Test sending a notification to the current user
    /// </summary>
    [HttpPost("test-my-notification")]
    public async Task<IActionResult> TestMyNotification([FromBody] string message = "This is a test notification")
    {
        var userId = _currentUserService.UserId ?? 0;

        await _notificationService.SendRealTimeNotificationAsync(
            userId,
            "Test Notification",
            message,
            "Info"
        );

        return Ok(new { Message = "Notification sent to yourself" });
    }

    /// <summary>
    /// Test sending a notification to a specific user
    /// </summary>
    [HttpPost("test-user-notification/{userId}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> TestUserNotification(int userId, [FromBody] string message = "This is a test notification")
    {
        await _notificationService.SendRealTimeNotificationAsync(
            userId,
            "Admin Test",
            message,
            "Success"
        );

        return Ok(new { Message = $"Notification sent to user {userId}" });
    }

    /// <summary>
    /// Test sending a notification to a role
    /// </summary>
    [HttpPost("test-role-notification/{role}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> TestRoleNotification(string role, [FromBody] string message = "This is a test notification")
    {
        await _notificationService.SendRealTimeNotificationToRoleAsync(
            role,
            "Role Broadcast",
            message,
            "Warning"
        );

        return Ok(new { Message = $"Notification sent to role {role}" });
    }

    /// <summary>
    /// Test creating a database notification
    /// </summary>
    [HttpPost("test-database-notification")]
    public async Task<IActionResult> TestDatabaseNotification([FromBody] string message = "This is a test notification")
    {
        var userId = _currentUserService.UserId ?? 0;

        var notification = new Application.DTOs.Notification.CreateNotificationDto
        {
            UserId = userId,
            Title = "Database Test",
            Message = message,
            NotificationType = Domain.Enums.NotificationType.General.ToString(),
            RelatedEntityId = null,
            RelatedEntityType = null
        };

        var result = await _notificationService.CreateNotificationAsync(notification);

        return Ok(result);
    }

    /// <summary>
    /// Test report approved workflow
    /// </summary>
    [HttpPost("test-report-approved/{employeeId}/{elderlyId}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> TestReportApproved(int employeeId, int elderlyId)
    {
        await _notificationService.NotifyReportApprovedAsync(1, elderlyId, employeeId);
        return Ok(new { Message = "Report approved notification sent" });
    }

    /// <summary>
    /// Test health alert
    /// </summary>
    [HttpPost("test-health-alert/{elderlyId}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> TestHealthAlert(int elderlyId)
    {
        await _notificationService.NotifyHealthAlertAsync(
            elderlyId,
            "High Blood Pressure",
            "Blood pressure reading was 160/95 this morning",
            "High"
        );
        return Ok(new { Message = "Health alert sent" });
    }
}