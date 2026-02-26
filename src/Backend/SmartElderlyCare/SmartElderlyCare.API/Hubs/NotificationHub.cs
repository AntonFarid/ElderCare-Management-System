using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using SmartElderlyCare.Application.Interfaces;
using System.Security.Claims;

namespace SmartElderlyCare.API.Hubs;

/// <summary>
/// SignalR hub for real-time notifications
/// </summary>
[Authorize]
public class NotificationHub : Hub
{
    private readonly ILogger<NotificationHub> _logger;
    private static readonly Dictionary<string, string> _userConnections = new();

    public NotificationHub(ILogger<NotificationHub> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Called when a client connects
    /// </summary>
    public override async Task OnConnectedAsync()
    {
        var userId = Context.User?.FindFirstValue("userId");
        var connectionId = Context.ConnectionId;

        if (!string.IsNullOrEmpty(userId))
        {
            lock (_userConnections)
            {
                _userConnections[userId] = connectionId;
            }

            await Groups.AddToGroupAsync(connectionId, $"user-{userId}");

            // Also add to role-based groups
            if (Context.User.IsInRole("Admin"))
                await Groups.AddToGroupAsync(connectionId, "admins");

            if (Context.User.IsInRole("TeamLeader"))
                await Groups.AddToGroupAsync(connectionId, "teamLeaders");

            if (Context.User.IsInRole("Employee"))
                await Groups.AddToGroupAsync(connectionId, "employees");

            if (Context.User.IsInRole("FamilyMember"))
                await Groups.AddToGroupAsync(connectionId, "familyMembers");

            _logger.LogInformation($"Client connected: User {userId}, Connection {connectionId}");
        }

        await base.OnConnectedAsync();
    }

    /// <summary>
    /// Called when a client disconnects
    /// </summary>
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.User?.FindFirstValue("userId");
        var connectionId = Context.ConnectionId;

        if (!string.IsNullOrEmpty(userId))
        {
            lock (_userConnections)
            {
                _userConnections.Remove(userId);
            }

            _logger.LogInformation($"Client disconnected: User {userId}, Connection {connectionId}");
        }

        await base.OnDisconnectedAsync(exception);
    }

    /// <summary>
    /// Send a notification to a specific user
    /// </summary>
    public async Task SendToUser(string userId, string title, string message, string type)
    {
        await Clients.Group($"user-{userId}").SendAsync("ReceiveNotification", new
        {
            Title = title,
            Message = message,
            Type = type,
            Timestamp = DateTime.UtcNow,
            IsRead = false
        });
    }

    /// <summary>
    /// Send a notification to all users in a role
    /// </summary>
    public async Task SendToRole(string role, string title, string message, string type)
    {
        await Clients.Group(role).SendAsync("ReceiveNotification", new
        {
            Title = title,
            Message = message,
            Type = type,
            Timestamp = DateTime.UtcNow,
            IsRead = false
        });
    }

    /// <summary>
    /// Broadcast to all connected clients
    /// </summary>
    public async Task Broadcast(string title, string message, string type)
    {
        await Clients.All.SendAsync("ReceiveNotification", new
        {
            Title = title,
            Message = message,
            Type = type,
            Timestamp = DateTime.UtcNow,
            IsRead = false
        });
    }

    /// <summary>
    /// Get connection ID for a user
    /// </summary>
    public static string? GetConnectionId(string userId)
    {
        lock (_userConnections)
        {
            return _userConnections.TryGetValue(userId, out var connectionId) ? connectionId : null;
        }
    }
}