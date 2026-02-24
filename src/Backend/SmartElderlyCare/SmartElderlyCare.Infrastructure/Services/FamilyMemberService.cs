using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SmartElderlyCare.Application.Common.Exceptions;
using SmartElderlyCare.Application.DTOs.Common;
using SmartElderlyCare.Application.DTOs.DailyReport;
using SmartElderlyCare.Application.DTOs.Elderly;
using SmartElderlyCare.Application.DTOs.Family;
using SmartElderlyCare.Application.DTOs.Notification;
using SmartElderlyCare.Application.DTOs.User;
using SmartElderlyCare.Application.DTOs.Visit;
using SmartElderlyCare.Application.Interfaces;
using SmartElderlyCare.Application.Wrappers;
using SmartElderlyCare.Domain.Entities;
using SmartElderlyCare.Domain.Enums;
using SmartElderlyCare.Domain.Interfaces;
using SmartElderlyCare.Infrastructure.Data.Context;

namespace SmartElderlyCare.Infrastructure.Services;

/// <summary>
/// Family Member service implementation
/// </summary>
public class FamilyMemberService : IFamilyMemberService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly ILogger<FamilyMemberService> _logger;
    private readonly UserManager<User> _userManager;
    private readonly ApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public FamilyMemberService(
        IUnitOfWork unitOfWork,
        IMapper mapper,
        ILogger<FamilyMemberService> logger,
        UserManager<User> userManager,
        ApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _logger = logger;
        _userManager = userManager;
        _context = context;
        _currentUserService = currentUserService;
    }

    #region Profile Management

    /// <summary>
    /// Get family member profile
    /// </summary>
    public async Task<Response<UserDto>> GetProfileAsync(int familyMemberId)
    {
        try
        {
            _logger.LogInformation($"Getting profile for family member ID: {familyMemberId}");

            var user = await _userManager.FindByIdAsync(familyMemberId.ToString());
            if (user == null)
            {
                throw new NotFoundException($"Family member with ID {familyMemberId} not found");
            }

            if (user.UserType != UserType.FamilyMember)
            {
                throw new ForbiddenException("User is not a family member");
            }

            var userDto = _mapper.Map<UserDto>(user);
            var roles = await _userManager.GetRolesAsync(user);
            userDto.Roles = roles.ToList();

            return new Response<UserDto>(userDto, "Profile retrieved successfully");
        }
        catch (Exception ex) when (ex is not NotFoundException && ex is not ForbiddenException)
        {
            _logger.LogError(ex, $"Error getting profile for family member {familyMemberId}");
            throw;
        }
    }

    /// <summary>
    /// Update family member profile
    /// </summary>
    public async Task<Response<UserDto>> UpdateProfileAsync(int familyMemberId, UpdateUserDto updateDto)
    {
        try
        {
            _logger.LogInformation($"Updating profile for family member ID: {familyMemberId}");

            var user = await _userManager.FindByIdAsync(familyMemberId.ToString());
            if (user == null)
            {
                throw new NotFoundException($"Family member with ID {familyMemberId} not found");
            }

            _mapper.Map(updateDto, user);
            user.UpdatedAt = DateTime.UtcNow;
            user.UpdatedBy = _currentUserService.UserId?.ToString() ?? "System";

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
            {
                var errors = result.Errors.ToDictionary(
                    e => e.Code,
                    e => new[] { e.Description }
                );
                throw new ValidationException("Profile update failed", errors);
            }

            var userDto = _mapper.Map<UserDto>(user);
            var roles = await _userManager.GetRolesAsync(user);
            userDto.Roles = roles.ToList();

            return new Response<UserDto>(userDto, "Profile updated successfully");
        }
        catch (Exception ex) when (ex is not NotFoundException && ex is not ValidationException)
        {
            _logger.LogError(ex, $"Error updating profile for family member {familyMemberId}");
            throw;
        }
    }

    #endregion

    #region Elderly Management

    /// <summary>
    /// Get elderly residents linked to the family member
    /// </summary>
    public async Task<Response<List<ElderlyDto>>> GetLinkedElderlyAsync(int familyMemberId)
    {
        try
        {
            _logger.LogInformation($"Getting linked elderly for family member ID: {familyMemberId}");

            var links = await _context.ElderlyFamilyMembers
                .Include(f => f.Elderly)
                .Where(f => f.FamilyMemberId == familyMemberId && !f.IsDeleted)
                .Select(f => f.Elderly)
                .Where(e => e.IsActive && !e.IsDeleted)
                .ToListAsync();

            var elderlyDtos = _mapper.Map<List<ElderlyDto>>(links);

            return new Response<List<ElderlyDto>>(elderlyDtos, "Linked elderly retrieved successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error getting linked elderly for family member {familyMemberId}");
            throw;
        }
    }

    /// <summary>
    /// Get detailed information for a specific elderly resident
    /// </summary>
    public async Task<Response<ElderlyDetailDto>> GetElderlyDetailsAsync(int familyMemberId, int elderlyId)
    {
        try
        {
            _logger.LogInformation($"Getting elderly details for family member {familyMemberId}, elderly {elderlyId}");

            // Verify family member has access to this elderly
            var hasAccess = await _context.ElderlyFamilyMembers
                .AnyAsync(f => f.FamilyMemberId == familyMemberId &&
                              f.ElderlyId == elderlyId &&
                              !f.IsDeleted);

            if (!hasAccess)
            {
                throw new ForbiddenException("You do not have access to this elderly resident");
            }

            var elderly = await _context.Elderlies
                .Include(e => e.EmployeeAssignments)
                    .ThenInclude(a => a.Employee)
                .Include(e => e.FamilyMembers)
                    .ThenInclude(f => f.FamilyMember)
                .Include(e => e.DailyReports.Where(r => r.ApprovalStatus == ApprovalStatus.Approved))
                    .ThenInclude(d => d.HealthMetrics)
                .FirstOrDefaultAsync(e => e.Id == elderlyId && !e.IsDeleted);

            if (elderly == null)
            {
                throw new NotFoundException($"Elderly with ID {elderlyId} not found");
            }

            var elderlyDto = _mapper.Map<ElderlyDetailDto>(elderly);

            return new Response<ElderlyDetailDto>(elderlyDto, "Elderly details retrieved successfully");
        }
        catch (Exception ex) when (ex is not NotFoundException && ex is not ForbiddenException)
        {
            _logger.LogError(ex, $"Error getting elderly details for family member {familyMemberId}, elderly {elderlyId}");
            throw;
        }
    }

    #endregion

    #region Approved Reports Viewing

    /// <summary>
    /// Get paginated list of approved reports for an elderly
    /// </summary>
    public async Task<Response<PaginatedResponse<List<DailyReportDto>>>> GetApprovedReportsAsync(
        int familyMemberId, int elderlyId, ReportFilterParameters parameters)
    {
        try
        {
            _logger.LogInformation($"Getting approved reports for family member {familyMemberId}, elderly {elderlyId}");

            // Verify access
            var hasAccess = await _context.ElderlyFamilyMembers
                .AnyAsync(f => f.FamilyMemberId == familyMemberId &&
                              f.ElderlyId == elderlyId &&
                              !f.IsDeleted);

            if (!hasAccess)
            {
                throw new ForbiddenException("You do not have access to this elderly resident");
            }

            var query = _context.DailyReports
                .Include(r => r.Employee)
                .Include(r => r.HealthMetrics)
                .Where(r => r.ElderlyId == elderlyId &&
                           r.ApprovalStatus == ApprovalStatus.Approved &&
                           !r.IsDeleted)
                .AsQueryable();

            // Apply filters
            if (parameters.FromDate.HasValue)
            {
                query = query.Where(r => r.ReportDate >= parameters.FromDate.Value);
            }

            if (parameters.ToDate.HasValue)
            {
                var toDate = parameters.ToDate.Value.Date.AddDays(1).AddSeconds(-1);
                query = query.Where(r => r.ReportDate <= toDate);
            }

            // Apply sorting (newest first by default)
            query = parameters.SortBy?.ToLower() switch
            {
                "reportdate" => parameters.SortDescending
                    ? query.OrderByDescending(r => r.ReportDate)
                    : query.OrderBy(r => r.ReportDate),
                _ => query.OrderByDescending(r => r.ReportDate)
            };

            var totalCount = await query.CountAsync();

            var reports = await query
                .Skip((parameters.PageNumber - 1) * parameters.PageSize)
                .Take(parameters.PageSize)
                .ToListAsync();

            var reportDtos = _mapper.Map<List<DailyReportDto>>(reports);

            var paginatedResponse = new PaginatedResponse<List<DailyReportDto>>(
                reportDtos, parameters.PageNumber, parameters.PageSize, totalCount);

            return new Response<PaginatedResponse<List<DailyReportDto>>> (
                paginatedResponse, "Approved reports retrieved successfully");
        }
        catch (Exception ex) when (ex is not ForbiddenException)
        {
            _logger.LogError(ex, $"Error getting approved reports for family member {familyMemberId}, elderly {elderlyId}");
            throw;
        }
    }

    /// <summary>
    /// Get approved report by ID
    /// </summary>
    public async Task<Response<DailyReportDto>> GetApprovedReportByIdAsync(int familyMemberId, int reportId)
    {
        try
        {
            _logger.LogInformation($"Getting approved report {reportId} for family member {familyMemberId}");

            var report = await _context.DailyReports
                .Include(r => r.Employee)
                .Include(r => r.Elderly)
                .Include(r => r.HealthMetrics)
                .FirstOrDefaultAsync(r => r.Id == reportId &&
                                         r.ApprovalStatus == ApprovalStatus.Approved &&
                                         !r.IsDeleted);

            if (report == null)
            {
                throw new NotFoundException($"Approved report with ID {reportId} not found");
            }

            // Verify family member has access to this elderly
            var hasAccess = await _context.ElderlyFamilyMembers
                .AnyAsync(f => f.FamilyMemberId == familyMemberId &&
                              f.ElderlyId == report.ElderlyId &&
                              !f.IsDeleted);

            if (!hasAccess)
            {
                throw new ForbiddenException("You do not have access to this report");
            }

            var reportDto = _mapper.Map<DailyReportDto>(report);

            return new Response<DailyReportDto>(reportDto, "Report retrieved successfully");
        }
        catch (Exception ex) when (ex is not NotFoundException && ex is not ForbiddenException)
        {
            _logger.LogError(ex, $"Error getting approved report {reportId} for family member {familyMemberId}");
            throw;
        }
    }

    /// <summary>
    /// Get reports summary for an elderly
    /// </summary>
    public async Task<Response<ReportSummaryDto>> GetReportsSummaryAsync(int familyMemberId, int elderlyId)
    {
        try
        {
            _logger.LogInformation($"Getting reports summary for family member {familyMemberId}, elderly {elderlyId}");

            // Verify access
            var hasAccess = await _context.ElderlyFamilyMembers
                .AnyAsync(f => f.FamilyMemberId == familyMemberId &&
                              f.ElderlyId == elderlyId &&
                              !f.IsDeleted);

            if (!hasAccess)
            {
                throw new ForbiddenException("You do not have access to this elderly resident");
            }

            var reports = await _context.DailyReports
                .Include(r => r.Employee)
                .Include(r => r.Elderly)
                .Where(r => r.ElderlyId == elderlyId &&
                           r.ApprovalStatus == ApprovalStatus.Approved &&
                           !r.IsDeleted)
                .ToListAsync();

            var summary = new ReportSummaryDto
            {
                TotalReports = reports.Count,
                RecentReports = _mapper.Map<List<ReportApprovalHistoryDto>>(
                    reports.OrderByDescending(r => r.ReportDate).Take(5))
            };

            // Calculate statistics for last 30 days
            var last30Days = DateTime.Today.AddDays(-30);
            var recentReports = reports.Where(r => r.ReportDate >= last30Days).ToList();

            summary.ApprovalRate = 100; // All are approved since we filter
            summary.PendingReports = 0;
            summary.ApprovedReports = recentReports.Count;
            summary.RejectedReports = 0;

            return new Response<ReportSummaryDto>(summary, "Reports summary retrieved successfully");
        }
        catch (Exception ex) when (ex is not ForbiddenException)
        {
            _logger.LogError(ex, $"Error getting reports summary for family member {familyMemberId}, elderly {elderlyId}");
            throw;
        }
    }

    #endregion

    #region Health Trends

    /// <summary>
    /// Get health trends for an elderly
    /// </summary>
    public async Task<Response<HealthTrendsDto>> GetHealthTrendsAsync(
        int familyMemberId, int elderlyId, DateTime? fromDate, DateTime? toDate)
    {
        try
        {
            _logger.LogInformation($"Getting health trends for family member {familyMemberId}, elderly {elderlyId}");

            // Verify access
            var hasAccess = await _context.ElderlyFamilyMembers
                .AnyAsync(f => f.FamilyMemberId == familyMemberId &&
                              f.ElderlyId == elderlyId &&
                              !f.IsDeleted);

            if (!hasAccess)
            {
                throw new ForbiddenException("You do not have access to this elderly resident");
            }

            var elderly = await _context.Elderlies
                .FirstOrDefaultAsync(e => e.Id == elderlyId && !e.IsDeleted);

            if (elderly == null)
            {
                throw new NotFoundException($"Elderly with ID {elderlyId} not found");
            }

            var endDate = toDate ?? DateTime.Today;
            var startDate = fromDate ?? endDate.AddDays(-30);

            var reports = await _context.DailyReports
                .Include(r => r.HealthMetrics)
                .Where(r => r.ElderlyId == elderlyId &&
                           r.ApprovalStatus == ApprovalStatus.Approved &&
                           r.ReportDate >= startDate &&
                           r.ReportDate <= endDate &&
                           !r.IsDeleted)
                .OrderBy(r => r.ReportDate)
                .ToListAsync();

            var trends = new HealthTrendsDto
            {
                ElderlyId = elderlyId,
                ElderlyName = $"{elderly.FirstName} {elderly.LastName}",
                FromDate = startDate,
                ToDate = endDate,
                TotalReports = reports.Count,
                MetricTrends = new List<HealthMetricTrendDto>(),
                DailySummaries = new List<DailySummaryDto>()
            };

            // Group metrics by type
            var metricsByType = reports
                .SelectMany(r => r.HealthMetrics)
                .GroupBy(m => m.MetricType);

            foreach (var group in metricsByType)
            {
                var metricType = group.Key.ToString();
                var metricName = group.First().MetricName;
                var dataPoints = group.Select(m => new MetricDataPointDto
                {
                    Date = m.CreatedAt,
                    Value = double.TryParse(m.MetricValue, out double val) ? val : 0,
                    Unit = m.Unit,
                    Notes = m.Notes
                }).OrderBy(m => m.Date).ToList();

                var values = dataPoints.Select(d => d.Value).Where(v => v > 0).ToList();
                var average = values.Any() ? values.Average() : 0;
                var min = values.Any() ? values.Min() : 0;
                var max = values.Any() ? values.Max() : 0;

                // Determine trend
                var trend = "Stable";
                if (values.Count >= 3)
                {
                    var firstHalf = values.Take(values.Count / 2).Average();
                    var secondHalf = values.Skip(values.Count / 2).Average();
                    if (secondHalf > firstHalf * 1.1) trend = "Improving";
                    else if (secondHalf < firstHalf * 0.9) trend = "Declining";
                }

                trends.MetricTrends.Add(new HealthMetricTrendDto
                {
                    MetricType = metricType,
                    MetricName = metricName,
                    DataPoints = dataPoints,
                    Average = Math.Round(average, 1),
                    Min = Math.Round(min, 1),
                    Max = Math.Round(max, 1),
                    Trend = trend
                });
            }

            // Create daily summaries
            foreach (var report in reports)
            {
                var summary = new DailySummaryDto
                {
                    Date = report.ReportDate,
                    Medications = report.HealthMetrics
                        .Where(m => m.MetricType == MetricType.Medication)
                        .Select(m => $"{m.MetricName}: {m.MetricValue}")
                        .ToList(),
                    Meals = report.HealthMetrics
                        .Where(m => m.MetricType == MetricType.Meal)
                        .Select(m => $"{m.MetricName}: {m.MetricValue}")
                        .ToList(),
                    Activities = report.HealthMetrics
                        .Where(m => m.MetricType == MetricType.Activity)
                        .Select(m => $"{m.MetricName}: {m.MetricValue} {m.Unit}")
                        .ToList(),
                    Mood = report.HealthMetrics
                        .FirstOrDefault(m => m.MetricType == MetricType.Mood)?.MetricValue,
                    Notes = report.HealthMetrics
                        .FirstOrDefault(m => !string.IsNullOrEmpty(m.Notes))?.Notes,
                    ReportStatus = "Approved"
                };
                trends.DailySummaries.Add(summary);
            }

            // Calculate medication adherence
            var medicationMetrics = reports
                .SelectMany(r => r.HealthMetrics)
                .Where(m => m.MetricType == MetricType.Medication)
                .ToList();

            if (medicationMetrics.Any())
            {
                var takenCount = medicationMetrics.Count(m =>
                    m.MetricValue.Equals("Taken", StringComparison.OrdinalIgnoreCase) ||
                    m.MetricValue.Equals("Yes", StringComparison.OrdinalIgnoreCase));
                trends.MedicationAdherenceRate = (int)Math.Round((double)takenCount / medicationMetrics.Count * 100);
            }

            // Calculate meal completion rate
            var mealMetrics = reports
                .SelectMany(r => r.HealthMetrics)
                .Where(m => m.MetricType == MetricType.Meal)
                .ToList();

            if (mealMetrics.Any())
            {
                var completionValues = mealMetrics
                    .Select(m =>
                    {
                        if (m.MetricValue.Contains("%"))
                            return int.TryParse(m.MetricValue.Replace("%", ""), out int val) ? val : 0;
                        return 0;
                    })
                    .Where(v => v > 0)
                    .ToList();

                trends.MealCompletionRate = completionValues.Any()
                    ? (int)Math.Round(completionValues.Average())
                    : 0;
            }

            return new Response<HealthTrendsDto>(trends, "Health trends retrieved successfully");
        }
        catch (Exception ex) when (ex is not NotFoundException && ex is not ForbiddenException)
        {
            _logger.LogError(ex, $"Error getting health trends for family member {familyMemberId}, elderly {elderlyId}");
            throw;
        }
    }

    /// <summary>
    /// Get metric trends for a specific metric type
    /// </summary>
    public async Task<Response<List<HealthMetricTrendDto>>> GetMetricTrendsAsync(
        int familyMemberId, int elderlyId, string metricType, int days = 30)
    {
        try
        {
            _logger.LogInformation($"Getting {metricType} trends for family member {familyMemberId}, elderly {elderlyId}");

            if (!Enum.TryParse<MetricType>(metricType, true, out var metricTypeEnum))
            {
                throw new ValidationException("Invalid metric type",
                    new Dictionary<string, string[]>
                    {
                        { "MetricType", new[] { "Valid values: Meal, Medication, Activity, Symptom, Vital, Mood" } }
                    });
            }

            var endDate = DateTime.Today;
            var startDate = endDate.AddDays(-days);

            var trends = await GetHealthTrendsAsync(familyMemberId, elderlyId, startDate, endDate);

            var metricTrends = trends.Data?.MetricTrends
                .Where(m => m.MetricType.Equals(metricType, StringComparison.OrdinalIgnoreCase))
                .ToList() ?? new List<HealthMetricTrendDto>();

            return new Response<List<HealthMetricTrendDto>>(metricTrends, "Metric trends retrieved successfully");
        }
        catch (Exception ex) when (ex is not ValidationException)
        {
            _logger.LogError(ex, $"Error getting metric trends for family member {familyMemberId}");
            throw;
        }
    }

    #endregion

    #region Notifications

    /// <summary>
    /// Get notifications for family member
    /// </summary>
    public async Task<Response<PaginatedResponse<List<NotificationDto>>>> GetNotificationsAsync(
        int familyMemberId, PaginationParameters parameters, bool unreadOnly = false)
    {
        try
        {
            _logger.LogInformation($"Getting notifications for family member {familyMemberId}");

            var query = _context.Notifications
                .Where(n => n.UserId == familyMemberId && !n.IsDeleted)
                .AsQueryable();

            if (unreadOnly)
            {
                query = query.Where(n => !n.IsRead);
            }

            // Apply sorting
            query = parameters.SortBy?.ToLower() switch
            {
                "createdat" => parameters.SortDescending
                    ? query.OrderByDescending(n => n.CreatedAt)
                    : query.OrderBy(n => n.CreatedAt),
                _ => query.OrderByDescending(n => n.CreatedAt)
            };

            var totalCount = await query.CountAsync();

            var notifications = await query
                .Skip((parameters.PageNumber - 1) * parameters.PageSize)
                .Take(parameters.PageSize)
                .ToListAsync();

            var notificationDtos = _mapper.Map<List<NotificationDto>>(notifications);

            var paginatedResponse = new PaginatedResponse<List<NotificationDto>>(
                notificationDtos, parameters.PageNumber, parameters.PageSize, totalCount);

            return new Response<PaginatedResponse<List<NotificationDto>>> (
                paginatedResponse, "Notifications retrieved successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error getting notifications for family member {familyMemberId}");
            throw;
        }
    }

    /// <summary>
    /// Mark a notification as read
    /// </summary>
    public async Task<Response<NotificationDto>> MarkNotificationAsReadAsync(int familyMemberId, int notificationId)
    {
        try
        {
            _logger.LogInformation($"Marking notification {notificationId} as read for family member {familyMemberId}");

            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == notificationId &&
                                         n.UserId == familyMemberId &&
                                         !n.IsDeleted);

            if (notification == null)
            {
                throw new NotFoundException($"Notification with ID {notificationId} not found");
            }

            notification.IsRead = true;
            notification.UpdatedAt = DateTime.UtcNow;

            await _unitOfWork.CompleteAsync();

            var notificationDto = _mapper.Map<NotificationDto>(notification);

            return new Response<NotificationDto>(notificationDto, "Notification marked as read");
        }
        catch (Exception ex) when (ex is not NotFoundException)
        {
            _logger.LogError(ex, $"Error marking notification {notificationId} as read for family member {familyMemberId}");
            throw;
        }
    }

    /// <summary>
    /// Mark all notifications as read
    /// </summary>
    public async Task<Response<bool>> MarkAllNotificationsAsReadAsync(int familyMemberId)
    {
        try
        {
            _logger.LogInformation($"Marking all notifications as read for family member {familyMemberId}");

            var unreadNotifications = await _context.Notifications
                .Where(n => n.UserId == familyMemberId && !n.IsRead && !n.IsDeleted)
                .ToListAsync();

            foreach (var notification in unreadNotifications)
            {
                notification.IsRead = true;
                notification.UpdatedAt = DateTime.UtcNow;
            }

            await _unitOfWork.CompleteAsync();

            return new Response<bool>(true, $"Marked {unreadNotifications.Count} notifications as read");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error marking all notifications as read for family member {familyMemberId}");
            throw;
        }
    }

    /// <summary>
    /// Get notification summary
    /// </summary>
    public async Task<Response<NotificationSummaryDto>> GetNotificationSummaryAsync(int familyMemberId)
    {
        try
        {
            _logger.LogInformation($"Getting notification summary for family member {familyMemberId}");

            var totalUnread = await _context.Notifications
                .CountAsync(n => n.UserId == familyMemberId && !n.IsRead && !n.IsDeleted);

            var recentNotifications = await _context.Notifications
                .Where(n => n.UserId == familyMemberId && !n.IsDeleted)
                .OrderByDescending(n => n.CreatedAt)
                .Take(5)
                .ToListAsync();

            var summary = new NotificationSummaryDto
            {
                TotalUnread = totalUnread,
                RecentNotifications = _mapper.Map<List<NotificationDto>>(recentNotifications)
            };

            return new Response<NotificationSummaryDto>(summary, "Notification summary retrieved successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error getting notification summary for family member {familyMemberId}");
            throw;
        }
    }

    #endregion

    #region Visit Scheduling

    /// <summary>
    /// Schedule a new visit
    /// </summary>
    public async Task<Response<VisitRequestDto>> ScheduleVisitAsync(int familyMemberId, CreateVisitRequestDto createDto)
    {
        try
        {
            _logger.LogInformation($"Family member {familyMemberId} scheduling visit for elderly {createDto.ElderlyId}");

            // Verify family member has access to this elderly
            var hasAccess = await _context.ElderlyFamilyMembers
                .AnyAsync(f => f.FamilyMemberId == familyMemberId &&
                              f.ElderlyId == createDto.ElderlyId &&
                              f.CanScheduleVisits &&
                              !f.IsDeleted);

            if (!hasAccess)
            {
                throw new ForbiddenException("You do not have permission to schedule visits for this elderly");
            }

            // Check for existing visit requests on the same date
            var existingVisit = await _context.VisitRequests
                .AnyAsync(v => v.FamilyMemberId == familyMemberId &&
                              v.ElderlyId == createDto.ElderlyId &&
                              v.RequestedDate.Date == createDto.RequestedDate.Date &&
                              v.Status != VisitStatus.Cancelled &&
                              v.Status != VisitStatus.Rejected &&
                              !v.IsDeleted);

            if (existingVisit)
            {
                throw new ValidationException("Visit already scheduled",
                    new Dictionary<string, string[]>
                    {
                        { "RequestedDate", new[] { "You already have a visit scheduled for this date" } }
                    });
            }

            // Check if requested time is within visiting hours (9 AM to 8 PM)
            var visitingStart = new TimeSpan(9, 0, 0);
            var visitingEnd = new TimeSpan(20, 0, 0);

            if (createDto.RequestedTime < visitingStart || createDto.RequestedTime > visitingEnd)
            {
                throw new ValidationException("Invalid visiting time",
                    new Dictionary<string, string[]>
                    {
                        { "RequestedTime", new[] { "Visits are only allowed between 9:00 AM and 8:00 PM" } }
                    });
            }

            var visit = _mapper.Map<VisitRequest>(createDto);
            visit.FamilyMemberId = familyMemberId;
            visit.Status = VisitStatus.Pending;
            visit.CreatedAt = DateTime.UtcNow;
            visit.CreatedBy = familyMemberId.ToString();

            await _unitOfWork.Repository<VisitRequest>().AddAsync(visit);
            await _unitOfWork.CompleteAsync();

            // Load related data for response
            await _context.Entry(visit)
                .Reference(v => v.Elderly)
                .LoadAsync();

            // Notify team leaders
            await CreateNotificationForTeamLeaders(
                "New Visit Request",
                $"A new visit request for {visit.Elderly?.FirstName} {visit.Elderly?.LastName} requires approval",
                NotificationType.VisitRequest,
                visit.Id);

            var visitDto = _mapper.Map<VisitRequestDto>(visit);

            return new Response<VisitRequestDto>(visitDto, "Visit request submitted successfully");
        }
        catch (Exception ex) when (ex is not ForbiddenException && ex is not ValidationException)
        {
            _logger.LogError(ex, $"Error scheduling visit for family member {familyMemberId}");
            throw;
        }
    }

    /// <summary>
    /// Update a visit request
    /// </summary>
    public async Task<Response<VisitRequestDto>> UpdateVisitRequestAsync(
        int familyMemberId, int visitId, CreateVisitRequestDto updateDto)
    {
        try
        {
            _logger.LogInformation($"Family member {familyMemberId} updating visit {visitId}");

            var visit = await _context.VisitRequests
                .Include(v => v.Elderly)
                .FirstOrDefaultAsync(v => v.Id == visitId &&
                                         v.FamilyMemberId == familyMemberId &&
                                         !v.IsDeleted);

            if (visit == null)
            {
                throw new NotFoundException($"Visit request with ID {visitId} not found");
            }

            if (visit.Status != VisitStatus.Pending)
            {
                throw new ValidationException("Cannot update visit",
                    new Dictionary<string, string[]>
                    {
                        { "Status", new[] { $"Cannot update a visit that is {visit.Status}" } }
                    });
            }

            // Update visit properties
            visit.RequestedDate = updateDto.RequestedDate;
            visit.RequestedTime = updateDto.RequestedTime;
            visit.DurationMinutes = updateDto.DurationMinutes;
            visit.Notes = updateDto.Notes;
            visit.UpdatedAt = DateTime.UtcNow;
            visit.UpdatedBy = familyMemberId.ToString();

            await _unitOfWork.CompleteAsync();

            var visitDto = _mapper.Map<VisitRequestDto>(visit);

            return new Response<VisitRequestDto>(visitDto, "Visit request updated successfully");
        }
        catch (Exception ex) when (ex is not NotFoundException && ex is not ValidationException)
        {
            _logger.LogError(ex, $"Error updating visit {visitId} for family member {familyMemberId}");
            throw;
        }
    }

    /// <summary>
    /// Cancel a visit request
    /// </summary>
    public async Task<Response<bool>> CancelVisitRequestAsync(int familyMemberId, int visitId)
    {
        try
        {
            _logger.LogInformation($"Family member {familyMemberId} cancelling visit {visitId}");

            var visit = await _context.VisitRequests
                .FirstOrDefaultAsync(v => v.Id == visitId &&
                                         v.FamilyMemberId == familyMemberId &&
                                         !v.IsDeleted);

            if (visit == null)
            {
                throw new NotFoundException($"Visit request with ID {visitId} not found");
            }

            if (visit.Status == VisitStatus.Approved && visit.RequestedDate < DateTime.Today)
            {
                throw new ValidationException("Cannot cancel past visits",
                    new Dictionary<string, string[]>
                    {
                        { "Visit", new[] { "Cannot cancel a visit that has already passed" } }
                    });
            }

            visit.Status = VisitStatus.Cancelled;
            visit.UpdatedAt = DateTime.UtcNow;
            visit.UpdatedBy = familyMemberId.ToString();

            await _unitOfWork.CompleteAsync();

            return new Response<bool>(true, "Visit request cancelled successfully");
        }
        catch (Exception ex) when (ex is not NotFoundException && ex is not ValidationException)
        {
            _logger.LogError(ex, $"Error cancelling visit {visitId} for family member {familyMemberId}");
            throw;
        }
    }

    /// <summary>
    /// Get visit requests for family member
    /// </summary>
    public async Task<Response<PaginatedResponse<List<VisitRequestDto>>>> GetVisitRequestsAsync(
        int familyMemberId, VisitFilterParameters parameters)
    {
        try
        {
            _logger.LogInformation($"Getting visit requests for family member {familyMemberId}");

            var query = _context.VisitRequests
                .Include(v => v.Elderly)
                .Include(v => v.ApprovedBy)
                .Where(v => v.FamilyMemberId == familyMemberId && !v.IsDeleted)
                .AsQueryable();

            // Apply filters
            if (parameters.ElderlyId.HasValue)
            {
                query = query.Where(v => v.ElderlyId == parameters.ElderlyId.Value);
            }

            if (!string.IsNullOrEmpty(parameters.Status) &&
                Enum.TryParse<VisitStatus>(parameters.Status, true, out var status))
            {
                query = query.Where(v => v.Status == status);
            }

            if (parameters.FromDate.HasValue)
            {
                query = query.Where(v => v.RequestedDate >= parameters.FromDate.Value);
            }

            if (parameters.ToDate.HasValue)
            {
                var toDate = parameters.ToDate.Value.Date.AddDays(1).AddSeconds(-1);
                query = query.Where(v => v.RequestedDate <= toDate);
            }

            if (parameters.UpcomingOnly == true)
            {
                var today = DateTime.Today;
                query = query.Where(v => v.RequestedDate >= today &&
                                        v.Status == VisitStatus.Approved);
            }

            // Apply sorting
            query = parameters.SortBy?.ToLower() switch
            {
                "requesteddate" => parameters.SortDescending
                    ? query.OrderByDescending(v => v.RequestedDate)
                    : query.OrderBy(v => v.RequestedDate),
                "status" => parameters.SortDescending
                    ? query.OrderByDescending(v => v.Status)
                    : query.OrderBy(v => v.Status),
                _ => query.OrderByDescending(v => v.RequestedDate).ThenBy(v => v.RequestedTime)
            };

            var totalCount = await query.CountAsync();

            var visits = await query
                .Skip((parameters.PageNumber - 1) * parameters.PageSize)
                .Take(parameters.PageSize)
                .ToListAsync();

            var visitDtos = _mapper.Map<List<VisitRequestDto>>(visits);

            var paginatedResponse = new PaginatedResponse<List<VisitRequestDto>>(
                visitDtos, parameters.PageNumber, parameters.PageSize, totalCount);

            return new Response<PaginatedResponse<List<VisitRequestDto>>> (
                paginatedResponse, "Visit requests retrieved successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error getting visit requests for family member {familyMemberId}");
            throw;
        }
    }

    /// <summary>
    /// Get visit request by ID
    /// </summary>
    public async Task<Response<VisitRequestDto>> GetVisitRequestByIdAsync(int familyMemberId, int visitId)
    {
        try
        {
            _logger.LogInformation($"Getting visit request {visitId} for family member {familyMemberId}");

            var visit = await _context.VisitRequests
                .Include(v => v.Elderly)
                .Include(v => v.ApprovedBy)
                .FirstOrDefaultAsync(v => v.Id == visitId &&
                                         v.FamilyMemberId == familyMemberId &&
                                         !v.IsDeleted);

            if (visit == null)
            {
                throw new NotFoundException($"Visit request with ID {visitId} not found");
            }

            var visitDto = _mapper.Map<VisitRequestDto>(visit);

            return new Response<VisitRequestDto>(visitDto, "Visit request retrieved successfully");
        }
        catch (Exception ex) when (ex is not NotFoundException)
        {
            _logger.LogError(ex, $"Error getting visit request {visitId} for family member {familyMemberId}");
            throw;
        }
    }

    #endregion

    #region Dashboard

    /// <summary>
    /// Get family dashboard data
    /// </summary>
    public async Task<Response<FamilyDashboardDto>> GetDashboardDataAsync(int familyMemberId)
    {
        try
        {
            _logger.LogInformation($"Getting dashboard data for family member {familyMemberId}");

            var linkedElderly = await GetLinkedElderlyAsync(familyMemberId);
            var elderlySummaries = new List<ElderlySummaryDto>();

            foreach (var elderly in linkedElderly.Data ?? new List<ElderlyDto>())
            {
                var lastReport = await _context.DailyReports
                    .Where(r => r.ElderlyId == elderly.Id &&
                               r.ApprovalStatus == ApprovalStatus.Approved &&
                               !r.IsDeleted)
                    .OrderByDescending(r => r.ReportDate)
                    .FirstOrDefaultAsync();

                var recentActivities = await _context.DailyReports
                    .Include(r => r.HealthMetrics)
                    .Where(r => r.ElderlyId == elderly.Id &&
                               r.ApprovalStatus == ApprovalStatus.Approved &&
                               r.ReportDate >= DateTime.Today.AddDays(-3) &&
                               !r.IsDeleted)
                    .SelectMany(r => r.HealthMetrics)
                    .Where(m => m.MetricType == MetricType.Activity)
                    .OrderByDescending(m => m.CreatedAt)
                    .Select(m => m.MetricName)
                    .Distinct()
                    .Take(3)
                    .ToListAsync();

                var healthStatus = "Good";
                if (lastReport != null)
                {
                    // Simple health status logic - can be enhanced with AI later
                    var hasIssues = await _context.HealthMetrics
                        .AnyAsync(m => m.DailyReportId == lastReport.Id &&
                                      (m.MetricValue.Contains("low") ||
                                       m.MetricValue.Contains("pain") ||
                                       m.MetricValue.Contains("unwell")));

                    healthStatus = hasIssues ? "Fair" : "Good";
                }

                elderlySummaries.Add(new ElderlySummaryDto
                {
                    ElderlyId = elderly.Id,
                    ElderlyName = elderly.FullName,
                    RoomNumber = elderly.RoomNumber ?? string.Empty,
                    LastReportDate = lastReport?.ReportDate,
                    LastReportStatus = lastReport != null ? lastReport.ApprovalStatus.ToString() : "No reports",
                    HasNewReport = lastReport != null && lastReport.ReportDate >= DateTime.Today.AddDays(-1),
                    HealthStatus = healthStatus,
                    RecentActivities = recentActivities
                });
            }

            // Get recent notifications
            var notifications = await _context.Notifications
                .Where(n => n.UserId == familyMemberId && !n.IsRead && !n.IsDeleted)
                .OrderByDescending(n => n.CreatedAt)
                .Take(5)
                .ToListAsync();

            // Get upcoming approved visits
            var upcomingVisits = await _context.VisitRequests
                .Include(v => v.Elderly)
                .Where(v => v.FamilyMemberId == familyMemberId &&
                           v.Status == VisitStatus.Approved &&
                           v.RequestedDate >= DateTime.Today &&
                           !v.IsDeleted)
                .OrderBy(v => v.RequestedDate)
                .ThenBy(v => v.RequestedTime)
                .Take(3)
                .Select(v => new UpcomingVisitDto
                {
                    VisitId = v.Id,
                    ElderlyId = v.ElderlyId,
                    ElderlyName = $"{v.Elderly!.FirstName} {v.Elderly.LastName}",
                    VisitDate = v.RequestedDate,
                    VisitTime = v.RequestedTime,
                    DurationMinutes = v.DurationMinutes,
                    Status = v.Status.ToString(),
                    Notes = v.Notes
                })
                .ToListAsync();

            // Get unread count
            var unreadCount = await _context.Notifications
                .CountAsync(n => n.UserId == familyMemberId && !n.IsRead && !n.IsDeleted);

            var dashboard = new FamilyDashboardDto
            {
                ElderlySummaries = elderlySummaries,
                RecentNotifications = _mapper.Map<List<NotificationDto>>(notifications),
                UpcomingVisits = upcomingVisits,
                UnreadNotificationsCount = unreadCount
            };

            return new Response<FamilyDashboardDto>(dashboard, "Dashboard data retrieved successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error getting dashboard data for family member {familyMemberId}");
            throw;
        }
    }

    #endregion

    #region Private Methods

    /// <summary>
    /// Create notification for team leaders
    /// </summary>
    private async Task CreateNotificationForTeamLeaders(string title, string message, NotificationType type, int relatedEntityId)
    {
        try
        {
            var teamLeaders = await _userManager.GetUsersInRoleAsync("TeamLeader");

            foreach (var leader in teamLeaders.Where(l => l.IsActive && !l.IsDeleted))
            {
                var notification = new Notification
                {
                    UserId = leader.Id,
                    Title = title,
                    Message = message,
                    NotificationType = type,
                    RelatedEntityId = relatedEntityId,
                    RelatedEntityType = "VisitRequest",
                    CreatedAt = DateTime.UtcNow,
                    IsRead = false
                };

                await _unitOfWork.Repository<Notification>().AddAsync(notification);
            }

            await _unitOfWork.CompleteAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating notifications for team leaders");
            // Don't throw - notification failure shouldn't break the main flow
        }
    }

    #endregion
}