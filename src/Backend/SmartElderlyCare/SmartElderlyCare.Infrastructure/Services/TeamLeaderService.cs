using AutoMapper;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SmartElderlyCare.Application.Common.Exceptions;
using SmartElderlyCare.Application.DTOs.Common;
using SmartElderlyCare.Application.DTOs.DailyReport;
using SmartElderlyCare.Application.DTOs.Family;
using SmartElderlyCare.Application.DTOs.Schedule;
using SmartElderlyCare.Application.DTOs.TeamLeader;
using SmartElderlyCare.Application.DTOs.User;
using SmartElderlyCare.Application.DTOs.Visit;
using SmartElderlyCare.Application.DTOs.Elderly;
using SmartElderlyCare.Application.DTOs.AI;
using SmartElderlyCare.Application.Interfaces;
using SmartElderlyCare.Application.Wrappers;
using SmartElderlyCare.Domain.Entities;
using SmartElderlyCare.Domain.Enums;
using SmartElderlyCare.Domain.Interfaces;
using SmartElderlyCare.Infrastructure.Data.Context;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SmartElderlyCare.Infrastructure.Services;

/// <summary>
/// Team Leader service implementation
/// </summary>
public class TeamLeaderService : ITeamLeaderService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly ILogger<TeamLeaderService> _logger;
    private readonly UserManager<User> _userManager;
    private readonly ApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IAiPredictionService _aiPredictionService;

    public TeamLeaderService(
        IUnitOfWork unitOfWork,
        IMapper mapper,
        ILogger<TeamLeaderService> logger,
        UserManager<User> userManager,
        ApplicationDbContext context,
        ICurrentUserService currentUserService,
        IAiPredictionService aiPredictionService)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _logger = logger;
        _userManager = userManager;
        _context = context;
        _currentUserService = currentUserService;
        _aiPredictionService = aiPredictionService;
    }

    #region Profile Management

    /// <summary>
    /// Get team leader profile
    /// </summary>
    public async Task<Response<UserDto>> GetProfileAsync(int teamLeaderId)
    {
        try
        {
            _logger.LogInformation($"Getting profile for team leader ID: {teamLeaderId}");

            var user = await _userManager.FindByIdAsync(teamLeaderId.ToString());
            if (user == null)
            {
                throw new NotFoundException($"Team Leader with ID {teamLeaderId} not found");
            }

            if (user.UserType != UserType.TeamLeader)
            {
                throw new ForbiddenException("User is not a team leader");
            }

            var userDto = _mapper.Map<UserDto>(user);
            var roles = await _userManager.GetRolesAsync(user);
            userDto.Roles = roles.ToList();

            return new Response<UserDto>(userDto, "Profile retrieved successfully");
        }
        catch (Exception ex) when (ex is not NotFoundException && ex is not ForbiddenException)
        {
            _logger.LogError(ex, $"Error getting profile for team leader {teamLeaderId}");
            throw;
        }
    }

    /// <summary>
    /// Update team leader profile
    /// </summary>
    public async Task<Response<UserDto>> UpdateProfileAsync(int teamLeaderId, UpdateUserDto updateDto)
    {
        try
        {
            _logger.LogInformation($"Updating profile for team leader ID: {teamLeaderId}");

            var user = await _userManager.FindByIdAsync(teamLeaderId.ToString());
            if (user == null)
            {
                throw new NotFoundException($"Team Leader with ID {teamLeaderId} not found");
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
            _logger.LogError(ex, $"Error updating profile for team leader {teamLeaderId}");
            throw;
        }
    }

    #endregion

    #region Elderly Management

    /// <summary>
    /// Get all elderly residents
    /// </summary>
    public async Task<Response<List<ElderlyDetailDto>>> GetAllElderlyAsync()
    {
        try
        {
            _logger.LogInformation("Getting all elderly residents for team leader");

            var elderly = await _context.Elderlies
                .Include(e => e.EmployeeAssignments)
                    .ThenInclude(ea => ea.Employee)
                .Include(e => e.FamilyMembers)
                    .ThenInclude(fm => fm.FamilyMember)
                .Where(e => !e.IsDeleted && e.IsActive)
                .OrderBy(e => e.FirstName)
                .ToListAsync();

            var elderlyDtos = _mapper.Map<List<ElderlyDetailDto>>(elderly);

            return new Response<List<ElderlyDetailDto>>(elderlyDtos, "Elderly residents retrieved successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting elderly residents for team leader");
            throw;
        }
    }

    #endregion

    #region Report Approval Workflow

    /// <summary>
    /// Get paginated list of pending reports
    /// </summary>
    public async Task<Response<PaginatedResponse<List<DailyReportDto>>>> GetPendingReportsAsync(ReportFilterParameters parameters)
    {
        try
        {
            _logger.LogInformation("Getting pending reports with filters");

            var query = _context.DailyReports
                .Include(r => r.Employee)
                .Include(r => r.Elderly)
                .Include(r => r.HealthMetrics)
                .Where(r => r.ApprovalStatus == ApprovalStatus.Pending && !r.IsDeleted)
                .AsQueryable();

            // Apply filters
            if (parameters.ElderlyId.HasValue)
            {
                query = query.Where(r => r.ElderlyId == parameters.ElderlyId);
            }

            if (parameters.EmployeeId.HasValue)
            {
                query = query.Where(r => r.EmployeeId == parameters.EmployeeId);
            }

            if (parameters.FromDate.HasValue)
            {
                query = query.Where(r => r.ReportDate >= parameters.FromDate.Value);
            }

            if (parameters.ToDate.HasValue)
            {
                var toDate = parameters.ToDate.Value.Date.AddDays(1).AddSeconds(-1);
                query = query.Where(r => r.ReportDate <= toDate);
            }

            // Apply sorting
            query = parameters.SortBy?.ToLower() switch
            {
                "reportdate" => parameters.SortDescending
                    ? query.OrderByDescending(r => r.ReportDate)
                    : query.OrderBy(r => r.ReportDate),
                "submissiondate" => parameters.SortDescending
                    ? query.OrderByDescending(r => r.SubmissionDate)
                    : query.OrderBy(r => r.SubmissionDate),
                "employee" => parameters.SortDescending
                    ? query.OrderByDescending(r => r.Employee.LastName)
                    : query.OrderBy(r => r.Employee.LastName),
                _ => query.OrderBy(r => r.SubmissionDate) // Oldest first by default
            };

            // Get total count
            var totalCount = await query.CountAsync();

            // Apply pagination
            var reports = await query
                .Skip((parameters.PageNumber - 1) * parameters.PageSize)
                .Take(parameters.PageSize)
                .ToListAsync();

            var reportDtos = _mapper.Map<List<DailyReportDto>>(reports);

            var paginatedResponse = new PaginatedResponse<List<DailyReportDto>>(
                reportDtos, parameters.PageNumber, parameters.PageSize, totalCount);

            return new Response<PaginatedResponse<List<DailyReportDto>>>(
                paginatedResponse, "Pending reports retrieved successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting pending reports");
            throw;
        }
    }

    /// <summary>
    /// Get detailed report information for approval
    /// </summary>
    public async Task<Response<DailyReportDto>> GetReportDetailsAsync(int reportId)
    {
        try
        {
            _logger.LogInformation($"Getting report details for approval: {reportId}");

            var report = await _context.DailyReports
                .Include(r => r.Employee)
                .Include(r => r.Elderly)
                .Include(r => r.HealthMetrics)
                .FirstOrDefaultAsync(r => r.Id == reportId && !r.IsDeleted);

            if (report == null)
            {
                throw new NotFoundException($"Report with ID {reportId} not found");
            }

            var reportDto = _mapper.Map<DailyReportDto>(report);

            return new Response<DailyReportDto>(reportDto, "Report details retrieved successfully");
        }
        catch (Exception ex) when (ex is not NotFoundException)
        {
            _logger.LogError(ex, $"Error getting report details for report {reportId}");
            throw;
        }
    }

    /// <summary>
    /// Approve a daily report
    /// </summary>
    public async Task<Response<DailyReportDto>> ApproveReportAsync(int teamLeaderId, ApproveReportDto approveDto)
    {
        try
        {
            _logger.LogInformation($"Team leader {teamLeaderId} approving report {approveDto.ReportId}");

            var report = await _context.DailyReports
                .Include(r => r.Employee)
                .Include(r => r.Elderly)
                .Include(r => r.HealthMetrics)
                .FirstOrDefaultAsync(r => r.Id == approveDto.ReportId && !r.IsDeleted);

            if (report == null)
            {
                throw new NotFoundException($"Report with ID {approveDto.ReportId} not found");
            }

            if (report.ApprovalStatus != ApprovalStatus.Pending)
            {
                throw new ValidationException("Cannot approve non-pending report",
                    new Dictionary<string, string[]>
                    {
                        { "Status", new[] { $"Report is already {report.ApprovalStatus}" } }
                    });
            }

            // Update report status
            report.ApprovalStatus = ApprovalStatus.Approved;
            report.ApprovedById = teamLeaderId;
            report.ApprovedDate = DateTime.UtcNow;
            report.UpdatedAt = DateTime.UtcNow;
            report.UpdatedBy = teamLeaderId.ToString();

            await _context.SaveChangesAsync();

            // Create notification for employee
            await CreateNotificationForEmployee(
                report.EmployeeId,
                "Report Approved",
                $"Your report for {report.Elderly?.FirstName} {report.Elderly?.LastName} on {report.ReportDate:yyyy-MM-dd} has been approved.",
                NotificationType.ReportApproved,
                report.Id);

            // Create notification for family members if elderly has family links
            await CreateNotificationForFamily(
                report.ElderlyId,
                "Health Update Available",
                $"A new health update for {report.Elderly?.FirstName} {report.Elderly?.LastName} is now available.",
                NotificationType.ReportApproved,
                report.Id);

            var reportDto = _mapper.Map<DailyReportDto>(report);

            return new Response<DailyReportDto>(reportDto, "Report approved successfully");
        }
        catch (Exception ex) when (ex is not NotFoundException && ex is not ValidationException)
        {
            _logger.LogError(ex, $"Error approving report {approveDto.ReportId}");
            throw;
        }
    }

    /// <summary>
    /// Reject a daily report
    /// </summary>
    public async Task<Response<DailyReportDto>> RejectReportAsync(int teamLeaderId, RejectReportDto rejectDto)
    {
        try
        {
            _logger.LogInformation($"Team leader {teamLeaderId} rejecting report {rejectDto.ReportId}");

            var report = await _context.DailyReports
                .Include(r => r.Employee)
                .Include(r => r.Elderly)
                .Include(r => r.HealthMetrics)
                .FirstOrDefaultAsync(r => r.Id == rejectDto.ReportId && !r.IsDeleted);

            if (report == null)
            {
                throw new NotFoundException($"Report with ID {rejectDto.ReportId} not found");
            }

            if (report.ApprovalStatus != ApprovalStatus.Pending)
            {
                throw new ValidationException("Cannot reject non-pending report",
                    new Dictionary<string, string[]>
                    {
                        { "Status", new[] { $"Report is already {report.ApprovalStatus}" } }
                    });
            }

            // Update report status
            report.ApprovalStatus = ApprovalStatus.Rejected;
            report.ApprovedById = teamLeaderId;
            report.ApprovedDate = DateTime.UtcNow;
            report.RejectionReason = rejectDto.RejectionReason;
            report.UpdatedAt = DateTime.UtcNow;
            report.UpdatedBy = teamLeaderId.ToString();

            await _context.SaveChangesAsync();

            // Create notification for employee
            await CreateNotificationForEmployee(
                report.EmployeeId,
                "Report Rejected",
                $"Your report for {report.Elderly?.FirstName} {report.Elderly?.LastName} on {report.ReportDate:yyyy-MM-dd} has been rejected. Reason: {rejectDto.RejectionReason}",
                NotificationType.ReportRejected,
                report.Id);

            var reportDto = _mapper.Map<DailyReportDto>(report);

            return new Response<DailyReportDto>(reportDto, "Report rejected successfully");
        }
        catch (Exception ex) when (ex is not NotFoundException && ex is not ValidationException)
        {
            _logger.LogError(ex, $"Error rejecting report {rejectDto.ReportId}");
            throw;
        }
    }

    /// <summary>
    /// Get reports summary for team leader dashboard
    /// </summary>
    public async Task<Response<ReportSummaryDto>> GetReportsSummaryAsync()
    {
        try
        {
            _logger.LogInformation("Getting reports summary for team leader");

            var egyptTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Egypt Standard Time");
            var egyptTime = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, egyptTimeZone);
            var today = egyptTime.Date;
            var reports = await _context.DailyReports
                .Include(r => r.Elderly)
                .Include(r => r.Employee)
                .Include(r => r.ApprovedBy)
                .Where(r => !r.IsDeleted)
                .ToListAsync();

            var summary = new ReportSummaryDto
            {
                TotalReports = reports.Count,
                PendingReports = reports.Count(r => r.ApprovalStatus == ApprovalStatus.Pending),
                ApprovedReports = reports.Count(r => r.ApprovalStatus == ApprovalStatus.Approved),
                RejectedReports = reports.Count(r => r.ApprovalStatus == ApprovalStatus.Rejected),
                ApprovalRate = reports.Count > 0
                    ? Math.Round((double)reports.Count(r => r.ApprovalStatus == ApprovalStatus.Approved) / reports.Count * 100, 2)
                    : 0,
                RecentReports = _mapper.Map<List<ReportApprovalHistoryDto>>(
                    reports.OrderByDescending(r => r.SubmissionDate).Take(10))
            };

            return new Response<ReportSummaryDto>(summary, "Reports summary retrieved successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting reports summary");
            throw;
        }
    }

    /// <summary>
    /// Get approval history for a date range
    /// </summary>
    public async Task<Response<List<ReportApprovalHistoryDto>>> GetApprovalHistoryAsync(DateTime? fromDate, DateTime? toDate, int? elderlyId, ApprovalStatus? status = null)
    {
        try
        {
            _logger.LogInformation("Getting approval history");

            var query = _context.DailyReports
                .Include(r => r.Employee)
                .Include(r => r.Elderly)
                .Include(r => r.ApprovedBy)
                .Where(r => r.ApprovalStatus != ApprovalStatus.Pending && !r.IsDeleted)
                .AsQueryable();

            if (elderlyId.HasValue)
            {
                query = query.Where(r => r.ElderlyId == elderlyId.Value);
            }

            if (status.HasValue)
            {
                query = query.Where(r => r.ApprovalStatus == status.Value);
            }

            if (fromDate.HasValue)
            {
                query = query.Where(r => r.ApprovedDate >= fromDate.Value);
            }

            if (toDate.HasValue)
            {
                var endDate = toDate.Value.Date.AddDays(1).AddSeconds(-1);
                query = query.Where(r => r.ApprovedDate <= endDate);
            }

            var history = await query
                .OrderByDescending(r => r.ApprovedDate)
                .Take(100)
                .ToListAsync();

            var historyDtos = _mapper.Map<List<ReportApprovalHistoryDto>>(history);

            return new Response<List<ReportApprovalHistoryDto>>(historyDtos, "Approval history retrieved successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting approval history");
            throw;
        }
    }

    #endregion

    #region Employee Performance Monitoring

    /// <summary>
    /// Get paginated list of employees
    /// </summary>
    public async Task<Response<PaginatedResponse<List<UserDto>>>> GetEmployeesAsync(UserFilterParameters parameters)
    {
        try
        {
            _logger.LogInformation("Getting employees list");

            var query = _context.Users
                .Where(u => u.UserType == UserType.Employee && !u.IsDeleted)
                .AsQueryable();

            // Apply filters
            if (!string.IsNullOrEmpty(parameters.SearchTerm))
            {
                var search = parameters.SearchTerm.ToLower();
                query = query.Where(u =>
                    u.FirstName.ToLower().Contains(search) ||
                    u.LastName.ToLower().Contains(search) ||
                    u.Email.ToLower().Contains(search));
            }

            if (parameters.IsActive.HasValue)
            {
                query = query.Where(u => u.IsActive == parameters.IsActive.Value);
            }

            // Apply sorting
            query = parameters.SortBy?.ToLower() switch
            {
                "firstname" => parameters.SortDescending
                    ? query.OrderByDescending(u => u.FirstName)
                    : query.OrderBy(u => u.FirstName),
                "lastname" => parameters.SortDescending
                    ? query.OrderByDescending(u => u.LastName)
                    : query.OrderBy(u => u.LastName),
                "email" => parameters.SortDescending
                    ? query.OrderByDescending(u => u.Email)
                    : query.OrderBy(u => u.Email),
                "lastlogin" => parameters.SortDescending
                    ? query.OrderByDescending(u => u.LastLoginAt)
                    : query.OrderBy(u => u.LastLoginAt),
                _ => query.OrderBy(u => u.LastName)
            };

            var totalCount = await query.CountAsync();

            var employees = await query
                .Skip((parameters.PageNumber - 1) * parameters.PageSize)
                .Take(parameters.PageSize)
                .ToListAsync();

            var employeeDtos = _mapper.Map<List<UserDto>>(employees);

            // Get roles for each employee
            foreach (var dto in employeeDtos)
            {
                var user = employees.First(e => e.Id == dto.Id);
                dto.Roles = (await _userManager.GetRolesAsync(user)).ToList();
            }

            var paginatedResponse = new PaginatedResponse<List<UserDto>>(
                employeeDtos, parameters.PageNumber, parameters.PageSize, totalCount);

            return new Response<PaginatedResponse<List<UserDto>>> (
                paginatedResponse, "Employees retrieved successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting employees list");
            throw;
        }
    }

    /// <summary>
    /// Get detailed performance metrics for a specific employee
    /// </summary>
    public async Task<Response<EmployeePerformanceDto>> GetEmployeePerformanceAsync(
        int employeeId, DateTime? fromDate, DateTime? toDate)
    {
        try
        {
            _logger.LogInformation($"Getting performance for employee {employeeId}");

            var employee = await _userManager.FindByIdAsync(employeeId.ToString());
            if (employee == null || employee.UserType != UserType.Employee)
            {
                throw new NotFoundException($"Employee with ID {employeeId} not found");
            }

            var egyptTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Egypt Standard Time");
            var egyptTime = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, egyptTimeZone);
            var endDate = toDate ?? egyptTime.Date;
            var startDate = fromDate ?? endDate.AddDays(-30);

            // Get reports in date range
            var reports = await _context.DailyReports
                .Include(r => r.Elderly)
                .Where(r => r.EmployeeId == employeeId &&
                           r.ReportDate >= startDate &&
                           r.ReportDate <= endDate &&
                           !r.IsDeleted)
                .ToListAsync();

            // Get attendance in date range
            var attendance = await _context.AttendanceLogs
                .Where(a => a.EmployeeId == employeeId &&
                           a.LoginTime.Date >= startDate.Date &&
                           a.LoginTime.Date <= endDate.Date)
                .ToListAsync();

            // Calculate performance metrics
            var performance = new EmployeePerformanceDto
            {
                EmployeeId = employee.Id,
                EmployeeName = $"{employee.FirstName} {employee.LastName}",
                Email = employee.Email ?? string.Empty,
                LastLoginAt = employee.LastLoginAt,

                // Report statistics
                TotalReports = reports.Count,
                PendingReports = reports.Count(r => r.ApprovalStatus == ApprovalStatus.Pending),
                ApprovedReports = reports.Count(r => r.ApprovalStatus == ApprovalStatus.Approved),
                RejectedReports = reports.Count(r => r.ApprovalStatus == ApprovalStatus.Rejected),
                ApprovalRate = reports.Count > 0
                    ? Math.Round((double)reports.Count(r => r.ApprovalStatus == ApprovalStatus.Approved) / reports.Count * 100, 2)
                    : 0,

                // Attendance statistics
                DaysPresent = attendance.Count(a => a.LogoutTime.HasValue),
                LateDays = await CalculateLateDays(employeeId, startDate, endDate),
                AverageWorkHours = attendance.Any(a => a.LogoutTime.HasValue)
                    ? attendance.Where(a => a.LogoutTime.HasValue).Average(a => (a.LogoutTime.Value - a.LoginTime).TotalHours)
                    : 0,

                // Recent activity
                RecentReports = reports
                    .OrderByDescending(r => r.ReportDate)
                    .Take(5)
                    .Select(r => new RecentReportDto
                    {
                        ReportId = r.Id,
                        ElderlyName = $"{r.Elderly?.FirstName} {r.Elderly?.LastName}",
                        ReportDate = r.ReportDate,
                        Status = r.ApprovalStatus.ToString(),
                        ApprovedDate = r.ApprovedDate
                    }).ToList(),

                RecentAttendance = _mapper.Map<List<AttendanceLogDto>>(
                    attendance.OrderByDescending(a => a.LoginTime).Take(5))
            };

            return new Response<EmployeePerformanceDto>(performance, "Employee performance retrieved successfully");
        }
        catch (Exception ex) when (ex is not NotFoundException)
        {
            _logger.LogError(ex, $"Error getting performance for employee {employeeId}");
            throw;
        }
    }

    /// <summary>
    /// Get performance summary for all employees
    /// </summary>
    public async Task<Response<List<EmployeePerformanceSummaryDto>>> GetAllEmployeesPerformanceAsync(DateTime? date, DateTime? endDate = null)
    {
        try
        {
            _logger.LogInformation("Getting performance summary for all employees");

            var egyptTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Egypt Standard Time");
            var egyptTime = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, egyptTimeZone);
            var targetStartDate = date ?? egyptTime.Date;
            var targetEndDate = endDate ?? targetStartDate;
            var employees = await _context.Users
                .Where(u => u.UserType == UserType.Employee && u.IsActive && !u.IsDeleted)
                .ToListAsync();

            var performanceSummaries = new List<EmployeePerformanceSummaryDto>();

            foreach (var employee in employees)
            {
                // Get reports for date range
                var reportsToday = await _context.DailyReports
                    .CountAsync(r => r.EmployeeId == employee.Id &&
                                    r.ReportDate.Date >= targetStartDate.Date &&
                                    r.ReportDate.Date <= targetEndDate.Date &&
                                    !r.IsDeleted);

                var approvedReports = await _context.DailyReports
                    .CountAsync(r => r.EmployeeId == employee.Id &&
                                    r.ReportDate.Date >= targetStartDate.Date &&
                                    r.ReportDate.Date <= targetEndDate.Date &&
                                    r.ApprovalStatus == ApprovalStatus.Approved &&
                                    !r.IsDeleted);

                // Get attendance for end date (as current status proxy)
                var attendanceToday = await _context.AttendanceLogs
                    .FirstOrDefaultAsync(a => a.EmployeeId == employee.Id &&
                                             a.LoginTime.Date == targetEndDate.Date);

                // Get today's schedule for end date
                var scheduleToday = await _context.WorkSchedules
                    .FirstOrDefaultAsync(s => s.EmployeeId == employee.Id &&
                                             s.ShiftDate.Date == targetEndDate.Date &&
                                             !s.IsDeleted);

                var status = DetermineEmployeeStatus(attendanceToday, scheduleToday);

                performanceSummaries.Add(new EmployeePerformanceSummaryDto
                {
                    EmployeeId = employee.Id,
                    EmployeeName = $"{employee.FirstName} {employee.LastName}",
                    ReportsSubmitted = reportsToday,
                    ReportsApproved = approvedReports,
                    ReportsRejected = reportsToday - approvedReports,
                    ClockedIn = attendanceToday != null,
                    ClockInTime = attendanceToday?.LoginTime,
                    CurrentShift = scheduleToday != null
                        ? scheduleToday.EndTime - scheduleToday.StartTime
                        : null,
                    Status = status
                });
            }

            return new Response<List<EmployeePerformanceSummaryDto>>(
                performanceSummaries, "Employee performance summary retrieved successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all employees performance");
            throw;
        }
    }

    /// <summary>
    /// Get detailed employee information with assignments
    /// </summary>
    public async Task<Response<EmployeeDetailsDto>> GetEmployeeDetailsAsync(int employeeId)
    {
        try
        {
            _logger.LogInformation($"Getting detailed information for employee {employeeId}");

            var employee = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == employeeId && u.UserType == UserType.Employee && !u.IsDeleted);

            if (employee == null)
            {
                throw new NotFoundException($"Employee with ID {employeeId} not found");
            }

            var employeeDto = _mapper.Map<EmployeeDetailsDto>(employee);
            var roles = await _userManager.GetRolesAsync(employee);
            employeeDto.Roles = roles.ToList();

            // Get assigned elderly
            var assignments = await _context.EmployeeElderlyAssignments
                .Include(a => a.Elderly)
                .Where(a => a.EmployeeId == employeeId && !a.IsDeleted)
                .ToListAsync();

            // Fetch all reports for assigned elderly at once. We'll find the latest for each in-memory.
            var elderlyIds = assignments.Select(a => a.ElderlyId).ToList();
            var allReports = await _context.DailyReports
                .Where(r => elderlyIds.Contains(r.ElderlyId) && r.EmployeeId == employeeId && !r.IsDeleted)
                .OrderByDescending(r => r.ReportDate)
                .ToListAsync();
                             
            employeeDto.AssignedElderly = assignments.Select(a => {
                var lastReport = allReports.FirstOrDefault(r => r.ElderlyId == a.ElderlyId);

                return new AssignedElderlyInfoDto
                {
                    ElderlyId = a.ElderlyId,
                    ElderlyName = $"{a.Elderly?.FirstName} {a.Elderly?.LastName}",
                    RoomNumber = a.Elderly?.RoomNumber ?? string.Empty,
                    IsPrimary = a.IsPrimary,
                    LastReportDate = lastReport?.ReportDate,
                    LastReportStatus = lastReport != null ? lastReport.ApprovalStatus.ToString() : "No reports"
                };
            }).ToList();

            // Get today's schedule and attendance
            var egyptTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Egypt Standard Time");
            var egyptTime = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, egyptTimeZone);
            var today = egyptTime.Date;
            employeeDto.TodaySchedule = _mapper.Map<WorkScheduleDto>(
                await _context.WorkSchedules
                    .FirstOrDefaultAsync(s => s.EmployeeId == employeeId &&
                                             s.ShiftDate.Date == today.Date &&
                                             !s.IsDeleted));

            employeeDto.TodayAttendance = _mapper.Map<AttendanceLogDto>(
                await _context.AttendanceLogs
                    .FirstOrDefaultAsync(a => a.EmployeeId == employeeId &&
                                             a.LoginTime.Date == today.Date));

            return new Response<EmployeeDetailsDto>(employeeDto, "Employee details retrieved successfully");
        }
        catch (Exception ex) when (ex is not NotFoundException)
        {
            _logger.LogError(ex, $"Error getting details for employee {employeeId}");
            throw;
        }
    }

    #endregion

    #region Attendance Tracking

    /// <summary>
    /// Get attendance logs with filtering
    /// </summary>
    public async Task<Response<PaginatedResponse<List<AttendanceLogDto>>>> GetAttendanceLogsAsync(
        int? employeeId, DateTime? date, PaginationParameters parameters)
    {
        try
        {
            _logger.LogInformation("Getting attendance logs");

            var query = _context.AttendanceLogs
                .Include(a => a.Employee)
                .AsQueryable();

            if (employeeId.HasValue)
            {
                query = query.Where(a => a.EmployeeId == employeeId.Value);
            }

            if (date.HasValue)
            {
                query = query.Where(a => a.LoginTime.Date == date.Value.Date);
            }

            // Apply sorting
            query = parameters.SortBy?.ToLower() switch
            {
                "logindate" => parameters.SortDescending
                    ? query.OrderByDescending(a => a.LoginTime)
                    : query.OrderBy(a => a.LoginTime),
                "employee" => parameters.SortDescending
                    ? query.OrderByDescending(a => a.Employee.LastName)
                    : query.OrderBy(a => a.Employee.LastName),
                _ => query.OrderByDescending(a => a.LoginTime)
            };

            var totalCount = await query.CountAsync();

            var logs = await query
                .Skip((parameters.PageNumber - 1) * parameters.PageSize)
                .Take(parameters.PageSize)
                .ToListAsync();

            var logDtos = _mapper.Map<List<AttendanceLogDto>>(logs);

            var paginatedResponse = new PaginatedResponse<List<AttendanceLogDto>>(
                logDtos, parameters.PageNumber, parameters.PageSize, totalCount);

            return new Response<PaginatedResponse<List<AttendanceLogDto>>> (
                paginatedResponse, "Attendance logs retrieved successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting attendance logs");
            throw;
        }
    }

    /// <summary>
    /// Get attendance summary for a specific date
    /// </summary>
    public async Task<Response<AttendanceSummaryDto>> GetAttendanceSummaryAsync(DateTime date)
    {
        try
        {
            _logger.LogInformation($"Getting attendance summary for {date:yyyy-MM-dd}");

            var employees = await _context.Users
                .Where(u => u.UserType == UserType.Employee && u.IsActive && !u.IsDeleted)
                .ToListAsync();

            var schedules = await _context.WorkSchedules
                .Where(s => s.ShiftDate.Date == date.Date && !s.IsDeleted)
                .ToDictionaryAsync(s => s.EmployeeId);

            var attendance = await _context.AttendanceLogs
                .Where(a => a.LoginTime.Date == date.Date)
                .ToDictionaryAsync(a => a.EmployeeId);

            var attendanceDetails = new List<EmployeeAttendanceDto>();
            int present = 0, late = 0, absent = 0;

            foreach (var employee in employees)
            {
                var hasSchedule = schedules.TryGetValue(employee.Id, out var schedule);
                var hasAttendance = attendance.TryGetValue(employee.Id, out var log);

                var status = DetermineEmployeeStatus(log, schedule);

                if (status == "Present") present++;
                else if (status == "Late") late++;
                else if (status == "Absent") absent++;

                attendanceDetails.Add(new EmployeeAttendanceDto
                {
                    EmployeeId = employee.Id,
                    EmployeeName = $"{employee.FirstName} {employee.LastName}",
                    IsPresent = hasAttendance,
                    ClockInTime = log?.LoginTime,
                    ClockOutTime = log?.LogoutTime,
                    WorkDuration = log?.LogoutTime.HasValue == true
                        ? log.LogoutTime.Value - log.LoginTime
                        : null,
                    Status = status,
                    ScheduledStartTime = schedule?.StartTime,
                    ScheduledEndTime = schedule?.EndTime
                });
            }

            var summary = new AttendanceSummaryDto
            {
                Date = date,
                TotalEmployees = employees.Count,
                Present = present,
                Late = late,
                Absent = absent,
                AttendanceRate = employees.Count > 0
                    ? Math.Round((double)(present + late) / employees.Count * 100, 2)
                    : 0,
                AttendanceDetails = attendanceDetails
            };

            return new Response<AttendanceSummaryDto>(summary, "Attendance summary retrieved successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error getting attendance summary for {date:yyyy-MM-dd}");
            throw;
        }
    }

    /// <summary>
    /// Get current attendance status for all employees
    /// </summary>
    public async Task<Response<List<EmployeeAttendanceDto>>> GetCurrentAttendanceStatusAsync()
    {
        try
        {
            _logger.LogInformation("Getting current attendance status");

            var egyptTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Egypt Standard Time");
            var egyptTime = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, egyptTimeZone);
            var today = egyptTime.Date;
            var now = DateTime.Now.TimeOfDay;

            var employees = await _context.Users
                .Where(u => u.UserType == UserType.Employee && u.IsActive && !u.IsDeleted)
                .ToListAsync();

            var schedules = await _context.WorkSchedules
                .Where(s => s.ShiftDate.Date == today.Date && !s.IsDeleted)
                .ToDictionaryAsync(s => s.EmployeeId);

            var attendance = await _context.AttendanceLogs
                .Where(a => a.LoginTime.Date == today.Date)
                .ToDictionaryAsync(a => a.EmployeeId);

            var statusList = new List<EmployeeAttendanceDto>();

            foreach (var employee in employees)
            {
                var hasSchedule = schedules.TryGetValue(employee.Id, out var schedule);
                var hasAttendance = attendance.TryGetValue(employee.Id, out var log);

                var status = DetermineEmployeeStatus(log, schedule);

                statusList.Add(new EmployeeAttendanceDto
                {
                    EmployeeId = employee.Id,
                    EmployeeName = $"{employee.FirstName} {employee.LastName}",
                    IsPresent = hasAttendance,
                    ClockInTime = log?.LoginTime,
                    ClockOutTime = log?.LogoutTime,
                    WorkDuration = log?.LogoutTime.HasValue == true
                        ? log.LogoutTime.Value - log.LoginTime
                        : (log != null ? DateTime.Now - log.LoginTime : null),
                    Status = status,
                    ScheduledStartTime = schedule?.StartTime,
                    ScheduledEndTime = schedule?.EndTime
                });
            }

            return new Response<List<EmployeeAttendanceDto>>(statusList, "Current attendance status retrieved successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting current attendance status");
            throw;
        }
    }

    #endregion

    #region Schedule Management

    /// <summary>
    /// Create a new work schedule
    /// </summary>
    public async Task<Response<WorkScheduleDto>> CreateScheduleAsync(int teamLeaderId, CreateScheduleDto createDto)
    {
        try
        {
            _logger.LogInformation($"Team leader {teamLeaderId} creating schedule for employee {createDto.EmployeeId}");

            // Verify employee exists
            var employee = await _userManager.FindByIdAsync(createDto.EmployeeId.ToString());
            if (employee == null || employee.UserType != UserType.Employee)
            {
                throw new NotFoundException($"Employee with ID {createDto.EmployeeId} not found");
            }

            // Check for existing schedule on same date
            var existingSchedule = await _context.WorkSchedules
                .FirstOrDefaultAsync(s => s.EmployeeId == createDto.EmployeeId &&
                                         s.ShiftDate.Date == createDto.ShiftDate.Date &&
                                         !s.IsDeleted);

            if (existingSchedule != null)
            {
                throw new ValidationException("Schedule already exists for this date",
                    new Dictionary<string, string[]>
                    {
                        { "ShiftDate", new[] { "An employee can only have one schedule per day" } }
                    });
            }

            var schedule = _mapper.Map<WorkSchedule>(createDto);
            schedule.CreatedById = teamLeaderId;
            schedule.CreatedAt = DateTime.UtcNow;
            
            var teamLeaderUserForSchedule = await _context.Users.FindAsync(teamLeaderId);
            schedule.UpdatedBy = teamLeaderUserForSchedule;
            schedule.UpdatedById = teamLeaderId;

            await _unitOfWork.Repository<WorkSchedule>().AddAsync(schedule);
            await _unitOfWork.CompleteAsync();

            // Load employee for response
            await _context.Entry(schedule)
                .Reference(s => s.Employee)
                .LoadAsync();

            var scheduleDto = _mapper.Map<WorkScheduleDto>(schedule);

            // Create notification for employee
            await CreateNotificationForEmployee(
                createDto.EmployeeId,
                "New Schedule Assigned",
                $"You have been scheduled for {createDto.ShiftDate:yyyy-MM-dd} from {createDto.StartTime} to {createDto.EndTime}",
                NotificationType.ScheduleChange,
                schedule.Id);

            return new Response<WorkScheduleDto>(scheduleDto, "Schedule created successfully");
        }
        catch (Exception ex) when (ex is not NotFoundException && ex is not ValidationException)
        {
            _logger.LogError(ex, "Error creating schedule");
            throw;
        }
    }

    /// <summary>
    /// Update an existing schedule
    /// </summary>
    public async Task<Response<WorkScheduleDto>> UpdateScheduleAsync(int teamLeaderId, int scheduleId, CreateScheduleDto updateDto)
    {
        try
        {
            _logger.LogInformation($"Team leader {teamLeaderId} updating schedule {scheduleId}");

            var schedule = await _context.WorkSchedules
                .Include(s => s.Employee)
                .FirstOrDefaultAsync(s => s.Id == scheduleId && !s.IsDeleted);

            if (schedule == null)
            {
                throw new NotFoundException($"Schedule with ID {scheduleId} not found");
            }

            // Check for conflicts (excluding current schedule)
            var conflict = await _context.WorkSchedules
                .AnyAsync(s => s.EmployeeId == updateDto.EmployeeId &&
                              s.ShiftDate.Date == updateDto.ShiftDate.Date &&
                              s.Id != scheduleId &&
                              !s.IsDeleted);

            if (conflict)
            {
                throw new ValidationException("Schedule conflict",
                    new Dictionary<string, string[]>
                    {
                        { "ShiftDate", new[] { "Another schedule already exists for this date" } }
                    });
            }

            // Update schedule
            _mapper.Map(updateDto, schedule);
            schedule.UpdatedAt = DateTime.UtcNow;
            var teamLeaderUserForUpdate = await _context.Users.FindAsync(teamLeaderId);
            schedule.UpdatedBy = teamLeaderUserForUpdate;
            schedule.UpdatedById = teamLeaderId;

            await _context.SaveChangesAsync();

            var scheduleDto = _mapper.Map<WorkScheduleDto>(schedule);

            // Notify employee of schedule change
            await CreateNotificationForEmployee(
                schedule.EmployeeId,
                "Schedule Updated",
                $"Your schedule for {schedule.ShiftDate:yyyy-MM-dd} has been updated to {schedule.StartTime}-{schedule.EndTime}",
                NotificationType.ScheduleChange,
                schedule.Id);

            return new Response<WorkScheduleDto>(scheduleDto, "Schedule updated successfully");
        }
        catch (Exception ex) when (ex is not NotFoundException && ex is not ValidationException)
        {
            _logger.LogError(ex, $"Error updating schedule {scheduleId}");
            throw;
        }
    }

    /// <summary>
    /// Delete a schedule (soft delete)
    /// </summary>
    public async Task<Response<bool>> DeleteScheduleAsync(int teamLeaderId, int scheduleId)
    {
        try
        {
            _logger.LogInformation($"Team leader {teamLeaderId} deleting schedule {scheduleId}");

            var schedule = await _context.WorkSchedules
                .FirstOrDefaultAsync(s => s.Id == scheduleId && !s.IsDeleted);

            if (schedule == null)
            {
                throw new NotFoundException($"Schedule with ID {scheduleId} not found");
            }

            // Soft delete
            schedule.IsDeleted = true;
            schedule.DeletedAt = DateTime.UtcNow;
            schedule.UpdatedAt = DateTime.UtcNow;
            var teamLeaderUserForDelete = await _context.Users.FindAsync(teamLeaderId);
            schedule.UpdatedBy = teamLeaderUserForDelete;
            schedule.UpdatedById = teamLeaderId;

            await _context.SaveChangesAsync();

            // Notify employee
            await CreateNotificationForEmployee(
                schedule.EmployeeId,
                "Schedule Cancelled",
                $"Your schedule for {schedule.ShiftDate:yyyy-MM-dd} has been cancelled",
                NotificationType.ScheduleChange,
                schedule.Id);

            return new Response<bool>(true, "Schedule deleted successfully");
        }
        catch (Exception ex) when (ex is not NotFoundException)
        {
            _logger.LogError(ex, $"Error deleting schedule {scheduleId}");
            throw;
        }
    }

    /// <summary>
    /// Get schedules for a date range
    /// </summary>
    public async Task<Response<List<WorkScheduleDto>>> GetSchedulesAsync(DateTime startDate, DateTime endDate, int? employeeId = null)
    {
        try
        {
            _logger.LogInformation($"Getting schedules from {startDate:yyyy-MM-dd} to {endDate:yyyy-MM-dd}");

            var query = _context.WorkSchedules
                .Include(s => s.Employee)
                .Where(s => s.ShiftDate.Date >= startDate.Date &&
                           s.ShiftDate.Date <= endDate.Date &&
                           !s.IsDeleted)
                .AsQueryable();

            if (employeeId.HasValue)
            {
                query = query.Where(s => s.EmployeeId == employeeId.Value);
            }

            var schedules = await query
                .OrderBy(s => s.ShiftDate)
                .ThenBy(s => s.StartTime)
                .ToListAsync();

            var scheduleDtos = _mapper.Map<List<WorkScheduleDto>>(schedules);

            return new Response<List<WorkScheduleDto>>(scheduleDtos, "Schedules retrieved successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting schedules");
            throw;
        }
    }

    /// <summary>
    /// Get today's schedule summary
    /// </summary>
    public async Task<Response<ScheduleSummaryDto>> GetTodayScheduleSummaryAsync()
    {
        try
        {
            _logger.LogInformation("Getting today's schedule summary");

            var egyptTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Egypt Standard Time");
            var egyptTime = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, egyptTimeZone);
            var today = egyptTime.Date;
            var schedules = await _context.WorkSchedules
                .Include(s => s.Employee)
                .Where(s => s.ShiftDate.Date == today.Date && !s.IsDeleted)
                .ToListAsync();

            var attendance = await _context.AttendanceLogs
                .Where(a => a.LogDate == DateOnly.FromDateTime(today))
                .ToDictionaryAsync(a => a.EmployeeId);

            var scheduleDtos = _mapper.Map<List<WorkScheduleDto>>(schedules);

            foreach (var sDto in scheduleDtos)
            {
                if (attendance.TryGetValue(sDto.EmployeeId, out var log))
                {
                    sDto.ActualStartTime = log.LoginTime;
                    sDto.ActualEndTime = log.LogoutTime;
                }
            }

            var summary = new ScheduleSummaryDto
            {
                Date = DateOnly.FromDateTime(today),
                TotalScheduled = schedules.Count,
                ClockedIn = schedules.Count(s => attendance.ContainsKey(s.EmployeeId)),
                NotClockedIn = schedules.Count(s => !attendance.ContainsKey(s.EmployeeId)),
                TodaySchedules = scheduleDtos
            };

            return new Response<ScheduleSummaryDto>(summary, "Today's schedule summary retrieved successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting today's schedule summary");
            throw;
        }
    }

    #endregion

    #region Private Helper Methods

    /// <summary>
    /// Create notification for an employee
    /// </summary>
    private async Task CreateNotificationForEmployee(int employeeId, string title, string message, NotificationType type, int relatedEntityId)
    {
        try
        {
            var notification = new Notification
            {
                UserId = employeeId,
                Title = title,
                Message = message,
                NotificationType = type,
                RelatedEntityId = relatedEntityId,
                RelatedEntityType = "DailyReport",
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            };

            await _unitOfWork.Repository<Notification>().AddAsync(notification);
            await _unitOfWork.CompleteAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating notification for employee");
        }
    }

    /// <summary>
    /// Create notifications for family members of an elderly resident
    /// </summary>
    private async Task CreateNotificationForFamily(int elderlyId, string title, string message, NotificationType type, int relatedEntityId)
    {
        try
        {
            var familyLinks = await _context.ElderlyFamilyMembers
                .Include(f => f.FamilyMember)
                .Where(f => f.ElderlyId == elderlyId && !f.IsDeleted)
                .ToListAsync();

            foreach (var link in familyLinks)
            {
                var notification = new Notification
                {
                    UserId = link.FamilyMemberId,
                    Title = title,
                    Message = message,
                    NotificationType = type,
                    RelatedEntityId = relatedEntityId,
                    RelatedEntityType = "DailyReport",
                    CreatedAt = DateTime.UtcNow,
                    IsRead = false
                };

                await _unitOfWork.Repository<Notification>().AddAsync(notification);
            }

            await _unitOfWork.CompleteAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating notifications for family members");
        }
    }

    /// <summary>
    /// Calculate late days for an employee in a date range
    /// </summary>
    private async Task<int> CalculateLateDays(int employeeId, DateTime startDate, DateTime endDate)
    {
        var rawSchedules = await _context.WorkSchedules
            .Where(s => s.EmployeeId == employeeId &&
                       s.ShiftDate.Date >= startDate.Date &&
                       s.ShiftDate.Date <= endDate.Date &&
                       !s.IsDeleted)
            .ToListAsync();
            
        var schedules = rawSchedules.GroupBy(s => s.ShiftDate.Date)
            .ToDictionary(g => g.Key, g => g.First());

        var rawAttendance = await _context.AttendanceLogs
            .Where(a => a.EmployeeId == employeeId &&
                       a.LoginTime.Date >= startDate.Date &&
                       a.LoginTime.Date <= endDate.Date)
            .ToListAsync();
            
        var attendance = rawAttendance.GroupBy(a => a.LoginTime.Date)
            .ToDictionary(g => g.Key, g => g.OrderBy(a => a.LoginTime).First());

        int lateDays = 0;

        foreach (var schedule in schedules)
        {
            if (attendance.TryGetValue(schedule.Key, out var log))
            {
                // Consider late if clock-in is more than 15 minutes after shift start
                if (log.LoginTime.TimeOfDay > schedule.Value.StartTime.Add(TimeSpan.FromMinutes(15)))
                {
                    lateDays++;
                }
            }
        }

        return lateDays;
    }

    /// <summary>
    /// Determine employee status based on attendance and schedule
    /// </summary>
    private string DetermineEmployeeStatus(AttendanceLog? attendance, WorkSchedule? schedule)
    {
        if (schedule == null)
            return "No Schedule";

        if (attendance == null)
            return "Absent";

        if (attendance.LogoutTime.HasValue)
            return "Completed";

        // Check if late
        var now = DateTime.Now.TimeOfDay;
        if (attendance.LoginTime.TimeOfDay > schedule.StartTime.Add(TimeSpan.FromMinutes(15)))
            return "Late";

        return "Present";
    }

    #endregion
    #region Visit Request Management

    /// <summary>
    /// Get paginated list of pending visit requests
    /// </summary>
    public async Task<Response<PaginatedResponse<List<VisitRequestDto>>>> GetPendingVisitRequestsAsync(
        VisitFilterParameters parameters)
    {
        try
        {
            _logger.LogInformation("Getting pending visit requests");

            var query = _context.VisitRequests
                .Include(v => v.FamilyMember)
                .Include(v => v.Elderly)
                .Where(v => v.Status == VisitStatus.Pending && !v.IsDeleted)
                .AsQueryable();

            // Apply filters
            if (parameters.ElderlyId.HasValue)
            {
                query = query.Where(v => v.ElderlyId == parameters.ElderlyId.Value);
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

            // Apply sorting (oldest pending first by default)
            query = parameters.SortBy?.ToLower() switch
            {
                "requesteddate" => parameters.SortDescending
                    ? query.OrderByDescending(v => v.RequestedDate)
                    : query.OrderBy(v => v.RequestedDate),
                "elderlyname" => parameters.SortDescending
                    ? query.OrderByDescending(v => v.Elderly.LastName)
                    : query.OrderBy(v => v.Elderly.LastName),
                _ => query.OrderBy(v => v.RequestedDate).ThenBy(v => v.RequestedTime)
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
                paginatedResponse, "Pending visit requests retrieved successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting pending visit requests");
            throw;
        }
    }

    /// <summary>
    /// Get detailed visit request information for approval
    /// </summary>
    public async Task<Response<VisitRequestDto>> GetVisitRequestDetailsAsync(int visitId)
    {
        try
        {
            _logger.LogInformation($"Getting visit request details for ID: {visitId}");

            var visit = await _context.VisitRequests
                .Include(v => v.FamilyMember)
                .Include(v => v.Elderly)
                .Include(v => v.ApprovedBy)
                .FirstOrDefaultAsync(v => v.Id == visitId && !v.IsDeleted);

            if (visit == null)
            {
                throw new NotFoundException($"Visit request with ID {visitId} not found");
            }

            // Get past visits from this family member
            var pastVisits = await _context.VisitRequests
                .Where(v => v.FamilyMemberId == visit.FamilyMemberId &&
                           v.ElderlyId == visit.ElderlyId &&
                           v.Id != visitId &&
                           !v.IsDeleted)
                .OrderByDescending(v => v.RequestedDate)
                .Take(5)
                .Select(v => new PastVisitDto
                {
                    VisitId = v.Id,
                    VisitDate = v.RequestedDate,
                    Status = v.Status.ToString(),
                    Notes = v.Notes
                })
                .ToListAsync();

            var visitDto = _mapper.Map<VisitRequestDto>(visit);

            // Create detailed response
            var detailsDto = new VisitRequestDetailsDto
            {
                Id = visitDto.Id,
                FamilyMemberId = visitDto.FamilyMemberId,
                FamilyMemberName = visitDto.FamilyMemberName,
                ElderlyId = visitDto.ElderlyId,
                ElderlyName = visitDto.ElderlyName,
                RequestedDate = visitDto.RequestedDate,
                RequestedTime = visitDto.RequestedTime,
                DurationMinutes = visitDto.DurationMinutes,
                Status = visitDto.Status,
                Notes = visitDto.Notes,
                CreatedAt = visitDto.CreatedAt,
                FamilyMemberEmail = visit.FamilyMember?.Email ?? string.Empty,
                FamilyMemberPhone = visit.FamilyMember?.PhoneNumber ?? string.Empty,
                TotalVisitsByFamily = pastVisits.Count,
                PastVisits = pastVisits
            };

            return new Response<VisitRequestDto>(detailsDto, "Visit request details retrieved successfully");
        }
        catch (Exception ex) when (ex is not NotFoundException)
        {
            _logger.LogError(ex, $"Error getting visit request details for {visitId}");
            throw;
        }
    }

    /// <summary>
    /// Approve a visit request
    /// </summary>
    public async Task<Response<VisitRequestDto>> ApproveVisitRequestAsync(int teamLeaderId, ApproveVisitDto approveDto)
    {
        try
        {
            _logger.LogInformation($"Team leader {teamLeaderId} approving visit request {approveDto.VisitId}");

            var visit = await _context.VisitRequests
                .Include(v => v.FamilyMember)
                .Include(v => v.Elderly)
                .FirstOrDefaultAsync(v => v.Id == approveDto.VisitId && !v.IsDeleted);

            if (visit == null)
            {
                throw new NotFoundException($"Visit request with ID {approveDto.VisitId} not found");
            }

            if (visit.Status != VisitStatus.Pending)
            {
                throw new ValidationException("Cannot approve non-pending visit",
                    new Dictionary<string, string[]>
                    {
                    { "Status", new[] { $"Visit is already {visit.Status}" } }
                    });
            }

            // Check if the requested date is in the past
            var egyptTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Egypt Standard Time");
            var egyptTime = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, egyptTimeZone);
            if (visit.RequestedDate < egyptTime.Date)
            {
                throw new ValidationException("Cannot approve past visit requests",
                    new Dictionary<string, string[]>
                    {
                    { "RequestedDate", new[] { "Cannot approve a visit request for a past date" } }
                    });
            }

            // Check for scheduling conflicts (optional - can be enhanced)
            var conflictingVisits = await _context.VisitRequests
                .AnyAsync(v => v.ElderlyId == visit.ElderlyId &&
                              v.RequestedDate.Date == visit.RequestedDate.Date &&
                              v.Status == VisitStatus.Approved &&
                              v.Id != visit.Id &&
                              !v.IsDeleted);

            if (conflictingVisits)
            {
                throw new ValidationException("Scheduling conflict",
                    new Dictionary<string, string[]>
                    {
                    { "Visit", new[] { "Another approved visit already exists for this elderly on this date" } }
                    });
            }

            // Update visit status
            visit.Status = VisitStatus.Approved;
            visit.ApprovedById = teamLeaderId;
            visit.ApprovedDate = DateTime.UtcNow;
            visit.Notes = string.IsNullOrEmpty(approveDto.Comments)
                ? visit.Notes
                : (visit.Notes + " | Approval comments: " + approveDto.Comments);
            visit.UpdatedAt = DateTime.UtcNow;
            visit.UpdatedBy = teamLeaderId.ToString();

            await _unitOfWork.CompleteAsync();

            // Create notification for family member
            await CreateNotificationForFamilyMember(
                visit.FamilyMemberId,
                "Visit Request Approved",
                $"Your visit request for {visit.Elderly?.FirstName} {visit.Elderly?.LastName} on {visit.RequestedDate:yyyy-MM-dd} at {visit.RequestedTime} has been approved.",
                NotificationType.VisitRequest,
                visit.Id
            );

            // Create notification for employee (optional - to inform care staff)
            await NotifyCareStaffAboutVisit(visit);

            var visitDto = _mapper.Map<VisitRequestDto>(visit);

            return new Response<VisitRequestDto>(visitDto, "Visit request approved successfully");
        }
        catch (Exception ex) when (ex is not NotFoundException && ex is not ValidationException)
        {
            _logger.LogError(ex, $"Error approving visit request {approveDto.VisitId}");
            throw;
        }
    }

    /// <summary>
    /// Reject a visit request
    /// </summary>
    public async Task<Response<VisitRequestDto>> RejectVisitRequestAsync(int teamLeaderId, RejectVisitDto rejectDto)
    {
        try
        {
            _logger.LogInformation($"Team leader {teamLeaderId} rejecting visit request {rejectDto.VisitId}");

            var visit = await _context.VisitRequests
                .Include(v => v.FamilyMember)
                .Include(v => v.Elderly)
                .FirstOrDefaultAsync(v => v.Id == rejectDto.VisitId && !v.IsDeleted);

            if (visit == null)
            {
                throw new NotFoundException($"Visit request with ID {rejectDto.VisitId} not found");
            }

            if (visit.Status != VisitStatus.Pending)
            {
                throw new ValidationException("Cannot reject non-pending visit",
                    new Dictionary<string, string[]>
                    {
                    { "Status", new[] { $"Visit is already {visit.Status}" } }
                    });
            }

            // Update visit status
            visit.Status = VisitStatus.Rejected;
            visit.ApprovedById = teamLeaderId;
            visit.ApprovedDate = DateTime.UtcNow;
            visit.RejectionReason = rejectDto.RejectionReason;
            visit.UpdatedAt = DateTime.UtcNow;
            visit.UpdatedBy = teamLeaderId.ToString();

            await _unitOfWork.CompleteAsync();

            // Create notification for family member
            await CreateNotificationForFamilyMember(
                visit.FamilyMemberId,
                "Visit Request Rejected",
                $"Your visit request for {visit.Elderly?.FirstName} {visit.Elderly?.LastName} on {visit.RequestedDate:yyyy-MM-dd} has been rejected. Reason: {rejectDto.RejectionReason}",
                NotificationType.VisitRequest,
                visit.Id
            );

            var visitDto = _mapper.Map<VisitRequestDto>(visit);

            return new Response<VisitRequestDto>(visitDto, "Visit request rejected successfully");
        }
        catch (Exception ex) when (ex is not NotFoundException && ex is not ValidationException)
        {
            _logger.LogError(ex, $"Error rejecting visit request {rejectDto.VisitId}");
            throw;
        }
    }

    /// <summary>
    /// Get visit requests summary for team leader dashboard
    /// </summary>
    public async Task<Response<VisitSummaryDto>> GetVisitRequestsSummaryAsync()
    {
        try
        {
            _logger.LogInformation("Getting visit requests summary");

            var egyptTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Egypt Standard Time");
            var egyptTime = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, egyptTimeZone);
            var today = egyptTime.Date;
            var tomorrow = today.AddDays(1);

            var totalPending = await _context.VisitRequests
                .CountAsync(v => v.Status == VisitStatus.Pending && !v.IsDeleted);

            var approvedToday = await _context.VisitRequests
                .CountAsync(v => v.Status == VisitStatus.Approved &&
                                v.ApprovedDate.HasValue &&
                                v.ApprovedDate.Value.Date == today &&
                                !v.IsDeleted);

            var rejectedToday = await _context.VisitRequests
                .CountAsync(v => v.Status == VisitStatus.Rejected &&
                                v.ApprovedDate.HasValue &&
                                v.ApprovedDate.Value.Date == today &&
                                !v.IsDeleted);

            var upcomingVisits = await _context.VisitRequests
                .CountAsync(v => v.Status == VisitStatus.Approved &&
                                v.RequestedDate >= today &&
                                !v.IsDeleted);

            var recentRequests = await _context.VisitRequests
                .Include(v => v.FamilyMember)
                .Include(v => v.Elderly)
                .Where(v => !v.IsDeleted)
                .OrderByDescending(v => v.RequestedDate)
                .Take(50)
                .ToListAsync();

            var summary = new VisitSummaryDto
            {
                TotalPending = totalPending,
                ApprovedToday = approvedToday,
                RejectedToday = rejectedToday,
                UpcomingVisits = upcomingVisits,
                RecentRequests = _mapper.Map<List<VisitRequestDto>>(recentRequests)
            };

            return new Response<VisitSummaryDto>(summary, "Visit summary retrieved successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting visit summary");
            throw;
        }
    }

    #endregion

    #region Private Helper Methods for Visit Management

    /// <summary>
    /// Create notification for family member
    /// </summary>
    private async Task CreateNotificationForFamilyMember(int familyMemberId, string title, string message, NotificationType type, int relatedEntityId)
    {
        try
        {
            var notification = new Notification
            {
                UserId = familyMemberId,
                Title = title,
                Message = message,
                NotificationType = type,
                RelatedEntityId = relatedEntityId,
                RelatedEntityType = "VisitRequest",
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            };

            await _unitOfWork.Repository<Notification>().AddAsync(notification);
            await _unitOfWork.CompleteAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating notification for family member");
        }
    }

    /// <summary>
    /// Notify care staff about approved visit
    /// </summary>
    private async Task NotifyCareStaffAboutVisit(VisitRequest visit)
    {
        try
        {
            // Get primary employee for this elderly
            var primaryAssignment = await _context.EmployeeElderlyAssignments
                .Include(a => a.Employee)
                .FirstOrDefaultAsync(a => a.ElderlyId == visit.ElderlyId &&
                                         a.IsPrimary &&
                                         !a.IsDeleted);

            if (primaryAssignment?.Employee != null)
            {
                var notification = new Notification
                {
                    UserId = primaryAssignment.EmployeeId,
                    Title = "Visit Scheduled",
                    Message = $"A family visit has been scheduled for {visit.Elderly?.FirstName} {visit.Elderly?.LastName} on {visit.RequestedDate:yyyy-MM-dd} at {visit.RequestedTime}",
                    NotificationType = NotificationType.VisitRequest,
                    RelatedEntityId = visit.Id,
                    RelatedEntityType = "VisitRequest",
                    CreatedAt = DateTime.UtcNow,
                    IsRead = false
                };

                await _unitOfWork.Repository<Notification>().AddAsync(notification);
                await _unitOfWork.CompleteAsync();
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error notifying care staff about visit");
        }
    }

    #endregion

    // AI Dietary Recommendation
    public async Task<Response<DietRecommendationOutputDto>> GetDietRecommendationAsync(int elderlyId)
    {
        try
        {
            _logger.LogInformation($"Generating AI diet recommendation for resident: {elderlyId}");

            // 1. Fetch resident details
            var resident = await _context.Elderlies
                .FirstOrDefaultAsync(e => e.Id == elderlyId && !e.IsDeleted);

            if (resident == null)
            {
                throw new NotFoundException($"Resident with ID {elderlyId} not found");
            }

            // Calculate age
            int age = DateTime.Today.Year - resident.DateOfBirth.Year;

            // 2. Query recent daily reports (e.g. last 7 reports)
            var recentReports = await _context.DailyReports
                .Include(r => r.HealthMetrics)
                .Where(r => r.ElderlyId == elderlyId && r.ApprovalStatus == ApprovalStatus.Approved && !r.IsDeleted)
                .OrderByDescending(r => r.ReportDate)
                .Take(7)
                .ToListAsync();

            // Default values
            double avgMealsEatenPercent = 100.0;
            double recentAvgBloodSugar = 100.0;
            double recentAvgSystolicBp = 120.0;

            if (recentReports.Any())
            {
                var mealsEatenValues = new List<int>();
                var bloodSugarValues = new List<int>();
                var systolicBpValues = new List<int>();

                foreach (var report in recentReports)
                {
                    if (report.HealthMetrics != null)
                    {
                        foreach (var m in report.HealthMetrics)
                        {
                            var name = m.MetricName?.ToLower() ?? "";
                            var type = m.MetricType;
                            var val = m.MetricValue;

                            // Meals Eaten
                            if (type == MetricType.Meal || name.Contains("meal"))
                            {
                                var cleanVal = new string(val.Where(char.IsDigit).ToArray());
                                if (int.TryParse(cleanVal, out int parsedMeal))
                                {
                                    mealsEatenValues.Add(parsedMeal);
                                }
                            }

                            // Blood Sugar & Blood Pressure are Vitals
                            if (type == MetricType.Vital || name.Contains("sugar") || name.Contains("glucose") || name.Contains("blood pressure") || name == "bp")
                            {
                                if (name.Contains("sugar") || name.Contains("glucose"))
                                {
                                    var cleanVal = new string(val.Where(char.IsDigit).ToArray());
                                    if (int.TryParse(cleanVal, out int parsedSugar))
                                    {
                                        bloodSugarValues.Add(parsedSugar);
                                    }
                                }
                                else if (name.Contains("blood pressure") || name == "bp")
                                {
                                    var parts = val.Split('/');
                                    if (parts.Length == 2)
                                    {
                                        var cleanSys = new string(parts[0].Where(char.IsDigit).ToArray());
                                        if (int.TryParse(cleanSys, out int parsedSys))
                                        {
                                            systolicBpValues.Add(parsedSys);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                if (mealsEatenValues.Any()) avgMealsEatenPercent = mealsEatenValues.Average();
                if (bloodSugarValues.Any()) recentAvgBloodSugar = bloodSugarValues.Average();
                if (systolicBpValues.Any()) recentAvgSystolicBp = systolicBpValues.Average();
            }

            // 3. Compile input DTO
            var inputDto = new DietRecommendationInputDto
            {
                ElderlyId = elderlyId,
                Age = age,
                MedicalConditions = resident.MedicalConditions ?? string.Empty,
                Allergies = resident.Allergies ?? string.Empty,
                DietaryRestrictions = resident.DietaryRestrictions ?? string.Empty,
                AvgMealsEatenPercent = avgMealsEatenPercent,
                RecentAvgBloodSugar = recentAvgBloodSugar,
                RecentAvgSystolicBp = recentAvgSystolicBp
            };

            // 4. Call Python ML microservice
            var recommendationResult = await _aiPredictionService.RecommendDietAsync(inputDto);

            if (recommendationResult == null)
            {
                return new Response<DietRecommendationOutputDto>("AI Diet Recommendation service is temporarily unavailable. Please try again later.")
                {
                    Succeeded = false
                };
            }

            recommendationResult.AvgMealsEatenPercent = inputDto.AvgMealsEatenPercent;
            recommendationResult.RecentAvgBloodSugar = inputDto.RecentAvgBloodSugar;
            recommendationResult.RecentAvgSystolicBp = inputDto.RecentAvgSystolicBp;

            return new Response<DietRecommendationOutputDto>(recommendationResult, "AI Diet Recommendation generated successfully");
        }
        catch (Exception ex) when (ex is not NotFoundException)
        {
            _logger.LogError(ex, $"Error generating AI diet recommendation for resident {elderlyId}");
            throw;
        }
    }

    /// <summary>
    /// Retrieve all recipes from AI service
    /// </summary>
    public async Task<Response<List<RecipeDto>>> GetRecipesAsync()
    {
        try
        {
            _logger.LogInformation("Retrieving all active dietary recipes from AI service");
            var recipes = await _aiPredictionService.GetRecipesAsync();
            return new Response<List<RecipeDto>>(recipes, "Recipes retrieved successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving recipes in TeamLeaderService");
            throw;
        }
    }

    /// <summary>
    /// Add a new recipe to AI service (which triggers auto-retraining)
    /// </summary>
    public async Task<Response<RecipeDto>> AddRecipeAsync(RecipeDto recipeDto)
    {
        try
        {
            _logger.LogInformation($"Adding new recipe: {recipeDto.RecipeName}");
            var created = await _aiPredictionService.AddRecipeAsync(recipeDto);
            if (created == null)
            {
                return new Response<RecipeDto>("Failed to add new recipe or retraining timed out.")
                {
                    Succeeded = false
                };
            }
            return new Response<RecipeDto>(created, "Recipe added and model retrained successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding recipe in TeamLeaderService");
            throw;
        }
    }

    /// <summary>
    /// Explicitly trigger AI model retraining
    /// </summary>
    public async Task<Response<bool>> RetrainModelAsync()
    {
        try
        {
            _logger.LogInformation("Explicitly triggering AI model retraining");
            var result = await _aiPredictionService.RetrainModelAsync();
            if (!result)
            {
                return new Response<bool>("Model retraining failed. Please check logs.")
                {
                    Succeeded = false,
                    Data = false
                };
            }
            return new Response<bool>(true, "Model retraining completed successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retraining model in TeamLeaderService");
            throw;
        }
    }

    /// <summary>
    /// Get details of a specific elderly resident
    /// </summary>
    public async Task<Response<ElderlyDetailDto>> GetElderlyByIdAsync(int elderlyId)
    {
        try
        {
            _logger.LogInformation($"Getting elderly resident detail for ID: {elderlyId} in TeamLeaderService");

            var elderly = await _context.Elderlies
                .Include(e => e.EmployeeAssignments)
                    .ThenInclude(ea => ea.Employee)
                .Include(e => e.FamilyMembers)
                    .ThenInclude(fm => fm.FamilyMember)
                .FirstOrDefaultAsync(e => e.Id == elderlyId && !e.IsDeleted);

            if (elderly == null)
            {
                throw new NotFoundException($"Resident with ID {elderlyId} not found");
            }

            var dto = _mapper.Map<ElderlyDetailDto>(elderly);
            return new Response<ElderlyDetailDto>(dto, "Resident details retrieved successfully");
        }
        catch (Exception ex) when (ex is not NotFoundException)
        {
            _logger.LogError(ex, $"Error getting elderly resident detail for ID: {elderlyId}");
            throw;
        }
    }
}