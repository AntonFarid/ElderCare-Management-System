using SmartElderlyCare.Application.DTOs.Common;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
namespace SmartElderlyCare.Application.DTOs.Notification;

/// <summary>
/// Notification DTO
/// </summary>
public class NotificationDto : BaseDto
{
    public int UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string NotificationType { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public int? RelatedEntityId { get; set; }
    public string? RelatedEntityType { get; set; }
}

/// <summary>
/// Create notification DTO
/// </summary>
public class CreateNotificationDto
{
    public int UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string NotificationType { get; set; } = string.Empty;
    public int? RelatedEntityId { get; set; }
    public string? RelatedEntityType { get; set; }
}

/// <summary>
/// Mark notification as read DTO
/// </summary>
public class MarkAsReadDto
{
    public List<int> NotificationIds { get; set; } = new();
}

/// <summary>
/// Notification summary DTO
/// </summary>
public class NotificationSummaryDto
{
    public int TotalUnread { get; set; }
    public List<NotificationDto> RecentNotifications { get; set; } = new();
}