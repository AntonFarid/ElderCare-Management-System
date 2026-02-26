using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SmartElderlyCare.Application.DTOs.Notification;
using SmartElderlyCare.Application.Interfaces;
using SmartElderlyCare.Domain.Entities;
using SmartElderlyCare.Domain.Enums;
using SmartElderlyCare.Domain.Interfaces;
using SmartElderlyCare.Infrastructure.Data.Context;

namespace SmartElderlyCare.Infrastructure.Services;

/// <summary>
/// Notification service implementation with SignalR integration
/// </summary>
public class NotificationService : INotificationService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly ILogger<NotificationService> _logger;
    private readonly ApplicationDbContext _context;
    private readonly INotificationHubContext _hubContext;

    public NotificationService(
        IUnitOfWork unitOfWork,
        IMapper mapper,
        ILogger<NotificationService> logger,
        ApplicationDbContext context,
        INotificationHubContext hubContext)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _logger = logger;
        _context = context;
        _hubContext = hubContext;
    }

    #region Database Operations

    /// <summary>
    /// Create a notification in the database
    /// </summary>
    public async Task<NotificationDto> CreateNotificationAsync(CreateNotificationDto createDto)
    {
        try
        {
            _logger.LogInformation($"Creating notification for user {createDto.UserId}");

            var notification = _mapper.Map<Notification>(createDto);
            notification.CreatedAt = DateTime.UtcNow;
            notification.IsRead = false;

            await _unitOfWork.Repository<Notification>().AddAsync(notification);
            await _unitOfWork.CompleteAsync();

            var notificationDto = _mapper.Map<NotificationDto>(notification);

            // Also send real-time notification
            await SendRealTimeNotificationAsync(
                createDto.UserId,
                createDto.Title,
                createDto.Message,
                createDto.NotificationType.ToString()
            );

            return notificationDto;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating notification");
            throw;
        }
    }

    /// <summary>
    /// Mark a notification as read
    /// </summary>
    public async Task MarkAsReadAsync(int notificationId, int userId)
    {
        try
        {
            _logger.LogInformation($"Marking notification {notificationId} as read for user {userId}");

            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);

            if (notification != null)
            {
                notification.IsRead = true;
                notification.UpdatedAt = DateTime.UtcNow;
                await _unitOfWork.CompleteAsync();

                // Send unread count update
                var unreadCount = await GetUnreadCountAsync(userId);
                await _hubContext.UpdateUnreadCountAsync(userId, unreadCount);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error marking notification {notificationId} as read");
            throw;
        }
    }

    /// <summary>
    /// Mark all notifications as read for a user
    /// </summary>
    public async Task MarkAllAsReadAsync(int userId)
    {
        try
        {
            _logger.LogInformation($"Marking all notifications as read for user {userId}");

            var unreadNotifications = await _context.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .ToListAsync();

            foreach (var notification in unreadNotifications)
            {
                notification.IsRead = true;
                notification.UpdatedAt = DateTime.UtcNow;
            }

            await _unitOfWork.CompleteAsync();

            // Send unread count update
            await _hubContext.UpdateUnreadCountAsync(userId, 0);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error marking all notifications as read for user {userId}");
            throw;
        }
    }

    /// <summary>
    /// Get user notifications with pagination
    /// </summary>
    public async Task<List<NotificationDto>> GetUserNotificationsAsync(int userId, int page = 1, int pageSize = 20)
    {
        try
        {
            _logger.LogInformation($"Getting notifications for user {userId}");

            var notifications = await _context.Notifications
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return _mapper.Map<List<NotificationDto>>(notifications);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error getting notifications for user {userId}");
            throw;
        }
    }

    /// <summary>
    /// Get unread count for a user
    /// </summary>
    public async Task<int> GetUnreadCountAsync(int userId)
    {
        try
        {
            return await _context.Notifications
                .CountAsync(n => n.UserId == userId && !n.IsRead);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error getting unread count for user {userId}");
            throw;
        }
    }

    #endregion

    #region Real-time Operations

    /// <summary>
    /// Send real-time notification to a specific user
    /// </summary>
    public async Task SendRealTimeNotificationAsync(int userId, string title, string message, string type)
    {
        try
        {
            var notification = new RealTimeNotificationDto
            {
                Title = title,
                Message = message,
                Type = type,
                Severity = GetSeverityFromType(type),
                Timestamp = DateTime.UtcNow,
                IsRead = false,
                Data = new Dictionary<string, object>
                {
                    ["userId"] = userId
                }
            };

            await _hubContext.SendToUserAsync(userId, notification);
            _logger.LogInformation($"Real-time notification sent to user {userId}: {title}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error sending real-time notification to user {userId}");
        }
    }

    /// <summary>
    /// Send real-time notification to all users in a role
    /// </summary>
    public async Task SendRealTimeNotificationToRoleAsync(string role, string title, string message, string type)
    {
        try
        {
            var notification = new RealTimeNotificationDto
            {
                Title = title,
                Message = message,
                Type = type,
                Severity = GetSeverityFromType(type),
                Timestamp = DateTime.UtcNow,
                IsRead = false,
                Data = new Dictionary<string, object>
                {
                    ["role"] = role
                }
            };

            await _hubContext.SendToRoleAsync(role, notification);
            _logger.LogInformation($"Real-time notification sent to role {role}: {title}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error sending real-time notification to role {role}");
        }
    }

    /// <summary>
    /// Broadcast real-time notification to all connected clients
    /// </summary>
    public async Task BroadcastRealTimeNotificationAsync(string title, string message, string type)
    {
        try
        {
            var notification = new RealTimeNotificationDto
            {
                Title = title,
                Message = message,
                Type = type,
                Severity = GetSeverityFromType(type),
                Timestamp = DateTime.UtcNow,
                IsRead = false
            };

            await _hubContext.BroadcastAsync(notification);
            _logger.LogInformation($"Broadcast notification sent: {title}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error broadcasting real-time notification");
        }
    }

    #endregion

    #region Business Notifications

    /// <summary>
    /// Notify when a report is approved
    /// </summary>
    public async Task NotifyReportApprovedAsync(int reportId, int elderlyId, int employeeId)
    {
        try
        {
            var elderly = await _context.Elderlies.FindAsync(elderlyId);
            var elderlyName = elderly != null ? $"{elderly.FirstName} {elderly.LastName}" : "Resident";

            // Create database notification for employee
            var notification = new CreateNotificationDto
            {
                UserId = employeeId,
                Title = "Report Approved",
                Message = $"Your report for {elderlyName} has been approved.",
                NotificationType = NotificationType.ReportApproved.ToString(),
                RelatedEntityId = reportId,
                RelatedEntityType = "DailyReport"
            };

            await CreateNotificationAsync(notification);

            // Also notify family members (if any)
            var familyMembers = await _context.ElderlyFamilyMembers
                .Where(f => f.ElderlyId == elderlyId && !f.IsDeleted)
                .Select(f => f.FamilyMemberId)
                .ToListAsync();

            foreach (var familyId in familyMembers)
            {
                var familyNotification = new CreateNotificationDto
                {
                    UserId = familyId,
                    Title = "Health Update Available",
                    Message = $"A new approved health report for {elderlyName} is now available.",
                    NotificationType = NotificationType.ReportApproved.ToString(),
                    RelatedEntityId = reportId,
                    RelatedEntityType = "DailyReport"
                };
                await CreateNotificationAsync(familyNotification);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error sending report approved notifications for report {reportId}");
        }
    }

    /// <summary>
    /// Notify when a report is rejected
    /// </summary>
    public async Task NotifyReportRejectedAsync(int reportId, int elderlyId, int employeeId, string reason)
    {
        try
        {
            var elderly = await _context.Elderlies.FindAsync(elderlyId);
            var elderlyName = elderly != null ? $"{elderly.FirstName} {elderly.LastName}" : "Resident";

            var notification = new CreateNotificationDto
            {
                UserId = employeeId,
                Title = "Report Rejected",
                Message = $"Your report for {elderlyName} was rejected. Reason: {reason}",
                NotificationType = NotificationType.ReportRejected.ToString(),
                RelatedEntityId = reportId,
                RelatedEntityType = "DailyReport"
            };

            await CreateNotificationAsync(notification);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error sending report rejected notifications for report {reportId}");
        }
    }

    /// <summary>
    /// Notify team leaders about new pending report
    /// </summary>
    public async Task NotifyNewReportPendingAsync(int reportId, int elderlyId)
    {
        try
        {
            var elderly = await _context.Elderlies.FindAsync(elderlyId);
            var elderlyName = elderly != null ? $"{elderly.FirstName} {elderly.LastName}" : "Resident";

            await SendRealTimeNotificationToRoleAsync(
                "teamLeaders",
                "New Report Pending",
                $"A new report for {elderlyName} requires your approval.",
                "ReportPending"
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error sending new report pending notification for report {reportId}");
        }
    }

    /// <summary>
    /// Notify when a visit is approved
    /// </summary>
    public async Task NotifyVisitApprovedAsync(int visitId, int familyMemberId, int elderlyId)
    {
        try
        {
            var elderly = await _context.Elderlies.FindAsync(elderlyId);
            var elderlyName = elderly != null ? $"{elderly.FirstName} {elderly.LastName}" : "Resident";
            var visit = await _context.VisitRequests.FindAsync(visitId);

            var notification = new CreateNotificationDto
            {
                UserId = familyMemberId,
                Title = "Visit Approved",
                Message = $"Your visit request for {elderlyName} on {visit?.RequestedDate:yyyy-MM-dd} has been approved.",
                NotificationType = NotificationType.VisitRequest.ToString(),
                RelatedEntityId = visitId,
                RelatedEntityType = "VisitRequest"
            };

            await CreateNotificationAsync(notification);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error sending visit approved notification for visit {visitId}");
        }
    }

    /// <summary>
    /// Notify when a visit is rejected
    /// </summary>
    public async Task NotifyVisitRejectedAsync(int visitId, int familyMemberId, int elderlyId, string reason)
    {
        try
        {
            var elderly = await _context.Elderlies.FindAsync(elderlyId);
            var elderlyName = elderly != null ? $"{elderly.FirstName} {elderly.LastName}" : "Resident";

            var notification = new CreateNotificationDto
            {
                UserId = familyMemberId,
                Title = "Visit Request Rejected",
                Message = $"Your visit request for {elderlyName} was rejected. Reason: {reason}",
                NotificationType = NotificationType.VisitRequest.ToString(),
                RelatedEntityId = visitId,
                RelatedEntityType = "VisitRequest"
            };

            await CreateNotificationAsync(notification);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error sending visit rejected notification for visit {visitId}");
        }
    }

    /// <summary>
    /// Notify team leaders about new visit request
    /// </summary>
    public async Task NotifyNewVisitRequestAsync(int visitId, int elderlyId)
    {
        try
        {
            var elderly = await _context.Elderlies.FindAsync(elderlyId);
            var elderlyName = elderly != null ? $"{elderly.FirstName} {elderly.LastName}" : "Resident";

            await SendRealTimeNotificationToRoleAsync(
                "teamLeaders",
                "New Visit Request",
                $"A new visit request for {elderlyName} requires your approval.",
                "VisitPending"
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error sending new visit request notification for visit {visitId}");
        }
    }

    /// <summary>
    /// Notify about health alerts
    /// </summary>
    public async Task NotifyHealthAlertAsync(int elderlyId, string alertType, string message, string severity)
    {
        try
        {
            var elderly = await _context.Elderlies.FindAsync(elderlyId);
            var elderlyName = elderly != null ? $"{elderly.FirstName} {elderly.LastName}" : "Resident";

            // Notify family members
            var familyMembers = await _context.ElderlyFamilyMembers
                .Where(f => f.ElderlyId == elderlyId && !f.IsDeleted)
                .Select(f => f.FamilyMemberId)
                .ToListAsync();

            foreach (var familyId in familyMembers)
            {
                var notification = new CreateNotificationDto
                {
                    UserId = familyId,
                    Title = $"Health Alert: {alertType}",
                    Message = $"{elderlyName}: {message}",
                    NotificationType = NotificationType.HealthAlert.ToString(),
                    RelatedEntityId = elderlyId,
                    RelatedEntityType = "Elderly"
                };
                await CreateNotificationAsync(notification);
            }

            // Notify team leaders
            await SendRealTimeNotificationToRoleAsync(
                "teamLeaders",
                $"Health Alert: {alertType}",
                $"{elderlyName}: {message}",
                severity
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error sending health alert notification for elderly {elderlyId}");
        }
    }

    /// <summary>
    /// Notify about schedule changes
    /// </summary>
    public async Task NotifyScheduleChangedAsync(int employeeId, DateTime shiftDate)
    {
        try
        {
            var notification = new CreateNotificationDto
            {
                UserId = employeeId,
                Title = "Schedule Updated",
                Message = $"Your schedule for {shiftDate:yyyy-MM-dd} has been updated.",
                NotificationType = NotificationType.ScheduleChange.ToString(),
                RelatedEntityId = employeeId,
                RelatedEntityType = "WorkSchedule"
            };

            await CreateNotificationAsync(notification);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error sending schedule change notification for employee {employeeId}");
        }
    }

    #endregion

    #region Helper Methods

    /// <summary>
    /// Get severity level from notification type
    /// </summary>
    private string GetSeverityFromType(string type)
    {
        return type.ToLower() switch
        {
            "healthalert" => "Warning",
            "error" => "Error",
            "success" => "Success",
            "warning" => "Warning",
            "info" => "Info",
            _ => "Info"
        };
    }

    #endregion
}