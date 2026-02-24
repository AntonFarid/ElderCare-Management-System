using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using SmartElderlyCare.Application.DTOs.Common;
using SmartElderlyCare.Application.DTOs.Elderly;
using SmartElderlyCare.Application.DTOs.User;
using SmartElderlyCare.Application.DTOs.Admin;
using SmartElderlyCare.Application.Wrappers;

namespace SmartElderlyCare.Application.Interfaces;

/// <summary>
/// Service interface for admin operations
/// </summary>
public interface IAdminService
{
    // Profile Management
    Task<Response<UserDto>> GetProfileAsync(int adminId);
    Task<Response<UserDto>> UpdateProfileAsync(int adminId, UpdateUserDto updateDto);

    // User Management (Employees, TeamLeaders, FamilyMembers)
    Task<Response<PaginatedResponse<List<UserDto>>>> GetAllUsersAsync(UserFilterParameters parameters);
    Task<Response<UserDto>> GetUserByIdAsync(int userId);
    Task<Response<UserDto>> CreateUserAsync(CreateUserDto createDto);
    Task<Response<UserDto>> UpdateUserAsync(int userId, UpdateUserDto updateDto);
    Task<Response<bool>> DeleteUserAsync(int userId); // Soft delete
    Task<Response<bool>> ActivateUserAsync(int userId);
    Task<Response<bool>> DeactivateUserAsync(int userId);

    // Role Management
    Task<Response<List<RoleDto>>> GetAllRolesAsync();
    Task<Response<UserDto>> AssignRolesAsync(int userId, List<string> roles);
    Task<Response<UserDto>> RemoveRolesAsync(int userId, List<string> roles);
    Task<Response<List<string>>> GetUserRolesAsync(int userId);

    // Elderly Management
    Task<Response<PaginatedResponse<List<ElderlyDto>>>> GetAllElderlyAsync(ElderlyFilterParameters parameters);
    Task<Response<ElderlyDetailDto>> GetElderlyByIdAsync(int elderlyId);
    Task<Response<ElderlyDto>> CreateElderlyAsync(CreateElderlyDto createDto);
    Task<Response<ElderlyDto>> UpdateElderlyAsync(int elderlyId, UpdateElderlyDto updateDto);
    Task<Response<bool>> DeleteElderlyAsync(int elderlyId); // Soft delete
    Task<Response<bool>> ActivateElderlyAsync(int elderlyId);
    Task<Response<bool>> DeactivateElderlyAsync(int elderlyId);

    // Employee-Elderly Assignments
    Task<Response<List<EmployeeAssignmentDto>>> GetEmployeeAssignmentsAsync(int? employeeId, int? elderlyId);
    Task<Response<EmployeeAssignmentDto>> AssignEmployeeToElderlyAsync(int employeeId, int elderlyId, bool isPrimary);
    Task<Response<bool>> RemoveEmployeeAssignmentAsync(int employeeId, int elderlyId);
    Task<Response<bool>> UpdatePrimaryAssignmentAsync(int employeeId, int elderlyId, bool isPrimary);

    // Elderly-Family Assignments
    Task<Response<List<FamilyLinkDto>>> GetFamilyAssignmentsAsync(int? elderlyId, int? familyMemberId);
    Task<Response<FamilyLinkDto>> AssignFamilyToElderlyAsync(int elderlyId, int familyMemberId, string relationship, bool isPrimary);
    Task<Response<bool>> RemoveFamilyAssignmentAsync(int elderlyId, int familyMemberId);
    Task<Response<bool>> UpdateFamilyRelationshipAsync(int elderlyId, int familyMemberId, string relationship, bool isPrimary);

    // System Monitoring
    Task<Response<SystemStatisticsDto>> GetSystemStatisticsAsync();
    Task<Response<List<AuditLogDto>>> GetAuditLogsAsync(DateTime? fromDate, DateTime? toDate, string? entityType, int? entityId);
    Task<Response<ActivitySummaryDto>> GetActivitySummaryAsync(DateTime date);

    // Dashboard
    Task<Response<AdminDashboardDto>> GetDashboardDataAsync();
}