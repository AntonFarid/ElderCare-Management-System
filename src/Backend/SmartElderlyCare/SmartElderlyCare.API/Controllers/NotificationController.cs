using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartElderlyCare.Application.Interfaces;

namespace SmartElderlyCare.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] // Requires authentication for all roles
public class NotificationController : ControllerBase
{
    private readonly INotificationService _notificationService;
    private readonly ICurrentUserService _currentUserService;
    private readonly ILogger<NotificationController> _logger;

    public NotificationController(
        INotificationService notificationService,
        ICurrentUserService currentUserService,
        ILogger<NotificationController> logger)
    {
        _notificationService = notificationService;
        _currentUserService = currentUserService;
        _logger = logger;
    }

    /// <summary>
    /// Gets all notifications for the currently authenticated user
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetMyNotifications([FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        var userId = _currentUserService.UserId ?? 0;
        if (userId == 0) return Unauthorized();

        var notifications = await _notificationService.GetUserNotificationsAsync(userId, page, pageSize);
        return Ok(new { succeeded = true, data = notifications });
    }

    /// <summary>
    /// Gets a summary of notifications including unread count
    /// </summary>
    [HttpGet("summary")]
    public async Task<IActionResult> GetNotificationSummary()
    {
        var userId = _currentUserService.UserId ?? 0;
        if (userId == 0) return Unauthorized();

        var unreadCount = await _notificationService.GetUnreadCountAsync(userId);
        
        return Ok(new { succeeded = true, data = new { UnreadCount = unreadCount } });
    }

    /// <summary>
    /// Marks a specific notification as read
    /// </summary>
    [HttpPost("{id}/read")]
    public async Task<IActionResult> MarkAsRead(int id)
    {
        var userId = _currentUserService.UserId ?? 0;
        if (userId == 0) return Unauthorized();

        await _notificationService.MarkAsReadAsync(id, userId);
        return Ok(new { succeeded = true, message = "Notification marked as read" });
    }

    /// <summary>
    /// Marks all notifications for the user as read
    /// </summary>
    [HttpPost("read-all")]
    public async Task<IActionResult> MarkAllAsRead()
    {
        var userId = _currentUserService.UserId ?? 0;
        if (userId == 0) return Unauthorized();

        await _notificationService.MarkAllAsReadAsync(userId);
        return Ok(new { succeeded = true, message = "All notifications marked as read" });
    }
}
