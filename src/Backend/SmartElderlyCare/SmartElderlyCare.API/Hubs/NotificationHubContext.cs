using Microsoft.AspNetCore.SignalR;
using SmartElderlyCare.Application.DTOs.Notification;
using SmartElderlyCare.Application.Interfaces;

namespace SmartElderlyCare.API.Hubs;

/// <summary>
/// Implementation of notification hub context for SignalR
/// </summary>
public class NotificationHubContext : INotificationHubContext
{
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly ILogger<NotificationHubContext> _logger;

    public NotificationHubContext(
        IHubContext<NotificationHub> hubContext,
        ILogger<NotificationHubContext> logger)
    {
        _hubContext = hubContext;
        _logger = logger;
    }

    public async Task SendToUserAsync(int userId, RealTimeNotificationDto notification)
    {
        try
        {
            await _hubContext.Clients.Group($"user-{userId}").SendAsync("ReceiveNotification", notification);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error sending notification to user {userId}");
        }
    }

    public async Task SendToRoleAsync(string role, RealTimeNotificationDto notification)
    {
        try
        {
            await _hubContext.Clients.Group(role.ToLower()).SendAsync("ReceiveNotification", notification);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error sending notification to role {role}");
        }
    }

    public async Task BroadcastAsync(RealTimeNotificationDto notification)
    {
        try
        {
            await _hubContext.Clients.All.SendAsync("ReceiveNotification", notification);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error broadcasting notification");
        }
    }

    public async Task UpdateUnreadCountAsync(int userId, int count)
    {
        try
        {
            await _hubContext.Clients.Group($"user-{userId}").SendAsync("UnreadCountUpdated", new
            {
                UserId = userId,
                UnreadCount = count
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error updating unread count for user {userId}");
        }
    }
}