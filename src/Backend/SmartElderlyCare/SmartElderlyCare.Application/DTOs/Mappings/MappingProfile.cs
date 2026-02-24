using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AutoMapper;
using SmartElderlyCare.Application.DTOs.DailyReport;
using SmartElderlyCare.Application.DTOs.Elderly;
using SmartElderlyCare.Application.DTOs.Notification;
using SmartElderlyCare.Application.DTOs.Schedule;
using SmartElderlyCare.Application.DTOs.User;
using SmartElderlyCare.Application.DTOs.Visit;
using SmartElderlyCare.Domain.Entities;
using SmartElderlyCare.Domain.Enums;

namespace SmartElderlyCare.Application.Mappings;

/// <summary>
/// AutoMapper profile for entity to DTO mappings
/// </summary>
public class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateUserMappings();
        CreateElderlyMappings();
        CreateDailyReportMappings();
        CreateScheduleMappings();
        CreateVisitMappings();
        CreateNotificationMappings();
    }

    private void CreateUserMappings()
    {
        // User to UserDto
        CreateMap<User, UserDto>()
            .ForMember(dest => dest.UserType,
                opt => opt.MapFrom(src => src.UserType.ToString()))
            .ForMember(dest => dest.Roles,
                opt => opt.Ignore()); // Roles will be mapped separately

        // User to UserDetailDto
        CreateMap<User, UserDetailDto>()
            .IncludeBase<User, UserDto>();

        // CreateUserDto to User (for admin creation)
        CreateMap<CreateUserDto, User>()
            .ForMember(dest => dest.UserName,
                opt => opt.MapFrom(src => src.Email))
            .ForMember(dest => dest.UserType,
                opt => opt.MapFrom(src => Enum.Parse<UserType>(src.UserType)))
            .ForMember(dest => dest.CreatedAt,
                opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy,
                opt => opt.Ignore());

        // UpdateUserDto to User (partial update)
        CreateMap<UpdateUserDto, User>()
            .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));
    }

    private void CreateElderlyMappings()
    {
        // Elderly to ElderlyDto
        CreateMap<Elderly, ElderlyDto>();

        // Elderly to ElderlyDetailDto
        CreateMap<Elderly, ElderlyDetailDto>()
            .ForMember(dest => dest.AssignedEmployees,
                opt => opt.MapFrom(src => src.EmployeeAssignments))
            .ForMember(dest => dest.FamilyMembers,
                opt => opt.MapFrom(src => src.FamilyMembers))
            .ForMember(dest => dest.TotalReports,
                opt => opt.MapFrom(src => src.DailyReports.Count))
            .ForMember(dest => dest.LastReportDate,
                opt => opt.MapFrom(src => src.DailyReports
                    .OrderByDescending(r => r.ReportDate)
                    .Select(r => r.ReportDate)
                    .FirstOrDefault()));

        // EmployeeElderlyAssignment to EmployeeAssignmentDto
        CreateMap<EmployeeElderlyAssignment, EmployeeAssignmentDto>()
            .ForMember(dest => dest.EmployeeId,
                opt => opt.MapFrom(src => src.EmployeeId))
            .ForMember(dest => dest.EmployeeName,
                opt => opt.MapFrom(src => $"{src.Employee.FirstName} {src.Employee.LastName}"))
            .ForMember(dest => dest.EmployeeEmail,
                opt => opt.MapFrom(src => src.Employee.Email));

        // ElderlyFamilyMember to FamilyLinkDto
        CreateMap<ElderlyFamilyMember, FamilyLinkDto>()
            .ForMember(dest => dest.FamilyMemberId,
                opt => opt.MapFrom(src => src.FamilyMemberId))
            .ForMember(dest => dest.FamilyMemberName,
                opt => opt.MapFrom(src => $"{src.FamilyMember.FirstName} {src.FamilyMember.LastName}"));

        // CreateElderlyDto to Elderly
        CreateMap<CreateElderlyDto, Elderly>()
            .ForMember(dest => dest.IsActive,
                opt => opt.MapFrom(src => true))
            .ForMember(dest => dest.CreatedAt,
                opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy,
                opt => opt.Ignore());

        // UpdateElderlyDto to Elderly
        CreateMap<UpdateElderlyDto, Elderly>()
            .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));
    }

    private void CreateDailyReportMappings()
    {
        // HealthMetric to HealthMetricDto
        CreateMap<HealthMetric, HealthMetricDto>()
            .ForMember(dest => dest.MetricType,
                opt => opt.MapFrom(src => src.MetricType.ToString()));

        // CreateHealthMetricDto to HealthMetric
        CreateMap<CreateHealthMetricDto, HealthMetric>()
            .ForMember(dest => dest.MetricType,
                opt => opt.MapFrom(src => Enum.Parse<MetricType>(src.MetricType)));

        // DailyReport to DailyReportDto
        CreateMap<DailyReport, DailyReportDto>()
            .ForMember(dest => dest.EmployeeName,
                opt => opt.MapFrom(src => $"{src.Employee.FirstName} {src.Employee.LastName}"))
            .ForMember(dest => dest.ElderlyName,
                opt => opt.MapFrom(src => $"{src.Elderly.FirstName} {src.Elderly.LastName}"))
            .ForMember(dest => dest.ApprovalStatus,
                opt => opt.MapFrom(src => src.ApprovalStatus.ToString()))
            .ForMember(dest => dest.ApprovedByName,
                opt => opt.MapFrom(src => src.ApprovedBy != null
                    ? $"{src.ApprovedBy.FirstName} {src.ApprovedBy.LastName}"
                    : null));

        // DailyReport to DailyReportDetailDto
        CreateMap<DailyReport, DailyReportDetailDto>()
            .IncludeBase<DailyReport, DailyReportDto>();

        // CreateDailyReportDto to DailyReport
        CreateMap<CreateDailyReportDto, DailyReport>()
            .ForMember(dest => dest.SubmissionDate,
                opt => opt.MapFrom(src => DateTime.UtcNow))
            .ForMember(dest => dest.ApprovalStatus,
                opt => opt.MapFrom(src => ApprovalStatus.Pending))
            .ForMember(dest => dest.HealthMetrics,
                opt => opt.MapFrom(src => src.HealthMetrics))
            .ForMember(dest => dest.StructuredData,
                opt => opt.MapFrom(src => System.Text.Json.JsonSerializer.Serialize(src, (System.Text.Json.JsonSerializerOptions?)null)))
            .ForMember(dest => dest.AiGeneratedReport,
                opt => opt.Ignore()) // Will be set by AI service
            .ForMember(dest => dest.CreatedAt,
                opt => opt.Ignore());

        // Report to approval history
        CreateMap<DailyReport, ReportApprovalHistoryDto>()
            .ForMember(dest => dest.ReportDate,
                opt => opt.MapFrom(src => src.ReportDate.ToString("yyyy-MM-dd")))
            .ForMember(dest => dest.ElderlyName,
                opt => opt.MapFrom(src => $"{src.Elderly.FirstName} {src.Elderly.LastName}"))
            .ForMember(dest => dest.EmployeeName,
                opt => opt.MapFrom(src => $"{src.Employee.FirstName} {src.Employee.LastName}"))
            .ForMember(dest => dest.Status,
                opt => opt.MapFrom(src => src.ApprovalStatus.ToString()))
            .ForMember(dest => dest.ApprovedBy,
                opt => opt.MapFrom(src => src.ApprovedBy != null
                    ? $"{src.ApprovedBy.FirstName} {src.ApprovedBy.LastName}"
                    : null));
    }

    private void CreateScheduleMappings()
    {
        // WorkSchedule to WorkScheduleDto
        CreateMap<WorkSchedule, WorkScheduleDto>()
            .ForMember(dest => dest.EmployeeName,
                opt => opt.MapFrom(src => $"{src.Employee.FirstName} {src.Employee.LastName}"))
            .ForMember(dest => dest.ShiftType,
                opt => opt.MapFrom(src => src.ShiftType.ToString()));

        // CreateScheduleDto to WorkSchedule
        CreateMap<CreateScheduleDto, WorkSchedule>()
            .ForMember(dest => dest.CreatedAt,
                opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy,
                opt => opt.Ignore());

        // AttendanceLog to AttendanceLogDto
        CreateMap<AttendanceLog, AttendanceLogDto>()
            .ForMember(dest => dest.EmployeeName,
                opt => opt.MapFrom(src => $"{src.Employee.FirstName} {src.Employee.LastName}"));
    }

    private void CreateVisitMappings()
    {
        // VisitRequest to VisitRequestDto
        CreateMap<VisitRequest, VisitRequestDto>()
            .ForMember(dest => dest.FamilyMemberName,
                opt => opt.MapFrom(src => $"{src.FamilyMember.FirstName} {src.FamilyMember.LastName}"))
            .ForMember(dest => dest.ElderlyName,
                opt => opt.MapFrom(src => $"{src.Elderly.FirstName} {src.Elderly.LastName}"))
            .ForMember(dest => dest.Status,
                opt => opt.MapFrom(src => src.Status.ToString()))
            .ForMember(dest => dest.ApprovedByName,
                opt => opt.MapFrom(src => src.ApprovedBy != null
                    ? $"{src.ApprovedBy.FirstName} {src.ApprovedBy.LastName}"
                    : null));

        // CreateVisitRequestDto to VisitRequest
        CreateMap<CreateVisitRequestDto, VisitRequest>()
            .ForMember(dest => dest.Status,
                opt => opt.MapFrom(src => VisitStatus.Pending))
            .ForMember(dest => dest.CreatedAt,
                opt => opt.Ignore());

        // VisitRequest to VisitRequestDetailsDto
        CreateMap<VisitRequest, VisitRequestDetailsDto>()
            .IncludeBase<VisitRequest, VisitRequestDto>();

        CreateMap<VisitRequest, PastVisitDto>()
            .ForMember(dest => dest.VisitDate, opt => opt.MapFrom(src => src.RequestedDate))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()));
    }

    private void CreateNotificationMappings()
    {
        // Notification to NotificationDto
        CreateMap<Notification, NotificationDto>()
            .ForMember(dest => dest.NotificationType,
                opt => opt.MapFrom(src => src.NotificationType.ToString()));

        // CreateNotificationDto to Notification
        CreateMap<CreateNotificationDto, Notification>()
            .ForMember(dest => dest.IsRead,
                opt => opt.MapFrom(src => false))
            .ForMember(dest => dest.CreatedAt,
                opt => opt.Ignore());
    }
}