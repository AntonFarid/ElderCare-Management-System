using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartElderlyCare.Application.DTOs.Admin;
using SmartElderlyCare.Application.DTOs.Common;
using SmartElderlyCare.Application.DTOs.Elderly;
using SmartElderlyCare.Application.DTOs.User;
using SmartElderlyCare.Application.Interfaces;
using SmartElderlyCare.Application.Wrappers;

namespace SmartElderlyCare.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly IAdminService _adminService;
    private readonly ICurrentUserService _currentUserService;
    private readonly ILogger<AdminController> _logger;

    public AdminController(
        IAdminService adminService,
        ICurrentUserService currentUserService,
        ILogger<AdminController> logger)
    {
        _adminService = adminService;
        _currentUserService = currentUserService;
        _logger = logger;
    }

    /// <summary>
    /// Get the current admin's user ID from claims
    /// </summary>
    private int GetCurrentAdminId()
    {
        return _currentUserService.UserId ?? 0;
    }

    #region Profile Management

    /// <summary>
    /// Get admin profile
    /// </summary>
    [HttpGet("profile")]
    [ProducesResponseType(typeof(Response<UserDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetProfile()
    {
        var adminId = GetCurrentAdminId();
        var response = await _adminService.GetProfileAsync(adminId);
        return Ok(response);
    }

    /// <summary>
    /// Update admin profile
    /// </summary>
    [HttpPut("profile")]
    [ProducesResponseType(typeof(Response<UserDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Response<string>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateUserDto updateDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new Response<string>("Invalid request data"));
        }

        var adminId = GetCurrentAdminId();
        var response = await _adminService.UpdateProfileAsync(adminId, updateDto);
        return Ok(response);
    }

    #endregion

    #region User Management

    /// <summary>
    /// Get all users with pagination and filtering
    /// </summary>
    [HttpGet("users")]
    [ProducesResponseType(typeof(Response<PaginatedResponse<List<UserDto>>>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetAllUsers([FromQuery] UserFilterParameters parameters)
    {
        var response = await _adminService.GetAllUsersAsync(parameters);
        return Ok(response);
    }

    /// <summary>
    /// Get user by ID
    /// </summary>
    [HttpGet("users/{userId}")]
    [ProducesResponseType(typeof(Response<UserDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetUserById(int userId)
    {
        var response = await _adminService.GetUserByIdAsync(userId);
        return Ok(response);
    }

    /// <summary>
    /// Create a new user
    /// </summary>
    [HttpPost("users")]
    [ProducesResponseType(typeof(Response<UserDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(Response<string>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserDto createDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new Response<string>("Invalid request data"));
        }

        var response = await _adminService.CreateUserAsync(createDto);
        return StatusCode(StatusCodes.Status201Created, response);
    }

    /// <summary>
    /// Update an existing user
    /// </summary>
    [HttpPut("users/{userId}")]
    [ProducesResponseType(typeof(Response<UserDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Response<string>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateUser(int userId, [FromBody] UpdateUserDto updateDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new Response<string>("Invalid request data"));
        }

        var response = await _adminService.UpdateUserAsync(userId, updateDto);
        return Ok(response);
    }

    /// <summary>
    /// Delete a user (soft delete)
    /// </summary>
    [HttpDelete("users/{userId}")]
    [ProducesResponseType(typeof(Response<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> DeleteUser(int userId)
    {
        var response = await _adminService.DeleteUserAsync(userId);
        return Ok(response);
    }

    /// <summary>
    /// Activate a user
    /// </summary>
    [HttpPost("users/{userId}/activate")]
    [ProducesResponseType(typeof(Response<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ActivateUser(int userId)
    {
        var response = await _adminService.ActivateUserAsync(userId);
        return Ok(response);
    }

    /// <summary>
    /// Deactivate a user
    /// </summary>
    [HttpPost("users/{userId}/deactivate")]
    [ProducesResponseType(typeof(Response<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeactivateUser(int userId)
    {
        var response = await _adminService.DeactivateUserAsync(userId);
        return Ok(response);
    }

    #endregion

    #region Role Management

    /// <summary>
    /// Get all roles with user counts
    /// </summary>
    [HttpGet("roles")]
    [ProducesResponseType(typeof(Response<List<RoleDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetAllRoles()
    {
        var response = await _adminService.GetAllRolesAsync();
        return Ok(response);
    }

    /// <summary>
    /// Get roles for a specific user
    /// </summary>
    [HttpGet("users/{userId}/roles")]
    [ProducesResponseType(typeof(Response<List<string>>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetUserRoles(int userId)
    {
        var response = await _adminService.GetUserRolesAsync(userId);
        return Ok(response);
    }

    /// <summary>
    /// Assign roles to a user
    /// </summary>
    [HttpPost("users/{userId}/roles")]
    [ProducesResponseType(typeof(Response<UserDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Response<string>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AssignRoles(int userId, [FromBody] List<string> roles)
    {
        var response = await _adminService.AssignRolesAsync(userId, roles);
        return Ok(response);
    }

    /// <summary>
    /// Remove roles from a user
    /// </summary>
    [HttpDelete("users/{userId}/roles")]
    [ProducesResponseType(typeof(Response<UserDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Response<string>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoveRoles(int userId, [FromBody] List<string> roles)
    {
        var response = await _adminService.RemoveRolesAsync(userId, roles);
        return Ok(response);
    }

    #endregion

    #region Elderly Management

    /// <summary>
    /// Get all elderly residents with pagination and filtering
    /// </summary>
    [HttpGet("elderly")]
    [ProducesResponseType(typeof(Response<PaginatedResponse<List<ElderlyDto>>>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetAllElderly([FromQuery] ElderlyFilterParameters parameters)
    {
        var response = await _adminService.GetAllElderlyAsync(parameters);
        return Ok(response);
    }

    /// <summary>
    /// Get elderly by ID with details
    /// </summary>
    [HttpGet("elderly/{elderlyId}")]
    [ProducesResponseType(typeof(Response<ElderlyDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetElderlyById(int elderlyId)
    {
        var response = await _adminService.GetElderlyByIdAsync(elderlyId);
        return Ok(response);
    }

    /// <summary>
    /// Create a new elderly resident
    /// </summary>
    [HttpPost("elderly")]
    [ProducesResponseType(typeof(Response<ElderlyDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(Response<string>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> CreateElderly([FromBody] CreateElderlyDto createDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new Response<string>("Invalid request data"));
        }

        var response = await _adminService.CreateElderlyAsync(createDto);
        return StatusCode(StatusCodes.Status201Created, response);
    }

    /// <summary>
    /// Update an existing elderly resident
    /// </summary>
    [HttpPut("elderly/{elderlyId}")]
    [ProducesResponseType(typeof(Response<ElderlyDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Response<string>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateElderly(int elderlyId, [FromBody] UpdateElderlyDto updateDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new Response<string>("Invalid request data"));
        }

        var response = await _adminService.UpdateElderlyAsync(elderlyId, updateDto);
        return Ok(response);
    }

    /// <summary>
    /// Delete an elderly resident (soft delete)
    /// </summary>
    [HttpDelete("elderly/{elderlyId}")]
    [ProducesResponseType(typeof(Response<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> DeleteElderly(int elderlyId)
    {
        var response = await _adminService.DeleteElderlyAsync(elderlyId);
        return Ok(response);
    }

    /// <summary>
    /// Activate an elderly resident
    /// </summary>
    [HttpPost("elderly/{elderlyId}/activate")]
    [ProducesResponseType(typeof(Response<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ActivateElderly(int elderlyId)
    {
        var response = await _adminService.ActivateElderlyAsync(elderlyId);
        return Ok(response);
    }

    /// <summary>
    /// Deactivate an elderly resident
    /// </summary>
    [HttpPost("elderly/{elderlyId}/deactivate")]
    [ProducesResponseType(typeof(Response<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeactivateElderly(int elderlyId)
    {
        var response = await _adminService.DeactivateElderlyAsync(elderlyId);
        return Ok(response);
    }

    #endregion

    #region Employee-Elderly Assignments

    /// <summary>
    /// Get employee assignments
    /// </summary>
    [HttpGet("assignments/employee-elderly")]
    [ProducesResponseType(typeof(Response<List<EmployeeAssignmentDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetEmployeeAssignments([FromQuery] int? employeeId, [FromQuery] int? elderlyId)
    {
        var response = await _adminService.GetEmployeeAssignmentsAsync(employeeId, elderlyId);
        return Ok(response);
    }

    /// <summary>
    /// Assign employee to elderly
    /// </summary>
    [HttpPost("assignments/employee-elderly")]
    [ProducesResponseType(typeof(Response<EmployeeAssignmentDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(Response<string>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AssignEmployeeToElderly(
        [FromQuery] int employeeId,
        [FromQuery] int elderlyId,
        [FromQuery] bool isPrimary)
    {
        var response = await _adminService.AssignEmployeeToElderlyAsync(employeeId, elderlyId, isPrimary);
        return StatusCode(StatusCodes.Status201Created, response);
    }

    /// <summary>
    /// Remove employee assignment
    /// </summary>
    [HttpDelete("assignments/employee-elderly")]
    [ProducesResponseType(typeof(Response<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RemoveEmployeeAssignment([FromQuery] int employeeId, [FromQuery] int elderlyId)
    {
        var response = await _adminService.RemoveEmployeeAssignmentAsync(employeeId, elderlyId);
        return Ok(response);
    }

    /// <summary>
    /// Update primary assignment status
    /// </summary>
    [HttpPut("assignments/employee-elderly/primary")]
    [ProducesResponseType(typeof(Response<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdatePrimaryAssignment(
        [FromQuery] int employeeId,
        [FromQuery] int elderlyId,
        [FromQuery] bool isPrimary)
    {
        var response = await _adminService.UpdatePrimaryAssignmentAsync(employeeId, elderlyId, isPrimary);
        return Ok(response);
    }

    #endregion

    #region Elderly-Family Assignments

    /// <summary>
    /// Get family assignments
    /// </summary>
    [HttpGet("assignments/family")]
    [ProducesResponseType(typeof(Response<List<FamilyLinkDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetFamilyAssignments([FromQuery] int? elderlyId, [FromQuery] int? familyMemberId)
    {
        var response = await _adminService.GetFamilyAssignmentsAsync(elderlyId, familyMemberId);
        return Ok(response);
    }

    /// <summary>
    /// Assign family member to elderly
    /// </summary>
    [HttpPost("assignments/family")]
    [ProducesResponseType(typeof(Response<FamilyLinkDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(Response<string>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AssignFamilyToElderly(
        [FromQuery] int elderlyId,
        [FromQuery] int familyMemberId,
        [FromQuery] string relationship,
        [FromQuery] bool isPrimary)
    {
        var response = await _adminService.AssignFamilyToElderlyAsync(elderlyId, familyMemberId, relationship, isPrimary);
        return StatusCode(StatusCodes.Status201Created, response);
    }

    /// <summary>
    /// Remove family assignment
    /// </summary>
    [HttpDelete("assignments/family")]
    [ProducesResponseType(typeof(Response<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoveFamilyAssignment([FromQuery] int elderlyId, [FromQuery] int familyMemberId)
    {
        var response = await _adminService.RemoveFamilyAssignmentAsync(elderlyId, familyMemberId);
        return Ok(response);
    }

    /// <summary>
    /// Update family relationship
    /// </summary>
    [HttpPut("assignments/family")]
    [ProducesResponseType(typeof(Response<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateFamilyRelationship(
        [FromQuery] int elderlyId,
        [FromQuery] int familyMemberId,
        [FromQuery] string relationship,
        [FromQuery] bool isPrimary)
    {
        var response = await _adminService.UpdateFamilyRelationshipAsync(elderlyId, familyMemberId, relationship, isPrimary);
        return Ok(response);
    }

    #endregion

    #region System Monitoring

    /// <summary>
    /// Get system statistics
    /// </summary>
    [HttpGet("statistics")]
    [ProducesResponseType(typeof(Response<SystemStatisticsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetSystemStatistics()
    {
        var response = await _adminService.GetSystemStatisticsAsync();
        return Ok(response);
    }

    /// <summary>
    /// Get audit logs
    /// </summary>
    [HttpGet("audit-logs")]
    [ProducesResponseType(typeof(Response<List<AuditLogDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetAuditLogs(
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        [FromQuery] string? entityType,
        [FromQuery] int? entityId)
    {
        var response = await _adminService.GetAuditLogsAsync(fromDate, toDate, entityType, entityId);
        return Ok(response);
    }

    /// <summary>
    /// Get activity summary for a specific date
    /// </summary>
    [HttpGet("activity-summary")]
    [ProducesResponseType(typeof(Response<ActivitySummaryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetActivitySummary([FromQuery] DateTime? date)
    {
        var targetDate = date ?? DateTime.UtcNow.Date;
        var response = await _adminService.GetActivitySummaryAsync(targetDate);
        return Ok(response);
    }

    #endregion

    #region Dashboard

    /// <summary>
    /// Get admin dashboard data
    /// </summary>
    [HttpGet("dashboard")]
    [ProducesResponseType(typeof(Response<AdminDashboardDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetDashboardData()
    {
        var response = await _adminService.GetDashboardDataAsync();
        return Ok(response);
    }

    #endregion
}