using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using SmartElderlyCare.Application.DTOs.Notification;

namespace SmartElderlyCare.Application.Interfaces;

/// <summary>
/// Interface for SignalR hub operations (to avoid referencing API from Infrastructure)
/// </summary>
public interface INotificationHubContext
{
    Task SendToUserAsync(int userId, RealTimeNotificationDto notification);
    Task SendToRoleAsync(string role, RealTimeNotificationDto notification);
    Task BroadcastAsync(RealTimeNotificationDto notification);
    Task UpdateUnreadCountAsync(int userId, int count);
}