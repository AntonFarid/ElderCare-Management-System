using AutoMapper;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SmartElderlyCare.Application.Common.Exceptions;
using SmartElderlyCare.Application.DTOs.Common;
using SmartElderlyCare.Application.DTOs.DailyReport;
using SmartElderlyCare.Application.DTOs.Elderly;
using SmartElderlyCare.Application.DTOs.Schedule;
using SmartElderlyCare.Application.DTOs.User;
using SmartElderlyCare.Application.Interfaces;
using SmartElderlyCare.Application.Wrappers;
using SmartElderlyCare.Domain.Entities;
using SmartElderlyCare.Domain.Enums;
using SmartElderlyCare.Domain.Interfaces;
using SmartElderlyCare.Infrastructure.Data.Context;
using System.Text.Json;

namespace SmartElderlyCare.Infrastructure.Services;

/// <summary>
/// Employee service implementation
/// </summary>
public class EmployeeService : IEmployeeService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly ILogger<EmployeeService> _logger;
    private readonly UserManager<User> _userManager;
    private readonly ApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public EmployeeService(
        IUnitOfWork unitOfWork,
        IMapper mapper,
        ILogger<EmployeeService> logger,
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
    /// Get employee profile
    /// </summary>
    public async Task<Response<UserDto>> GetProfileAsync(int employeeId)
    {
        try
        {
            _logger.LogInformation($"Getting profile for employee ID: {employeeId}");

            var user = await _userManager.FindByIdAsync(employeeId.ToString());
            if (user == null)
            {
                throw new NotFoundException($"Employee with ID {employeeId} not found");
            }

            if (user.UserType != UserType.Employee)
            {
                throw new ForbiddenException("User is not an employee");
            }

            var userDto = _mapper.Map<UserDto>(user);
            var roles = await _userManager.GetRolesAsync(user);
            userDto.Roles = roles.ToList();

            return new Response<UserDto>(userDto, "Profile retrieved successfully");
        }
        catch (Exception ex) when (ex is not NotFoundException && ex is not ForbiddenException)
        {
            _logger.LogError(ex, $"Error getting profile for employee {employeeId}");
            throw;
        }
    }

    /// <summary>
    /// Update employee profile
    /// </summary>
    public async Task<Response<UserDto>> UpdateProfileAsync(int employeeId, UpdateUserDto updateDto)
    {
        try
        {
            _logger.LogInformation($"Updating profile for employee ID: {employeeId}");

            var user = await _userManager.FindByIdAsync(employeeId.ToString());
            if (user == null)
            {
                throw new NotFoundException($"Employee with ID {employeeId} not found");
            }

            // Map update DTO to entity
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
            _logger.LogError(ex, $"Error updating profile for employee {employeeId}");
            throw;
        }
    }

    #endregion

    #region Assigned Elderly

    /// <summary>
    /// Get elderly residents assigned to the employee
    /// </summary>
    public async Task<Response<List<ElderlyDto>>> GetAssignedElderlyAsync(int employeeId)
    {
        try
        {
            _logger.LogInformation($"Getting assigned elderly for employee ID: {employeeId}");

            var assignments = await _context.EmployeeElderlyAssignments
                .Include(a => a.Elderly)
                .Where(a => a.EmployeeId == employeeId && !a.IsDeleted)
                .Select(a => a.Elderly)
                .Where(e => e.IsActive && !e.IsDeleted)
                .ToListAsync();

            var elderlyDtos = _mapper.Map<List<ElderlyDto>>(assignments);

            return new Response<List<ElderlyDto>>(elderlyDtos, "Assigned elderly retrieved successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error getting assigned elderly for employee {employeeId}");
            throw;
        }
    }

    /// <summary>
    /// Get detailed information for a specific elderly resident
    /// </summary>
    public async Task<Response<ElderlyDetailDto>> GetElderlyDetailsAsync(int employeeId, int elderlyId)
    {
        try
        {
            _logger.LogInformation($"Getting elderly details for employee {employeeId}, elderly {elderlyId}");

            // Verify employee has access to this elderly
            var hasAccess = await _context.EmployeeElderlyAssignments
                .AnyAsync(a => a.EmployeeId == employeeId && a.ElderlyId == elderlyId && !a.IsDeleted);

            if (!hasAccess)
            {
                throw new ForbiddenException("You do not have access to this elderly resident");
            }

            var elderly = await _context.Elderlies
                .Include(e => e.EmployeeAssignments)
                    .ThenInclude(a => a.Employee)
                .Include(e => e.FamilyMembers)
                    .ThenInclude(f => f.FamilyMember)
                .Include(e => e.DailyReports)
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
            _logger.LogError(ex, $"Error getting elderly details for employee {employeeId}, elderly {elderlyId}");
            throw;
        }
    }

    #endregion

    #region Daily Reports

    /// <summary>
    /// Create a new daily report
    /// </summary>
    public async Task<Response<DailyReportDto>> CreateDailyReportAsync(int employeeId, CreateDailyReportDto createDto)
    {
        try
        {
            _logger.LogInformation($"Creating daily report for employee {employeeId}, elderly {createDto.ElderlyId}");

            // Verify employee has access to this elderly
            var hasAccess = await _context.EmployeeElderlyAssignments
                .AnyAsync(a => a.EmployeeId == employeeId && a.ElderlyId == createDto.ElderlyId && !a.IsDeleted);

            if (!hasAccess)
            {
                throw new ForbiddenException("You are not assigned to this elderly resident");
            }

            // Check if report already exists for this date
            var existingReport = await _context.DailyReports
                .FirstOrDefaultAsync(r => r.EmployeeId == employeeId &&
                                          r.ElderlyId == createDto.ElderlyId &&
                                          r.ReportDate.Date == createDto.ReportDate.Date &&
                                          !r.IsDeleted);

            if (existingReport != null)
            {
                throw new ValidationException("A report for this elderly on this date already exists",
                    new Dictionary<string, string[]>
                    {
                        { "ReportDate", new[] { "A report already exists for this date" } }
                    });
            }

            // Map DTO to entity
            var report = _mapper.Map<DailyReport>(createDto);
            report.EmployeeId = employeeId;
            report.SubmissionDate = DateTime.UtcNow;
            report.ApprovalStatus = ApprovalStatus.Pending;
            report.CreatedAt = DateTime.UtcNow;
            report.CreatedBy = employeeId.ToString();

            // Store structured data as JSON for AI processing
            report.StructuredData = JsonSerializer.Serialize(new
            {
                createDto.ReportDate,
                createDto.ElderlyId,
                createDto.HealthMetrics,
                createDto.AdditionalNotes,
                SubmittedBy = employeeId,
                SubmittedAt = DateTime.UtcNow
            });

            // Add report
            await _unitOfWork.Repository<DailyReport>().AddAsync(report);
            await _unitOfWork.CompleteAsync();

            // TODO: Trigger AI report generation (will be implemented in next phase)
            // For now, set a placeholder AI report
            report.AiGeneratedReport = "AI report generation pending...";
            await _unitOfWork.CompleteAsync();

            // Load related data for response
            var savedReport = await _context.DailyReports
                .Include(r => r.Employee)
                .Include(r => r.Elderly)
                .Include(r => r.HealthMetrics)
                .FirstOrDefaultAsync(r => r.Id == report.Id);

            var reportDto = _mapper.Map<DailyReportDto>(savedReport);

            // Create notification for team leader
            await CreateNotificationForTeamLeaders(
                "New Report Pending Approval",
                $"A new report for {savedReport?.Elderly?.FirstName} {savedReport?.Elderly?.LastName} requires your approval",
                NotificationType.ReportApproved,
                report.Id);

            return new Response<DailyReportDto>(reportDto, "Daily report created successfully and sent for approval");
        }
        catch (Exception ex) when (ex is not ForbiddenException && ex is not ValidationException)
        {
            _logger.LogError(ex, $"Error creating daily report for employee {employeeId}");
            throw;
        }
    }

    /// <summary>
    /// Update an existing daily report (only if pending)
    /// </summary>
    public async Task<Response<DailyReportDto>> UpdateDailyReportAsync(int employeeId, int reportId, CreateDailyReportDto updateDto)
    {
        try
        {
            _logger.LogInformation($"Updating daily report {reportId} for employee {employeeId}");

            var report = await _context.DailyReports
                .Include(r => r.HealthMetrics)
                .FirstOrDefaultAsync(r => r.Id == reportId && r.EmployeeId == employeeId && !r.IsDeleted);

            if (report == null)
            {
                throw new NotFoundException($"Report with ID {reportId} not found");
            }

            if (report.ApprovalStatus != ApprovalStatus.Pending)
            {
                throw new ValidationException("Cannot update report that is already approved or rejected",
                    new Dictionary<string, string[]>
                    {
                        { "Status", new[] { $"Report is {report.ApprovalStatus}. Only pending reports can be updated." } }
                    });
            }

            // Remove existing health metrics
            _context.HealthMetrics.RemoveRange(report.HealthMetrics);

            // Update report properties
            report.ReportDate = updateDto.ReportDate;
            report.UpdatedAt = DateTime.UtcNow;
            report.UpdatedBy = employeeId.ToString();
            report.StructuredData = JsonSerializer.Serialize(new
            {
                updateDto.ReportDate,
                updateDto.ElderlyId,
                updateDto.HealthMetrics,
                updateDto.AdditionalNotes,
                UpdatedBy = employeeId,
                UpdatedAt = DateTime.UtcNow
            });

            // Add new health metrics
            foreach (var metricDto in updateDto.HealthMetrics)
            {
                var metric = _mapper.Map<HealthMetric>(metricDto);
                metric.DailyReportId = reportId;
                _context.HealthMetrics.Add(metric);
            }

            await _context.SaveChangesAsync();

            // Reload the report
            var updatedReport = await _context.DailyReports
                .Include(r => r.Employee)
                .Include(r => r.Elderly)
                .Include(r => r.HealthMetrics)
                .FirstOrDefaultAsync(r => r.Id == reportId);

            var reportDto = _mapper.Map<DailyReportDto>(updatedReport);

            return new Response<DailyReportDto>(reportDto, "Daily report updated successfully");
        }
        catch (Exception ex) when (ex is not NotFoundException && ex is not ValidationException)
        {
            _logger.LogError(ex, $"Error updating daily report {reportId} for employee {employeeId}");
            throw;
        }
    }

    /// <summary>
    /// Get daily report by ID
    /// </summary>
    public async Task<Response<DailyReportDto>> GetDailyReportByIdAsync(int employeeId, int reportId)
    {
        try
        {
            _logger.LogInformation($"Getting daily report {reportId} for employee {employeeId}");

            var report = await _context.DailyReports
                .Include(r => r.Employee)
                .Include(r => r.Elderly)
                .Include(r => r.ApprovedBy)
                .Include(r => r.HealthMetrics)
                .FirstOrDefaultAsync(r => r.Id == reportId && r.EmployeeId == employeeId && !r.IsDeleted);

            if (report == null)
            {
                throw new NotFoundException($"Report with ID {reportId} not found");
            }

            var reportDto = _mapper.Map<DailyReportDto>(report);

            return new Response<DailyReportDto>(reportDto, "Report retrieved successfully");
        }
        catch (Exception ex) when (ex is not NotFoundException)
        {
            _logger.LogError(ex, $"Error getting daily report {reportId} for employee {employeeId}");
            throw;
        }
    }

    /// <summary>
    /// Get paginated list of employee's reports with filtering
    /// </summary>
    public async Task<Response<PaginatedResponse<List<DailyReportDto>>>> GetMyReportsAsync(
        int employeeId, ReportFilterParameters parameters)
    {
        try
        {
            _logger.LogInformation($"Getting reports for employee {employeeId} with filters");

            var query = _context.DailyReports
                .Include(r => r.Employee)
                .Include(r => r.Elderly)
                .Include(r => r.ApprovedBy)
                .Include(r => r.HealthMetrics)
                .Where(r => r.EmployeeId == employeeId && !r.IsDeleted)
                .AsQueryable();

            // Apply filters
            if (parameters.ElderlyId.HasValue)
            {
                query = query.Where(r => r.ElderlyId == parameters.ElderlyId);
            }

            if (!string.IsNullOrEmpty(parameters.Status) &&
                Enum.TryParse<ApprovalStatus>(parameters.Status, true, out var status))
            {
                query = query.Where(r => r.ApprovalStatus == status);
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
                "status" => parameters.SortDescending
                    ? query.OrderByDescending(r => r.ApprovalStatus)
                    : query.OrderBy(r => r.ApprovalStatus),
                _ => query.OrderByDescending(r => r.ReportDate)
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
                paginatedResponse, "Reports retrieved successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error getting reports for employee {employeeId}");
            throw;
        }
    }

    /// <summary>
    /// Get summary of employee's reports
    /// </summary>
    public async Task<Response<ReportSummaryDto>> GetReportsSummaryAsync(int employeeId)
    {
        try
        {
            _logger.LogInformation($"Getting report summary for employee {employeeId}");

            var reports = await _context.DailyReports
                .Include(r => r.Elderly)
                .Where(r => r.EmployeeId == employeeId && !r.IsDeleted)
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
                    reports.OrderByDescending(r => r.SubmissionDate).Take(5))
            };

            return new Response<ReportSummaryDto>(summary, "Report summary retrieved successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error getting report summary for employee {employeeId}");
            throw;
        }
    }

    #endregion

    #region Task Completion Tracking

    /// <summary>
    /// Get task summary for a specific date
    /// </summary>
    public async Task<Response<TaskSummaryDto>> GetTaskSummaryAsync(int employeeId, DateTime date)
    {
        try
        {
            _logger.LogInformation($"Getting task summary for employee {employeeId} on {date:yyyy-MM-dd}");

            var assignedElderly = await _context.EmployeeElderlyAssignments
                .Where(a => a.EmployeeId == employeeId && !a.IsDeleted)
                .Select(a => a.Elderly)
                .Where(e => e.IsActive && !e.IsDeleted)
                .ToListAsync();

            var reportsForDate = await _context.DailyReports
                .Where(r => r.EmployeeId == employeeId &&
                           r.ReportDate.Date == date.Date &&
                           !r.IsDeleted)
                .ToListAsync();

            var tasks = new List<TaskItemDto>();

            // Create tasks for each elderly
            foreach (var elderly in assignedElderly)
            {
                var reportForElderly = reportsForDate.FirstOrDefault(r => r.ElderlyId == elderly.Id);

                tasks.Add(new TaskItemDto
                {
                    Id = reportForElderly?.Id ?? 0,
                    ElderlyId = elderly.Id,
                    ElderlyName = $"{elderly.FirstName} {elderly.LastName}",
                    TaskType = "Daily Report",
                    Description = $"Submit daily report for {elderly.FirstName} {elderly.LastName}",
                    DueDate = date,
                    IsCompleted = reportForElderly != null,
                    CompletedAt = reportForElderly?.SubmissionDate,
                    Priority = "High"
                });
            }

            var summary = new TaskSummaryDto
            {
                Date = date,
                TotalTasks = tasks.Count,
                CompletedTasks = tasks.Count(t => t.IsCompleted),
                PendingTasks = tasks.Count(t => !t.IsCompleted),
                CompletionRate = tasks.Count > 0
                    ? Math.Round((double)tasks.Count(t => t.IsCompleted) / tasks.Count * 100, 2)
                    : 0,
                Tasks = tasks
            };

            return new Response<TaskSummaryDto>(summary, "Task summary retrieved successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error getting task summary for employee {employeeId}");
            throw;
        }
    }

    /// <summary>
    /// Get pending tasks for today
    /// </summary>
    public async Task<Response<List<TaskItemDto>>> GetPendingTasksAsync(int employeeId)
    {
        try
        {
            _logger.LogInformation($"Getting pending tasks for employee {employeeId}");

            var today = DateTime.Today;
            var summary = await GetTaskSummaryAsync(employeeId, today);

            var pendingTasks = summary.Data?.Tasks
                .Where(t => !t.IsCompleted)
                .OrderByDescending(t => t.Priority)
                .ThenBy(t => t.DueDate)
                .ToList() ?? new List<TaskItemDto>();

            return new Response<List<TaskItemDto>>(pendingTasks, "Pending tasks retrieved successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error getting pending tasks for employee {employeeId}");
            throw;
        }
    }

    /// <summary>
    /// Mark a task as completed (for non-report tasks)
    /// </summary>
    public async Task<Response<bool>> MarkTaskAsCompletedAsync(int employeeId, int reportId)
    {
        try
        {
            _logger.LogInformation($"Marking task {reportId} as completed for employee {employeeId}");

            // For now, tasks are primarily report-based
            // This method can be extended for other task types
            var report = await _context.DailyReports
                .FirstOrDefaultAsync(r => r.Id == reportId && r.EmployeeId == employeeId);

            if (report == null)
            {
                throw new NotFoundException($"Report with ID {reportId} not found");
            }

            return new Response<bool>(true, "Task marked as completed");
        }
        catch (Exception ex) when (ex is not NotFoundException)
        {
            _logger.LogError(ex, $"Error marking task {reportId} as completed for employee {employeeId}");
            throw;
        }
    }

    #endregion

    #region Work Schedule

    /// <summary>
    /// Get work schedule for a date range
    /// </summary>
    public async Task<Response<List<WorkScheduleDto>>> GetScheduleAsync(int employeeId, DateTime startDate, DateTime endDate)
    {
        try
        {
            _logger.LogInformation($"Getting schedule for employee {employeeId} from {startDate:yyyy-MM-dd} to {endDate:yyyy-MM-dd}");

            var schedules = await _context.WorkSchedules
                .Include(s => s.Employee)
                .Where(s => s.EmployeeId == employeeId &&
                           s.ShiftDate.Date >= startDate.Date &&
                           s.ShiftDate.Date <= endDate.Date &&
                           !s.IsDeleted)
                .OrderBy(s => s.ShiftDate)
                .ThenBy(s => s.StartTime)
                .ToListAsync();

            var scheduleDtos = _mapper.Map<List<WorkScheduleDto>>(schedules);

            return new Response<List<WorkScheduleDto>>(scheduleDtos, "Schedule retrieved successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error getting schedule for employee {employeeId}");
            throw;
        }
    }

    /// <summary>
    /// Get today's schedule
    /// </summary>
    public async Task<Response<WorkScheduleDto>> GetTodayScheduleAsync(int employeeId)
    {
        try
        {
            _logger.LogInformation($"Getting today's schedule for employee {employeeId}");

            var today = DateTime.Today;
            var schedule = await _context.WorkSchedules
                .Include(s => s.Employee)
                .FirstOrDefaultAsync(s => s.EmployeeId == employeeId &&
                                         s.ShiftDate.Date == today.Date &&
                                         !s.IsDeleted);

            if (schedule == null)
            {
                return new Response<WorkScheduleDto>(null, "No schedule found for today");
            }

            var scheduleDto = _mapper.Map<WorkScheduleDto>(schedule);

            return new Response<WorkScheduleDto>(scheduleDto, "Today's schedule retrieved successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error getting today's schedule for employee {employeeId}");
            throw;
        }
    }

    #endregion

    #region Attendance

    /// <summary>
    /// Clock in for the day
    /// </summary>
    public async Task<Response<AttendanceLogDto>> ClockInAsync(int employeeId)
    {
        try
        {
            _logger.LogInformation($"Employee {employeeId} clocking in");

            // Check if already clocked in today
            var today = DateTime.Today;
            var existingLog = await _context.AttendanceLogs
                .FirstOrDefaultAsync(a => a.EmployeeId == employeeId &&
                                         a.LoginTime.Date == today);

            if (existingLog != null)
            {
                if (existingLog.LogoutTime == null)
                {
                    throw new ValidationException("Already clocked in",
                        new Dictionary<string, string[]>
                        {
                            { "Attendance", new[] { "You are already clocked in" } }
                        });
                }
                else
                {
                    throw new ValidationException("Already clocked out for today",
                        new Dictionary<string, string[]>
                        {
                            { "Attendance", new[] { "You have already completed your shift for today" } }
                        });
                }
            }

            // Check if employee has a schedule for today
            var schedule = await _context.WorkSchedules
                .FirstOrDefaultAsync(s => s.EmployeeId == employeeId &&
                                         s.ShiftDate.Date == today);

            var attendanceLog = new AttendanceLog
            {
                EmployeeId = employeeId,
                LoginTime = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            };

            await _unitOfWork.Repository<AttendanceLog>().AddAsync(attendanceLog);
            await _unitOfWork.CompleteAsync();

            var logDto = _mapper.Map<AttendanceLogDto>(attendanceLog);

            return new Response<AttendanceLogDto>(logDto, "Clocked in successfully");
        }
        catch (Exception ex) when (ex is not ValidationException)
        {
            _logger.LogError(ex, $"Error clocking in for employee {employeeId}");
            throw;
        }
    }

    /// <summary>
    /// Clock out for the day
    /// </summary>
    public async Task<Response<AttendanceLogDto>> ClockOutAsync(int employeeId)
    {
        try
        {
            _logger.LogInformation($"Employee {employeeId} clocking out");

            var today = DateTime.Today;
            var attendanceLog = await _context.AttendanceLogs
                .FirstOrDefaultAsync(a => a.EmployeeId == employeeId &&
                                         a.LoginTime.Date == today &&
                                         a.LogoutTime == null);

            if (attendanceLog == null)
            {
                throw new ValidationException("No active clock-in found",
                    new Dictionary<string, string[]>
                    {
                        { "Attendance", new[] { "You haven't clocked in today or already clocked out" } }
                    });
            }

            attendanceLog.LogoutTime = DateTime.UtcNow;
            attendanceLog.UpdatedAt = DateTime.UtcNow;

            await _unitOfWork.CompleteAsync();

            var logDto = _mapper.Map<AttendanceLogDto>(attendanceLog);

            return new Response<AttendanceLogDto>(logDto, "Clocked out successfully");
        }
        catch (Exception ex) when (ex is not ValidationException)
        {
            _logger.LogError(ex, $"Error clocking out for employee {employeeId}");
            throw;
        }
    }

    /// <summary>
    /// Get current attendance status
    /// </summary>
    public async Task<Response<AttendanceLogDto>> GetCurrentAttendanceStatusAsync(int employeeId)
    {
        try
        {
            _logger.LogInformation($"Getting attendance status for employee {employeeId}");

            var today = DateTime.Today;
            var attendanceLog = await _context.AttendanceLogs
                .FirstOrDefaultAsync(a => a.EmployeeId == employeeId &&
                                         a.LoginTime.Date == today);

            var logDto = attendanceLog != null
                ? _mapper.Map<AttendanceLogDto>(attendanceLog)
                : null;

            return new Response<AttendanceLogDto>(logDto,
                attendanceLog != null ? "Attendance status retrieved" : "No attendance record for today");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error getting attendance status for employee {employeeId}");
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
            _logger.LogError(ex, "Error creating notifications for team leaders");
            // Don't throw - notification failure shouldn't break the main flow
        }
    }

    #endregion
}