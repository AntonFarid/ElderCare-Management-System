using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using SmartElderlyCare.Application.DTOs.Common;
using SmartElderlyCare.Application.DTOs.DailyReport;
using SmartElderlyCare.Application.DTOs.Elderly;
using SmartElderlyCare.Application.DTOs.Schedule;
using SmartElderlyCare.Application.DTOs.User;
using SmartElderlyCare.Application.Wrappers;
using SmartElderlyCare.Application.DTOs.AI;

namespace SmartElderlyCare.Application.Interfaces;

/// <summary>
/// Service interface for employee operations
/// </summary>
public interface IEmployeeService
{
    // Profile Management
    Task<Response<UserDto>> GetProfileAsync(int employeeId);
    Task<Response<UserDto>> UpdateProfileAsync(int employeeId, UpdateUserDto updateDto);

    // Assigned Elderly
    Task<Response<List<ElderlyDto>>> GetAssignedElderlyAsync(int employeeId);
    Task<Response<ElderlyDetailDto>> GetElderlyDetailsAsync(int employeeId, int elderlyId);

    // Daily Reports
    Task<Response<DailyReportDto>> CreateDailyReportAsync(int employeeId, CreateDailyReportDto createDto);
    Task<Response<DailyReportDto>> UpdateDailyReportAsync(int employeeId, int reportId, CreateDailyReportDto updateDto);
    Task<Response<DailyReportDto>> GetDailyReportByIdAsync(int employeeId, int reportId);
    Task<Response<PaginatedResponse<List<DailyReportDto>>>> GetMyReportsAsync(
        int employeeId, ReportFilterParameters parameters);
    Task<Response<ReportSummaryDto>> GetReportsSummaryAsync(int employeeId);

    // Task Completion Tracking
    Task<Response<TaskSummaryDto>> GetTaskSummaryAsync(int employeeId, DateTime date);
    Task<Response<List<TaskItemDto>>> GetPendingTasksAsync(int employeeId);
    Task<Response<bool>> MarkTaskAsCompletedAsync(int employeeId, int reportId);

    // Work Schedule
    Task<Response<List<WorkScheduleDto>>> GetScheduleAsync(int employeeId, DateTime startDate, DateTime endDate);
    Task<Response<WorkScheduleDto>> GetTodayScheduleAsync(int employeeId);

    // Attendance
    Task<Response<AttendanceLogDto>> ClockInAsync(int employeeId);
    Task<Response<AttendanceLogDto>> ClockOutAsync(int employeeId);
    Task<Response<AttendanceLogDto>> GetCurrentAttendanceStatusAsync(int employeeId);

    // AI Dietary Recommendation
    Task<Response<DietRecommendationOutputDto>> GetDietRecommendationAsync(int employeeId, int elderlyId);
}