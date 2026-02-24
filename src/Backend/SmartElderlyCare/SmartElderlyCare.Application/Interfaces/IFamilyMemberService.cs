using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using SmartElderlyCare.Application.DTOs.Common;
using SmartElderlyCare.Application.DTOs.DailyReport;
using SmartElderlyCare.Application.DTOs.Elderly;
using SmartElderlyCare.Application.DTOs.Notification;
using SmartElderlyCare.Application.DTOs.User;
using SmartElderlyCare.Application.DTOs.Visit;
using SmartElderlyCare.Application.DTOs.Family;
using SmartElderlyCare.Application.Wrappers;

namespace SmartElderlyCare.Application.Interfaces;

/// <summary>
/// Service interface for family member operations
/// </summary>
public interface IFamilyMemberService
{
    // Profile Management
    Task<Response<UserDto>> GetProfileAsync(int familyMemberId);
    Task<Response<UserDto>> UpdateProfileAsync(int familyMemberId, UpdateUserDto updateDto);

    // Elderly Management
    Task<Response<List<ElderlyDto>>> GetLinkedElderlyAsync(int familyMemberId);
    Task<Response<ElderlyDetailDto>> GetElderlyDetailsAsync(int familyMemberId, int elderlyId);

    // Approved Reports Viewing
    Task<Response<PaginatedResponse<List<DailyReportDto>>>> GetApprovedReportsAsync(
        int familyMemberId, int elderlyId, ReportFilterParameters parameters);
    Task<Response<DailyReportDto>> GetApprovedReportByIdAsync(int familyMemberId, int reportId);
    Task<Response<ReportSummaryDto>> GetReportsSummaryAsync(int familyMemberId, int elderlyId);

    // Health Trends
    Task<Response<HealthTrendsDto>> GetHealthTrendsAsync(int familyMemberId, int elderlyId, DateTime? fromDate, DateTime? toDate);
    Task<Response<List<HealthMetricTrendDto>>> GetMetricTrendsAsync(
        int familyMemberId, int elderlyId, string metricType, int days = 30);

    // Notifications
    Task<Response<PaginatedResponse<List<NotificationDto>>>> GetNotificationsAsync(
        int familyMemberId, PaginationParameters parameters, bool unreadOnly = false);
    Task<Response<NotificationDto>> MarkNotificationAsReadAsync(int familyMemberId, int notificationId);
    Task<Response<bool>> MarkAllNotificationsAsReadAsync(int familyMemberId);
    Task<Response<NotificationSummaryDto>> GetNotificationSummaryAsync(int familyMemberId);

    // Visit Scheduling
    Task<Response<VisitRequestDto>> ScheduleVisitAsync(int familyMemberId, CreateVisitRequestDto createDto);
    Task<Response<VisitRequestDto>> UpdateVisitRequestAsync(int familyMemberId, int visitId, CreateVisitRequestDto updateDto);
    Task<Response<bool>> CancelVisitRequestAsync(int familyMemberId, int visitId);
    Task<Response<PaginatedResponse<List<VisitRequestDto>>>> GetVisitRequestsAsync(
        int familyMemberId, VisitFilterParameters parameters);
    Task<Response<VisitRequestDto>> GetVisitRequestByIdAsync(int familyMemberId, int visitId);

    // Dashboard
    Task<Response<FamilyDashboardDto>> GetDashboardDataAsync(int familyMemberId);
}