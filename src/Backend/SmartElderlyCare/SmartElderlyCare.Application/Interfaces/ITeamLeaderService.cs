using SmartElderlyCare.Application.DTOs.Common;
using SmartElderlyCare.Application.DTOs.DailyReport;
using SmartElderlyCare.Application.DTOs.Family;
using SmartElderlyCare.Application.DTOs.Schedule;
using SmartElderlyCare.Application.DTOs.TeamLeader;
using SmartElderlyCare.Application.DTOs.User;
using SmartElderlyCare.Application.DTOs.Visit;
using SmartElderlyCare.Application.Wrappers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
namespace SmartElderlyCare.Application.Interfaces;

/// <summary>
/// Service interface for team leader operations
/// </summary>
public interface ITeamLeaderService
{
    // Profile Management
    Task<Response<UserDto>> GetProfileAsync(int teamLeaderId);
    Task<Response<UserDto>> UpdateProfileAsync(int teamLeaderId, UpdateUserDto updateDto);

    // Report Approval Workflow
    Task<Response<PaginatedResponse<List<DailyReportDto>>>> GetPendingReportsAsync(ReportFilterParameters parameters);
    Task<Response<DailyReportDto>> GetReportDetailsAsync(int reportId);
    Task<Response<DailyReportDto>> ApproveReportAsync(int teamLeaderId, ApproveReportDto approveDto);
    Task<Response<DailyReportDto>> RejectReportAsync(int teamLeaderId, RejectReportDto rejectDto);
    Task<Response<ReportSummaryDto>> GetReportsSummaryAsync();
    Task<Response<List<ReportApprovalHistoryDto>>> GetApprovalHistoryAsync(DateTime? fromDate, DateTime? toDate);

    // Employee Performance Monitoring
    Task<Response<PaginatedResponse<List<UserDto>>>> GetEmployeesAsync(UserFilterParameters parameters);
    Task<Response<EmployeePerformanceDto>> GetEmployeePerformanceAsync(int employeeId, DateTime? fromDate, DateTime? toDate);
    Task<Response<List<EmployeePerformanceSummaryDto>>> GetAllEmployeesPerformanceAsync(DateTime? date);
    Task<Response<EmployeeDetailsDto>> GetEmployeeDetailsAsync(int employeeId);

    // Attendance Tracking
    Task<Response<PaginatedResponse<List<AttendanceLogDto>>>> GetAttendanceLogsAsync(
        int? employeeId, DateTime? date, PaginationParameters parameters);
    Task<Response<AttendanceSummaryDto>> GetAttendanceSummaryAsync(DateTime date);
    Task<Response<List<EmployeeAttendanceDto>>> GetCurrentAttendanceStatusAsync();

    // Schedule Management
    Task<Response<WorkScheduleDto>> CreateScheduleAsync(int teamLeaderId, CreateScheduleDto createDto);
    Task<Response<WorkScheduleDto>> UpdateScheduleAsync(int teamLeaderId, int scheduleId, CreateScheduleDto updateDto);
    Task<Response<bool>> DeleteScheduleAsync(int teamLeaderId, int scheduleId);
    Task<Response<List<WorkScheduleDto>>> GetSchedulesAsync(DateTime startDate, DateTime endDate, int? employeeId = null);
    Task<Response<ScheduleSummaryDto>> GetTodayScheduleSummaryAsync();


    // Visit Request Management
    Task<Response<PaginatedResponse<List<VisitRequestDto>>>> GetPendingVisitRequestsAsync(VisitFilterParameters parameters);
    Task<Response<VisitRequestDto>> GetVisitRequestDetailsAsync(int visitId);
    Task<Response<VisitRequestDto>> ApproveVisitRequestAsync(int teamLeaderId, ApproveVisitDto approveDto);
    Task<Response<VisitRequestDto>> RejectVisitRequestAsync(int teamLeaderId, RejectVisitDto rejectDto);
    Task<Response<VisitSummaryDto>> GetVisitRequestsSummaryAsync();
}