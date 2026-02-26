using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using SmartElderlyCare.Application.DTOs.Notification;

namespace SmartElderlyCare.Application.Interfaces;

/// <summary>
/// Service interface for managing notifications (both database and real-time)
/// </summary>
public interface INotificationService
{
    // Database operations
    Task<NotificationDto> CreateNotificationAsync(CreateNotificationDto createDto);
    Task MarkAsReadAsync(int notificationId, int userId);
    Task MarkAllAsReadAsync(int userId);
    Task<List<NotificationDto>> GetUserNotificationsAsync(int userId, int page = 1, int pageSize = 20);
    Task<int> GetUnreadCountAsync(int userId);

    // Real-time operations
    Task SendRealTimeNotificationAsync(int userId, string title, string message, string type);
    Task SendRealTimeNotificationToRoleAsync(string role, string title, string message, string type);
    Task BroadcastRealTimeNotificationAsync(string title, string message, string type);

    // High-level business notifications
    Task NotifyReportApprovedAsync(int reportId, int elderlyId, int employeeId);
    Task NotifyReportRejectedAsync(int reportId, int elderlyId, int employeeId, string reason);
    Task NotifyNewReportPendingAsync(int reportId, int elderlyId);
    Task NotifyVisitApprovedAsync(int visitId, int familyMemberId, int elderlyId);
    Task NotifyVisitRejectedAsync(int visitId, int familyMemberId, int elderlyId, string reason);
    Task NotifyNewVisitRequestAsync(int visitId, int elderlyId);
    Task NotifyHealthAlertAsync(int elderlyId, string alertType, string message, string severity);
    Task NotifyScheduleChangedAsync(int employeeId, DateTime shiftDate);
}