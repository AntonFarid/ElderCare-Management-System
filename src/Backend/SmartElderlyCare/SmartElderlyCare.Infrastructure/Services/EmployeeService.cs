using AutoMapper;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using SmartElderlyCare.Application.Common.Exceptions;
using SmartElderlyCare.Application.DTOs.Common;
using SmartElderlyCare.Application.DTOs.DailyReport;
using SmartElderlyCare.Application.DTOs.Elderly;
using SmartElderlyCare.Application.DTOs.Gemini;
using SmartElderlyCare.Application.DTOs.Schedule;
using SmartElderlyCare.Application.DTOs.User;
using SmartElderlyCare.Application.Interfaces;
using SmartElderlyCare.Application.Wrappers;
using SmartElderlyCare.Domain.Entities;
using SmartElderlyCare.Domain.Enums;
using SmartElderlyCare.Domain.Interfaces;
using SmartElderlyCare.Infrastructure.Data.Context;
using System.Text;
using System.Text.Json;
using SmartElderlyCare.Application.DTOs.AI;
using SmartElderlyCare.Application.DTOs.Notification;

namespace SmartElderlyCare.Infrastructure.Services;

/// <summary>
/// Employee service implementation with AI integration
/// </summary>
public class EmployeeService : IEmployeeService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly ILogger<EmployeeService> _logger;
    private readonly UserManager<User> _userManager;
    private readonly ApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IGeminiService _geminiService;
    private readonly IServiceProvider _serviceProvider;

    public EmployeeService(
        IUnitOfWork unitOfWork,
        IMapper mapper,
        ILogger<EmployeeService> logger,
        UserManager<User> userManager,
        ApplicationDbContext context,
        ICurrentUserService currentUserService,
        IGeminiService geminiService,
        IServiceProvider serviceProvider)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _logger = logger;
        _userManager = userManager;
        _context = context;
        _currentUserService = currentUserService;
        _geminiService = geminiService;
        _serviceProvider = serviceProvider;
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
    /// Create a new daily report with AI-generated content
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

            // Get elderly name for AI
            var elderly = await _context.Elderlies
                .FirstOrDefaultAsync(e => e.Id == createDto.ElderlyId);

            // Map DTO to entity
            var egyptTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Egypt Standard Time");
            var egyptTime = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, egyptTimeZone);
            
            var report = _mapper.Map<DailyReport>(createDto);
            report.EmployeeId = employeeId;
            report.SubmissionDate = egyptTime;
            report.ApprovalStatus = ApprovalStatus.Pending;
            report.CreatedAt = egyptTime;
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

            // Set a temporary placeholder (will be replaced by AI)
            report.AiGeneratedReport = "AI report generation in progress...";

            // Add report
            await _unitOfWork.Repository<DailyReport>().AddAsync(report);
            await _unitOfWork.CompleteAsync();

            _logger.LogInformation($"Report {report.Id} saved, now triggering AI generation in background");

            // TRIGGER AI REPORT GENERATION IN BACKGROUND
            _ = Task.Run(async () => await GenerateAIReportAsync(report.Id, employeeId, createDto, elderly));

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
    /// Background task to generate AI report
    /// </summary>
    /// <summary>
    /// Background task to generate AI report
    /// </summary>
    private async Task GenerateAIReportAsync(int reportId, int employeeId, CreateDailyReportDto createDto, Elderly? elderly)
    {
        try
        {
            _logger.LogInformation($"Starting AI report generation for report {reportId}");

            // Create a new scope for the background task to avoid ObjectDisposedException
            using var scope = _serviceProvider.CreateScope();
            var geminiService = scope.ServiceProvider.GetRequiredService<IGeminiService>();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();
            var aiPredictionService = scope.ServiceProvider.GetRequiredService<IAiPredictionService>();
            var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();

            // 1. Parse vital and care metrics from the report
            int heartRate = ParseMetric(createDto, "Heart Rate", -1);
            if (heartRate == -1) heartRate = ParseMetric(createDto, "HeartRate", 75);

            int systolic = 120;
            int diastolic = 80;
            var bpMetric = createDto.HealthMetrics.FirstOrDefault(m => 
                m.MetricType.Contains("Blood Pressure", StringComparison.OrdinalIgnoreCase) || 
                m.MetricName.Contains("Blood Pressure", StringComparison.OrdinalIgnoreCase) || 
                m.MetricName.Contains("BP", StringComparison.OrdinalIgnoreCase));
            if (bpMetric != null)
            {
                var parts = bpMetric.MetricValue.Split('/');
                if (parts.Length == 2 && int.TryParse(parts[0], out int sys) && int.TryParse(parts[1], out int dia))
                {
                    systolic = sys;
                    diastolic = dia;
                }
            }

            int bloodSugar = ParseMetric(createDto, "Blood Sugar", -1);
            if (bloodSugar == -1) bloodSugar = ParseMetric(createDto, "BloodSugar", 100);

            int missedMeds = ParseMetric(createDto, "Missed Medications", -1);
            if (missedMeds == -1) missedMeds = ParseMetric(createDto, "MissedMedications", -1);
            if (missedMeds == -1) missedMeds = ParseMetric(createDto, "Missed Doses", 0);

            int mealsEatenVal = ParseMetric(createDto, "Meals Eaten", -1);
            if (mealsEatenVal == -1) mealsEatenVal = ParseMetric(createDto, "MealsEaten", -1);
            int mealsEatenPercent = 100;
            if (mealsEatenVal != -1)
            {
                mealsEatenPercent = mealsEatenVal > 5 ? mealsEatenVal : (mealsEatenVal switch
                {
                    0 => 0,
                    1 => 33,
                    2 => 66,
                    3 => 100,
                    _ => 100
                });
            }

            // 2. Call Custom Machine Learning Model (Python FastAPI)
            var healthRiskInput = new HealthRiskInputDto
            {
                ElderlyId = createDto.ElderlyId,
                Age = elderly != null ? DateTime.Today.Year - elderly.DateOfBirth.Year : 75,
                HeartRate = heartRate,
                SystolicBp = systolic,
                DiastolicBp = diastolic,
                BloodSugar = bloodSugar,
                BodyTemperature = ParseMetricAsDouble(createDto, "Temperature", 98.6),
                MobilityScore = ParseMetric(createDto, "Mobility", 5),
                SleepHours = ParseMetricAsDouble(createDto, "Sleep", 7.0),
                MissedMedications = missedMeds,
                MealsEatenPercent = mealsEatenPercent,
                MoodScore = ParseMetric(createDto, "Mood", 5)
            };

            var prediction = await aiPredictionService.PredictHealthRiskAsync(healthRiskInput);

            // 3. Save the ML warning and trigger notifications immediately
            string mlWarning = string.Empty;
            bool isHighRisk = false;

            if (prediction != null && prediction.RiskLevel == "High")
            {
                isHighRisk = true;
                mlWarning = $"🔴 URGENT AI WARNING: {prediction.Recommendation}\n\n";
            }

            // Update database with warning prefix or initial state immediately
            var report = await context.DailyReports.FindAsync(reportId);
            if (report != null)
            {
                report.AiGeneratedReport = mlWarning + "AI report generation in progress...";
                await context.SaveChangesAsync();
                _logger.LogInformation($"Initial risk status and warning saved for report {reportId}. RiskLevel: {prediction?.RiskLevel}");
            }

            // Send notifications if high risk
            if (isHighRisk)
            {
                var teamLeaders = await userManager.GetUsersInRoleAsync("TeamLeader");
                var admins = await userManager.GetUsersInRoleAsync("Admin");
                var recipients = teamLeaders.Concat(admins)
                    .Where(u => u.IsActive && !u.IsDeleted)
                    .GroupBy(u => u.Id)
                    .Select(g => g.First());

                foreach (var recipient in recipients)
                {
                    await notificationService.CreateNotificationAsync(new CreateNotificationDto
                    {
                        UserId = recipient.Id,
                        Title = "URGENT: High Risk Detected",
                        Message = $"AI detected high health risk for {elderly?.FirstName} {elderly?.LastName}. Immediate action required.",
                        NotificationType = NotificationType.HealthAlert.ToString(),
                        RelatedEntityId = reportId,
                        RelatedEntityType = "DailyReport"
                    });
                }
                _logger.LogInformation($"High-risk notifications sent for report {reportId}.");
            }

            // 4. Prepare and call Gemini AI for detailed report generation
            var aiRequest = new ReportGenerationRequest
            {
                EmployeeId = employeeId,
                ElderlyId = createDto.ElderlyId,
                ElderlyName = elderly != null ? $"{elderly.FirstName} {elderly.LastName}" : "Resident",
                ReportDate = createDto.ReportDate,
                HealthMetrics = createDto.HealthMetrics.Select(m => new HealthMetricInput
                {
                    MetricType = m.MetricType,
                    MetricName = m.MetricName,
                    MetricValue = m.MetricValue,
                    Unit = m.Unit,
                    Notes = m.Notes,
                    RecordedTime = m.RecordedTime
                }).ToList(),
                AdditionalNotes = createDto.AdditionalNotes
            };

            var aiResponse = await geminiService.GenerateDailyReportAsync(aiRequest);

            // 5. Update the report with final content
            report = await context.DailyReports.FindAsync(reportId);
            if (report != null)
            {
                if (aiResponse.Succeeded && !string.IsNullOrEmpty(aiResponse.Data))
                {
                    report.AiGeneratedReport = mlWarning + aiResponse.Data;
                    _logger.LogInformation($"AI report successfully generated and saved for report {reportId}");
                }
                else
                {
                    _logger.LogWarning($"AI report generation failed for report {reportId}, using fallback");
                    report.AiGeneratedReport = mlWarning + GenerateFallbackAITemplate(createDto, elderly);
                }

                await context.SaveChangesAsync();
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error in background AI generation for report {reportId}");

            // Fallback safety net
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                var report = await context.DailyReports.FindAsync(reportId);
                if (report != null && (string.IsNullOrEmpty(report.AiGeneratedReport) ||
                                       report.AiGeneratedReport.EndsWith("AI report generation in progress...")))
                {
                    // Keep any warning prefix if it was set
                    string existingPrefix = report.AiGeneratedReport.Contains("🔴 URGENT AI WARNING") 
                        ? report.AiGeneratedReport.Substring(0, report.AiGeneratedReport.IndexOf("AI report generation in progress..."))
                        : string.Empty;

                    report.AiGeneratedReport = existingPrefix + GenerateFallbackAITemplate(createDto, elderly);
                    await context.SaveChangesAsync();
                }
            }
            catch (Exception fallbackEx)
            {
                _logger.LogError(fallbackEx, $"Error setting fallback for report {reportId}");
            }
        }
    }

    private int ParseMetric(CreateDailyReportDto createDto, string metricType, int defaultValue)
    {
        var metric = createDto.HealthMetrics.FirstOrDefault(m => m.MetricType.Contains(metricType, StringComparison.OrdinalIgnoreCase) || m.MetricName.Contains(metricType, StringComparison.OrdinalIgnoreCase));
        if (metric != null && int.TryParse(metric.MetricValue, out int result))
        {
            return result;
        }
        return defaultValue;
    }

    private double ParseMetricAsDouble(CreateDailyReportDto createDto, string metricType, double defaultValue)
    {
        var metric = createDto.HealthMetrics.FirstOrDefault(m => m.MetricType.Contains(metricType, StringComparison.OrdinalIgnoreCase) || m.MetricName.Contains(metricType, StringComparison.OrdinalIgnoreCase));
        if (metric != null && double.TryParse(metric.MetricValue, out double result))
        {
            return result;
        }
        return defaultValue;
    }

    /// <summary>
    /// Generate a simple fallback template if AI is unavailable
    /// </summary>
    private string GenerateFallbackAITemplate(CreateDailyReportDto createDto, Elderly? elderly)
    {
        var sb = new StringBuilder();
        var elderlyName = elderly != null ? $"{elderly.FirstName} {elderly.LastName}" : "Resident";

        sb.AppendLine("DAILY CARE REPORT");
        sb.AppendLine("=================");
        sb.AppendLine();
        sb.AppendLine($"Resident: {elderlyName}");
        sb.AppendLine($"Date: {createDto.ReportDate:MMMM d, yyyy}");
        sb.AppendLine();
        sb.AppendLine("SUMMARY");
        sb.AppendLine("-------");

        var meals = createDto.HealthMetrics.Where(m => m.MetricType == "Meal").ToList();
        var medications = createDto.HealthMetrics.Where(m => m.MetricType == "Medication").ToList();
        var activities = createDto.HealthMetrics.Where(m => m.MetricType == "Activity").ToList();
        var mood = createDto.HealthMetrics.FirstOrDefault(m => m.MetricType == "Mood");

        if (mood != null)
        {
            sb.AppendLine($"Mood: {mood.MetricValue}");
        }

        if (meals.Any())
        {
            sb.AppendLine();
            sb.AppendLine("MEALS");
            foreach (var meal in meals)
            {
                sb.AppendLine($"- {meal.MetricName}: {meal.MetricValue} at {meal.RecordedTime:hh\\:mm}");
            }
        }

        if (medications.Any())
        {
            sb.AppendLine();
            sb.AppendLine("MEDICATIONS");
            foreach (var med in medications)
            {
                sb.AppendLine($"- {med.MetricName}: {med.MetricValue} at {med.RecordedTime:hh\\:mm}");
            }
        }

        if (activities.Any())
        {
            sb.AppendLine();
            sb.AppendLine("ACTIVITIES");
            foreach (var activity in activities)
            {
                sb.AppendLine($"- {activity.MetricName}: {activity.MetricValue} {activity.Unit} at {activity.RecordedTime:hh\\:mm}");
            }
        }

        if (!string.IsNullOrEmpty(createDto.AdditionalNotes))
        {
            sb.AppendLine();
            sb.AppendLine("ADDITIONAL NOTES");
            sb.AppendLine(createDto.AdditionalNotes);
        }

        sb.AppendLine();
        sb.AppendLine("Note: This is a system-generated template report.");

        return sb.ToString();
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

            // Get elderly for AI
            var elderly = await _context.Elderlies
                .FirstOrDefaultAsync(e => e.Id == updateDto.ElderlyId);

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

            // Reset AI generation status
            report.AiGeneratedReport = "AI report generation in progress...";

            // Add new health metrics
            foreach (var metricDto in updateDto.HealthMetrics)
            {
                var metric = _mapper.Map<HealthMetric>(metricDto);
                metric.DailyReportId = reportId;
                _context.HealthMetrics.Add(metric);
            }

            await _context.SaveChangesAsync();

            // Trigger AI generation again for updated data
            _ = Task.Run(async () => await GenerateAIReportAsync(reportId, employeeId, updateDto, elderly));

            // Reload the report
            var updatedReport = await _context.DailyReports
                .Include(r => r.Employee)
                .Include(r => r.Elderly)
                .Include(r => r.HealthMetrics)
                .FirstOrDefaultAsync(r => r.Id == reportId);

            var reportDto = _mapper.Map<DailyReportDto>(updatedReport);

            return new Response<DailyReportDto>(reportDto, "Daily report updated successfully, AI generation in progress");
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
                .Include(r => r.ApprovedBy)
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

            var egyptTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Egypt Standard Time");
            var egyptNow = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, egyptTimeZone);

            // Check if already clocked in today
            var today = egyptNow.Date;
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
                LoginTime = egyptNow,
                CreatedAt = egyptNow
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

            var egyptTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Egypt Standard Time");
            var egyptNow = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, egyptTimeZone);

            var today = egyptNow.Date;
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

            attendanceLog.LogoutTime = egyptNow;
            attendanceLog.UpdatedAt = egyptNow;

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

            var egyptTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Egypt Standard Time");
            var egyptNow = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, egyptTimeZone);
            var today = egyptNow.Date;
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