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
using SmartElderlyCare.Application.DTOs.Admin;
using SmartElderlyCare.Application.DTOs.Common;
using SmartElderlyCare.Application.DTOs.Elderly;
using SmartElderlyCare.Application.DTOs.User;
using SmartElderlyCare.Application.DTOs.Visit;
using SmartElderlyCare.Application.Interfaces;
using SmartElderlyCare.Application.Wrappers;
using SmartElderlyCare.Domain.Entities;
using SmartElderlyCare.Domain.Enums;
using SmartElderlyCare.Domain.Interfaces;
using SmartElderlyCare.Infrastructure.Data.Context;
using System.Text.Json;

namespace SmartElderlyCare.Infrastructure.Services;

/// <summary>
/// Admin service implementation with full CRUD operations
/// </summary>
public class AdminService : IAdminService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly ILogger<AdminService> _logger;
    private readonly UserManager<User> _userManager;
    private readonly RoleManager<Role> _roleManager;
    private readonly ApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public AdminService(
        IUnitOfWork unitOfWork,
        IMapper mapper,
        ILogger<AdminService> logger,
        UserManager<User> userManager,
        RoleManager<Role> roleManager,
        ApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _logger = logger;
        _userManager = userManager;
        _roleManager = roleManager;
        _context = context;
        _currentUserService = currentUserService;
    }

    #region Profile Management

    /// <summary>
    /// Get admin profile
    /// </summary>
    public async Task<Response<UserDto>> GetProfileAsync(int adminId)
    {
        try
        {
            _logger.LogInformation($"Getting profile for admin ID: {adminId}");

            var user = await _userManager.FindByIdAsync(adminId.ToString());
            if (user == null)
            {
                throw new NotFoundException($"Admin with ID {adminId} not found");
            }

            if (user.UserType != UserType.Admin)
            {
                throw new ForbiddenException("User is not an admin");
            }

            var userDto = _mapper.Map<UserDto>(user);
            var roles = await _userManager.GetRolesAsync(user);
            userDto.Roles = roles.ToList();

            return new Response<UserDto>(userDto, "Profile retrieved successfully");
        }
        catch (Exception ex) when (ex is not NotFoundException && ex is not ForbiddenException)
        {
            _logger.LogError(ex, $"Error getting profile for admin {adminId}");
            throw;
        }
    }

    /// <summary>
    /// Update admin profile
    /// </summary>
    public async Task<Response<UserDto>> UpdateProfileAsync(int adminId, UpdateUserDto updateDto)
    {
        try
        {
            _logger.LogInformation($"Updating profile for admin ID: {adminId}");

            var user = await _userManager.FindByIdAsync(adminId.ToString());
            if (user == null)
            {
                throw new NotFoundException($"Admin with ID {adminId} not found");
            }

            // Capture old values for audit
            var oldValues = JsonSerializer.Serialize(new
            {
                user.FirstName,
                user.LastName,
                user.PhoneNumber
            });

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

            // Create audit log
            await CreateAuditLogAsync(
                adminId,
                "Update",
                nameof(User),
                adminId,
                oldValues,
                JsonSerializer.Serialize(new { user.FirstName, user.LastName, user.PhoneNumber }),
                _currentUserService.UserId?.ToString() ?? "System"
            );

            var userDto = _mapper.Map<UserDto>(user);
            var roles = await _userManager.GetRolesAsync(user);
            userDto.Roles = roles.ToList();

            return new Response<UserDto>(userDto, "Profile updated successfully");
        }
        catch (Exception ex) when (ex is not NotFoundException && ex is not ValidationException)
        {
            _logger.LogError(ex, $"Error updating profile for admin {adminId}");
            throw;
        }
    }

    #endregion

    #region User Management

    /// <summary>
    /// Get all users with pagination and filtering
    /// </summary>
    public async Task<Response<PaginatedResponse<List<UserDto>>>> GetAllUsersAsync(UserFilterParameters parameters)
    {
        try
        {
            _logger.LogInformation("Getting all users with filters");

            var query = _context.Users
                .Where(u => !u.IsDeleted)
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

            if (!string.IsNullOrEmpty(parameters.UserType) &&
                Enum.TryParse<UserType>(parameters.UserType, true, out var userType))
            {
                query = query.Where(u => u.UserType == userType);
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
                "usertype" => parameters.SortDescending
                    ? query.OrderByDescending(u => u.UserType)
                    : query.OrderBy(u => u.UserType),
                "lastlogin" => parameters.SortDescending
                    ? query.OrderByDescending(u => u.LastLoginAt)
                    : query.OrderBy(u => u.LastLoginAt),
                "createdat" => parameters.SortDescending
                    ? query.OrderByDescending(u => u.CreatedAt)
                    : query.OrderBy(u => u.CreatedAt),
                _ => query.OrderByDescending(u => u.CreatedAt)
            };

            var totalCount = await query.CountAsync();

            var users = await query
                .Skip((parameters.PageNumber - 1) * parameters.PageSize)
                .Take(parameters.PageSize)
                .ToListAsync();

            var userDtos = _mapper.Map<List<UserDto>>(users);

            // Get roles for each user
            foreach (var dto in userDtos)
            {
                var user = users.First(u => u.Id == dto.Id);
                dto.Roles = (await _userManager.GetRolesAsync(user)).ToList();
            }

            var paginatedResponse = new PaginatedResponse<List<UserDto>>(
                userDtos, parameters.PageNumber, parameters.PageSize, totalCount);

            return new Response<PaginatedResponse<List<UserDto>>> (
                paginatedResponse, "Users retrieved successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting users");
            throw;
        }
    }

    /// <summary>
    /// Get user by ID
    /// </summary>
    public async Task<Response<UserDto>> GetUserByIdAsync(int userId)
    {
        try
        {
            _logger.LogInformation($"Getting user by ID: {userId}");

            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null)
            {
                throw new NotFoundException($"User with ID {userId} not found");
            }

            var userDto = _mapper.Map<UserDto>(user);
            var roles = await _userManager.GetRolesAsync(user);
            userDto.Roles = roles.ToList();

            return new Response<UserDto>(userDto, "User retrieved successfully");
        }
        catch (Exception ex) when (ex is not NotFoundException)
        {
            _logger.LogError(ex, $"Error getting user {userId}");
            throw;
        }
    }

    /// <summary>
    /// Create a new user
    /// </summary>
    public async Task<Response<UserDto>> CreateUserAsync(CreateUserDto createDto)
    {
        try
        {
            _logger.LogInformation($"Creating new user with email: {createDto.Email}");

            // Check if email already exists (including soft-deleted users)
            var emailExists = await _userManager.Users.IgnoreQueryFilters()
                                                .AnyAsync(u => u.Email == createDto.Email);
            if (emailExists)
            {
                throw new ValidationException("Email already registered", new Dictionary<string, string[]>
                {
                    { "Email", new[] { "This email is already registered" } }
                });
            }

            // Parse user type
            if (!Enum.TryParse<UserType>(createDto.UserType, true, out var userType))
            {
                throw new ValidationException("Invalid user type", new Dictionary<string, string[]>
                {
                    { "UserType", new[] { "Valid values: Admin, TeamLeader, Employee, FamilyMember" } }
                });
            }

            // Create user
            var user = new User
            {
                UserName = createDto.Email,
                Email = createDto.Email,
                FirstName = createDto.FirstName,
                LastName = createDto.LastName,
                PhoneNumber = createDto.PhoneNumber,
                UserType = userType,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = _currentUserService.UserId?.ToString() ?? "System"
            };

            var result = await _userManager.CreateAsync(user, createDto.Password);
            if (!result.Succeeded)
            {
                var errors = result.Errors.ToDictionary(
                    e => e.Code,
                    e => new[] { e.Description }
                );
                throw new ValidationException("User creation failed", errors);
            }

            // Assign roles
            if (createDto.Roles != null && createDto.Roles.Any())
            {
                await _userManager.AddToRolesAsync(user, createDto.Roles);
            }
            else
            {
                // Assign default role based on user type
                var defaultRole = userType switch
                {
                    UserType.Admin => "Admin",
                    UserType.TeamLeader => "TeamLeader",
                    UserType.Employee => "Employee",
                    UserType.FamilyMember => "FamilyMember",
                    _ => "Employee"
                };
                await _userManager.AddToRoleAsync(user, defaultRole);
            }

            // Create audit log
            await CreateAuditLogAsync(
                user.Id,
                "Create",
                nameof(User),
                user.Id,
                null,
                JsonSerializer.Serialize(new { user.Email, user.UserType, user.FirstName, user.LastName }),
                _currentUserService.UserId?.ToString() ?? "System"
            );

            _logger.LogInformation($"User created successfully: {createDto.Email}");

            var userDto = _mapper.Map<UserDto>(user);
            userDto.Roles = (await _userManager.GetRolesAsync(user)).ToList();

            return new Response<UserDto>(userDto, "User created successfully");
        }
        catch (Exception ex) when (ex is not ValidationException)
        {
            _logger.LogError(ex, $"Error creating user {createDto.Email}");
            throw;
        }
    }

    /// <summary>
    /// Update an existing user
    /// </summary>
    public async Task<Response<UserDto>> UpdateUserAsync(int userId, UpdateUserDto updateDto)
    {
        try
        {
            _logger.LogInformation($"Updating user ID: {userId}");

            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null)
            {
                throw new NotFoundException($"User with ID {userId} not found");
            }

            // Capture old values for audit
            var oldValues = JsonSerializer.Serialize(new
            {
                user.FirstName,
                user.LastName,
                user.PhoneNumber,
                user.IsActive
            });

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
                throw new ValidationException("User update failed", errors);
            }

            // Update roles if provided
            if (updateDto.Roles != null)
            {
                var currentRoles = await _userManager.GetRolesAsync(user);
                await _userManager.RemoveFromRolesAsync(user, currentRoles);
                await _userManager.AddToRolesAsync(user, updateDto.Roles);
            }

            // Create audit log
            await CreateAuditLogAsync(
                userId,
                "Update",
                nameof(User),
                userId,
                oldValues,
                JsonSerializer.Serialize(new { user.FirstName, user.LastName, user.PhoneNumber, user.IsActive }),
                _currentUserService.UserId?.ToString() ?? "System"
            );

            var userDto = _mapper.Map<UserDto>(user);
            userDto.Roles = (await _userManager.GetRolesAsync(user)).ToList();

            return new Response<UserDto>(userDto, "User updated successfully");
        }
        catch (Exception ex) when (ex is not NotFoundException && ex is not ValidationException)
        {
            _logger.LogError(ex, $"Error updating user {userId}");
            throw;
        }
    }

    /// <summary>
    /// Soft delete a user
    /// </summary>
    public async Task<Response<bool>> DeleteUserAsync(int userId)
    {
        try
        {
            _logger.LogInformation($"Soft deleting user ID: {userId}");

            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null)
            {
                throw new NotFoundException($"User with ID {userId} not found");
            }

            // Check if this is the last admin
            if (user.UserType == UserType.Admin)
            {
                var adminCount = await _context.Users
                    .CountAsync(u => u.UserType == UserType.Admin && !u.IsDeleted);

                if (adminCount <= 1)
                {
                    throw new BusinessRuleException("Cannot delete the last admin user");
                }
            }

            // Soft delete
            user.IsDeleted = true;
            user.DeletedAt = DateTime.UtcNow;
            user.UpdatedAt = DateTime.UtcNow;
            user.UpdatedBy = _currentUserService.UserId?.ToString() ?? "System";
            
            // Free up the email and username for future registrations
            var ticks = DateTime.UtcNow.Ticks;
            user.Email = $"{user.Email}_deleted_{ticks}";
            user.UserName = user.Email;

            await _userManager.UpdateAsync(user);

            // Create audit log
            await CreateAuditLogAsync(
                userId,
                "Delete",
                nameof(User),
                userId,
                null,
                JsonSerializer.Serialize(new { Deleted = true, DeletedAt = DateTime.UtcNow }),
                _currentUserService.UserId?.ToString() ?? "System"
            );

            return new Response<bool>(true, "User deleted successfully");
        }
        catch (Exception ex) when (ex is not NotFoundException && ex is not BusinessRuleException)
        {
            _logger.LogError(ex, $"Error deleting user {userId}");
            throw;
        }
    }

    /// <summary>
    /// Activate a user
    /// </summary>
    public async Task<Response<bool>> ActivateUserAsync(int userId)
    {
        try
        {
            _logger.LogInformation($"Activating user ID: {userId}");

            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null)
            {
                throw new NotFoundException($"User with ID {userId} not found");
            }

            if (user.IsDeleted)
            {
                throw new BusinessRuleException("Cannot activate a deleted user");
            }

            user.IsActive = true;
            user.UpdatedAt = DateTime.UtcNow;
            user.UpdatedBy = _currentUserService.UserId?.ToString() ?? "System";

            await _userManager.UpdateAsync(user);

            // Create audit log
            await CreateAuditLogAsync(
                userId,
                "Activate",
                nameof(User),
                userId,
                null,
                JsonSerializer.Serialize(new { IsActive = true }),
                _currentUserService.UserId?.ToString() ?? "System"
            );

            return new Response<bool>(true, "User activated successfully");
        }
        catch (Exception ex) when (ex is not NotFoundException && ex is not BusinessRuleException)
        {
            _logger.LogError(ex, $"Error activating user {userId}");
            throw;
        }
    }

    /// <summary>
    /// Deactivate a user
    /// </summary>
    public async Task<Response<bool>> DeactivateUserAsync(int userId)
    {
        try
        {
            _logger.LogInformation($"Deactivating user ID: {userId}");

            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null)
            {
                throw new NotFoundException($"User with ID {userId} not found");
            }

            // Check if this is the last admin
            if (user.UserType == UserType.Admin)
            {
                var activeAdmins = await _context.Users
                    .CountAsync(u => u.UserType == UserType.Admin && u.IsActive && !u.IsDeleted);

                if (activeAdmins <= 1)
                {
                    throw new BusinessRuleException("Cannot deactivate the last active admin");
                }
            }

            user.IsActive = false;
            user.UpdatedAt = DateTime.UtcNow;
            user.UpdatedBy = _currentUserService.UserId?.ToString() ?? "System";

            await _userManager.UpdateAsync(user);

            // Create audit log
            await CreateAuditLogAsync(
                userId,
                "Deactivate",
                nameof(User),
                userId,
                null,
                JsonSerializer.Serialize(new { IsActive = false }),
                _currentUserService.UserId?.ToString() ?? "System"
            );

            return new Response<bool>(true, "User deactivated successfully");
        }
        catch (Exception ex) when (ex is not NotFoundException && ex is not BusinessRuleException)
        {
            _logger.LogError(ex, $"Error deactivating user {userId}");
            throw;
        }
    }

    #endregion

    #region Role Management

    /// <summary>
    /// Get all roles with user counts
    /// </summary>
    public async Task<Response<List<RoleDto>>> GetAllRolesAsync()
    {
        try
        {
            _logger.LogInformation("Getting all roles");

            var roles = await _roleManager.Roles.ToListAsync();
            var roleDtos = new List<RoleDto>();

            foreach (var role in roles)
            {
                var userCount = await _context.UserRoles
                    .CountAsync(ur => ur.RoleId == role.Id);

                roleDtos.Add(new RoleDto
                {
                    Id = role.Id.ToString(),
                    Name = role.Name ?? string.Empty,
                    Description = role.Description,
                    UserCount = userCount
                });
            }

            return new Response<List<RoleDto>>(roleDtos, "Roles retrieved successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting roles");
            throw;
        }
    }

    /// <summary>
    /// Assign roles to a user
    /// </summary>
    public async Task<Response<UserDto>> AssignRolesAsync(int userId, List<string> roles)
    {
        try
        {
            _logger.LogInformation($"Assigning roles to user {userId}");

            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null)
            {
                throw new NotFoundException($"User with ID {userId} not found");
            }

            var currentRoles = await _userManager.GetRolesAsync(user);
            var rolesToAdd = roles.Except(currentRoles).ToList();

            if (rolesToAdd.Any())
            {
                var result = await _userManager.AddToRolesAsync(user, rolesToAdd);
                if (!result.Succeeded)
                {
                    var errors = result.Errors.ToDictionary(
                        e => e.Code,
                        e => new[] { e.Description }
                    );
                    throw new ValidationException("Role assignment failed", errors);
                }
            }

            // Create audit log
            await CreateAuditLogAsync(
                userId,
                "AssignRoles",
                nameof(User),
                userId,
                JsonSerializer.Serialize(new { CurrentRoles = currentRoles }),
                JsonSerializer.Serialize(new { NewRoles = roles }),
                _currentUserService.UserId?.ToString() ?? "System"
            );

            var userDto = _mapper.Map<UserDto>(user);
            userDto.Roles = (await _userManager.GetRolesAsync(user)).ToList();

            return new Response<UserDto>(userDto, "Roles assigned successfully");
        }
        catch (Exception ex) when (ex is not NotFoundException && ex is not ValidationException)
        {
            _logger.LogError(ex, $"Error assigning roles to user {userId}");
            throw;
        }
    }

    /// <summary>
    /// Remove roles from a user
    /// </summary>
    public async Task<Response<UserDto>> RemoveRolesAsync(int userId, List<string> roles)
    {
        try
        {
            _logger.LogInformation($"Removing roles from user {userId}");

            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null)
            {
                throw new NotFoundException($"User with ID {userId} not found");
            }

            var result = await _userManager.RemoveFromRolesAsync(user, roles);
            if (!result.Succeeded)
            {
                var errors = result.Errors.ToDictionary(
                    e => e.Code,
                    e => new[] { e.Description }
                );
                throw new ValidationException("Role removal failed", errors);
            }

            // Create audit log
            await CreateAuditLogAsync(
                userId,
                "RemoveRoles",
                nameof(User),
                userId,
                null,
                JsonSerializer.Serialize(new { RemovedRoles = roles }),
                _currentUserService.UserId?.ToString() ?? "System"
            );

            var userDto = _mapper.Map<UserDto>(user);
            userDto.Roles = (await _userManager.GetRolesAsync(user)).ToList();

            return new Response<UserDto>(userDto, "Roles removed successfully");
        }
        catch (Exception ex) when (ex is not NotFoundException && ex is not ValidationException)
        {
            _logger.LogError(ex, $"Error removing roles from user {userId}");
            throw;
        }
    }

    /// <summary>
    /// Get user roles
    /// </summary>
    public async Task<Response<List<string>>> GetUserRolesAsync(int userId)
    {
        try
        {
            _logger.LogInformation($"Getting roles for user {userId}");

            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null)
            {
                throw new NotFoundException($"User with ID {userId} not found");
            }

            var roles = await _userManager.GetRolesAsync(user);
            return new Response<List<string>>(roles.ToList(), "User roles retrieved successfully");
        }
        catch (Exception ex) when (ex is not NotFoundException)
        {
            _logger.LogError(ex, $"Error getting roles for user {userId}");
            throw;
        }
    }

    #endregion

    #region Elderly Management

    /// <summary>
    /// Get all elderly with pagination and filtering
    /// </summary>
    public async Task<Response<PaginatedResponse<List<ElderlyDto>>>> GetAllElderlyAsync(ElderlyFilterParameters parameters)
    {
        try
        {
            _logger.LogInformation("Getting all elderly with filters");

            var query = _context.Elderlies
                .Include(e => e.EmployeeAssignments)
                .Include(e => e.FamilyMembers)
                .Where(e => !e.IsDeleted)
                .AsQueryable();

            // Apply filters
            if (!string.IsNullOrEmpty(parameters.SearchTerm))
            {
                var search = parameters.SearchTerm.ToLower();
                query = query.Where(e =>
                    e.FirstName.ToLower().Contains(search) ||
                    e.LastName.ToLower().Contains(search) ||
                    e.RoomNumber.ToLower().Contains(search));
            }

            if (parameters.IsActive.HasValue)
            {
                query = query.Where(e => e.IsActive == parameters.IsActive.Value);
            }

            if (parameters.AssignedEmployeeId.HasValue)
            {
                query = query.Where(e => e.EmployeeAssignments
                    .Any(a => a.EmployeeId == parameters.AssignedEmployeeId.Value));
            }

            if (!string.IsNullOrEmpty(parameters.RoomNumber))
            {
                query = query.Where(e => e.RoomNumber == parameters.RoomNumber);
            }

            // Apply sorting
            query = parameters.SortBy?.ToLower() switch
            {
                "firstname" => parameters.SortDescending
                    ? query.OrderByDescending(e => e.FirstName)
                    : query.OrderBy(e => e.FirstName),
                "lastname" => parameters.SortDescending
                    ? query.OrderByDescending(e => e.LastName)
                    : query.OrderBy(e => e.LastName),
                "roomnumber" => parameters.SortDescending
                    ? query.OrderByDescending(e => e.RoomNumber)
                    : query.OrderBy(e => e.RoomNumber),
                "age" => parameters.SortDescending
                    ? query.OrderByDescending(e => e.DateOfBirth)
                    : query.OrderBy(e => e.DateOfBirth),
                _ => query.OrderBy(e => e.LastName).ThenBy(e => e.FirstName)
            };

            var totalCount = await query.CountAsync();

            var elderly = await query
                .Skip((parameters.PageNumber - 1) * parameters.PageSize)
                .Take(parameters.PageSize)
                .ToListAsync();

            var elderlyDtos = _mapper.Map<List<ElderlyDto>>(elderly);

            var paginatedResponse = new PaginatedResponse<List<ElderlyDto>>(
                elderlyDtos, parameters.PageNumber, parameters.PageSize, totalCount);

            return new Response<PaginatedResponse<List<ElderlyDto>>> (
                paginatedResponse, "Elderly retrieved successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting elderly");
            throw;
        }
    }

    /// <summary>
    /// Get elderly by ID with details
    /// </summary>
    public async Task<Response<ElderlyDetailDto>> GetElderlyByIdAsync(int elderlyId)
    {
        try
        {
            _logger.LogInformation($"Getting elderly by ID: {elderlyId}");

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
            return new Response<ElderlyDetailDto>(elderlyDto, "Elderly retrieved successfully");
        }
        catch (Exception ex) when (ex is not NotFoundException)
        {
            _logger.LogError(ex, $"Error getting elderly {elderlyId}");
            throw;
        }
    }

    /// <summary>
    /// Create a new elderly resident
    /// </summary>
    public async Task<Response<ElderlyDto>> CreateElderlyAsync(CreateElderlyDto createDto)
    {
        try
        {
            _logger.LogInformation($"Creating new elderly: {createDto.FirstName} {createDto.LastName}");

            var elderly = _mapper.Map<Elderly>(createDto);
            elderly.IsActive = true;
            elderly.CreatedAt = DateTime.UtcNow;
            elderly.CreatedBy = _currentUserService.UserId?.ToString() ?? "System";

            await _unitOfWork.Repository<Elderly>().AddAsync(elderly);
            await _unitOfWork.CompleteAsync();

            // Assign initial employees if provided
            if (createDto.AssignedEmployeeIds != null && createDto.AssignedEmployeeIds.Any())
            {
                foreach (var employeeId in createDto.AssignedEmployeeIds)
                {
                    var assignment = new EmployeeElderlyAssignment
                    {
                        EmployeeId = employeeId,
                        ElderlyId = elderly.Id,
                        AssignedDate = DateTime.UtcNow,
                        IsPrimary = false,
                        CreatedAt = DateTime.UtcNow
                    };
                    await _unitOfWork.Repository<EmployeeElderlyAssignment>().AddAsync(assignment);
                }
                await _unitOfWork.CompleteAsync();
            }

            // Create audit log
            await CreateAuditLogAsync(
                null,
                "Create",
                nameof(Elderly),
                elderly.Id,
                null,
                JsonSerializer.Serialize(new { elderly.FirstName, elderly.LastName, elderly.RoomNumber }),
                _currentUserService.UserId?.ToString() ?? "System"
            );

            var elderlyDto = _mapper.Map<ElderlyDto>(elderly);
            return new Response<ElderlyDto>(elderlyDto, "Elderly created successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating elderly");
            throw;
        }
    }

    /// <summary>
    /// Update an existing elderly resident
    /// </summary>
    public async Task<Response<ElderlyDto>> UpdateElderlyAsync(int elderlyId, UpdateElderlyDto updateDto)
    {
        try
        {
            _logger.LogInformation($"Updating elderly ID: {elderlyId}");

            var elderly = await _context.Elderlies
                .FirstOrDefaultAsync(e => e.Id == elderlyId && !e.IsDeleted);

            if (elderly == null)
            {
                throw new NotFoundException($"Elderly with ID {elderlyId} not found");
            }

            // Capture old values for audit
            var oldValues = JsonSerializer.Serialize(new
            {
                elderly.FirstName,
                elderly.LastName,
                elderly.RoomNumber,
                elderly.MedicalConditions,
                elderly.IsActive
            });

            _mapper.Map(updateDto, elderly);
            elderly.UpdatedAt = DateTime.UtcNow;
            elderly.UpdatedBy = _currentUserService.UserId?.ToString() ?? "System";

            await _unitOfWork.Repository<Elderly>().UpdateAsync(elderly);
            await _unitOfWork.CompleteAsync();

            // Create audit log
            await CreateAuditLogAsync(
                null,
                "Update",
                nameof(Elderly),
                elderlyId,
                oldValues,
                JsonSerializer.Serialize(new
                {
                    elderly.FirstName,
                    elderly.LastName,
                    elderly.RoomNumber,
                    elderly.MedicalConditions,
                    elderly.IsActive
                }),
                _currentUserService.UserId?.ToString() ?? "System"
            );

            var elderlyDto = _mapper.Map<ElderlyDto>(elderly);
            return new Response<ElderlyDto>(elderlyDto, "Elderly updated successfully");
        }
        catch (Exception ex) when (ex is not NotFoundException)
        {
            _logger.LogError(ex, $"Error updating elderly {elderlyId}");
            throw;
        }
    }

    /// <summary>
    /// Soft delete an elderly resident
    /// </summary>
    public async Task<Response<bool>> DeleteElderlyAsync(int elderlyId)
    {
        try
        {
            _logger.LogInformation($"Soft deleting elderly ID: {elderlyId}");

            var elderly = await _context.Elderlies
                .FirstOrDefaultAsync(e => e.Id == elderlyId && !e.IsDeleted);

            if (elderly == null)
            {
                throw new NotFoundException($"Elderly with ID {elderlyId} not found");
            }

            // Check for active reports
            var hasReports = await _context.DailyReports
                .AnyAsync(r => r.ElderlyId == elderlyId && !r.IsDeleted);

            if (hasReports)
            {
                throw new BusinessRuleException("Cannot delete elderly with existing reports");
            }

            elderly.IsDeleted = true;
            elderly.DeletedAt = DateTime.UtcNow;
            elderly.UpdatedAt = DateTime.UtcNow;
            elderly.UpdatedBy = _currentUserService.UserId?.ToString() ?? "System";

            await _unitOfWork.Repository<Elderly>().UpdateAsync(elderly);
            await _unitOfWork.CompleteAsync();

            // Create audit log
            await CreateAuditLogAsync(
                null,
                "Delete",
                nameof(Elderly),
                elderlyId,
                null,
                JsonSerializer.Serialize(new { Deleted = true, DeletedAt = DateTime.UtcNow }),
                _currentUserService.UserId?.ToString() ?? "System"
            );

            return new Response<bool>(true, "Elderly deleted successfully");
        }
        catch (Exception ex) when (ex is not NotFoundException && ex is not BusinessRuleException)
        {
            _logger.LogError(ex, $"Error deleting elderly {elderlyId}");
            throw;
        }
    }

    /// <summary>
    /// Activate an elderly resident
    /// </summary>
    public async Task<Response<bool>> ActivateElderlyAsync(int elderlyId)
    {
        try
        {
            _logger.LogInformation($"Activating elderly ID: {elderlyId}");

            var elderly = await _context.Elderlies
                .FirstOrDefaultAsync(e => e.Id == elderlyId && !e.IsDeleted);

            if (elderly == null)
            {
                throw new NotFoundException($"Elderly with ID {elderlyId} not found");
            }

            elderly.IsActive = true;
            elderly.UpdatedAt = DateTime.UtcNow;
            elderly.UpdatedBy = _currentUserService.UserId?.ToString() ?? "System";

            await _unitOfWork.Repository<Elderly>().UpdateAsync(elderly);
            await _unitOfWork.CompleteAsync();

            return new Response<bool>(true, "Elderly activated successfully");
        }
        catch (Exception ex) when (ex is not NotFoundException)
        {
            _logger.LogError(ex, $"Error activating elderly {elderlyId}");
            throw;
        }
    }

    /// <summary>
    /// Deactivate an elderly resident
    /// </summary>
    public async Task<Response<bool>> DeactivateElderlyAsync(int elderlyId)
    {
        try
        {
            _logger.LogInformation($"Deactivating elderly ID: {elderlyId}");

            var elderly = await _context.Elderlies
                .FirstOrDefaultAsync(e => e.Id == elderlyId && !e.IsDeleted);

            if (elderly == null)
            {
                throw new NotFoundException($"Elderly with ID {elderlyId} not found");
            }

            elderly.IsActive = false;
            elderly.UpdatedAt = DateTime.UtcNow;
            elderly.UpdatedBy = _currentUserService.UserId?.ToString() ?? "System";

            await _unitOfWork.Repository<Elderly>().UpdateAsync(elderly);
            await _unitOfWork.CompleteAsync();

            return new Response<bool>(true, "Elderly deactivated successfully");
        }
        catch (Exception ex) when (ex is not NotFoundException)
        {
            _logger.LogError(ex, $"Error deactivating elderly {elderlyId}");
            throw;
        }
    }

    #endregion

    #region Employee-Elderly Assignments

    /// <summary>
    /// Get employee assignments
    /// </summary>
    public async Task<Response<List<EmployeeAssignmentDto>>> GetEmployeeAssignmentsAsync(int? employeeId, int? elderlyId)
    {
        try
        {
            _logger.LogInformation("Getting employee assignments");

            var query = _context.EmployeeElderlyAssignments
                .Include(a => a.Employee)
                .Include(a => a.Elderly)
                .Where(a => !a.IsDeleted)
                .AsQueryable();

            if (employeeId.HasValue)
            {
                query = query.Where(a => a.EmployeeId == employeeId.Value);
            }

            if (elderlyId.HasValue)
            {
                query = query.Where(a => a.ElderlyId == elderlyId.Value);
            }

            var assignments = await query.ToListAsync();
            var assignmentDtos = _mapper.Map<List<EmployeeAssignmentDto>>(assignments);

            return new Response<List<EmployeeAssignmentDto>>(assignmentDtos, "Assignments retrieved successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting employee assignments");
            throw;
        }
    }

    /// <summary>
    /// Assign employee to elderly
    /// </summary>
    public async Task<Response<EmployeeAssignmentDto>> AssignEmployeeToElderlyAsync(int employeeId, int elderlyId, bool isPrimary)
    {
        try
        {
            _logger.LogInformation($"Assigning employee {employeeId} to elderly {elderlyId}");

            // Check if employee exists
            var employee = await _userManager.FindByIdAsync(employeeId.ToString());
            if (employee == null || employee.UserType != UserType.Employee)
            {
                throw new NotFoundException($"Employee with ID {employeeId} not found");
            }

            // Check if elderly exists
            var elderly = await _context.Elderlies
                .FirstOrDefaultAsync(e => e.Id == elderlyId && !e.IsDeleted);

            if (elderly == null)
            {
                throw new NotFoundException($"Elderly with ID {elderlyId} not found");
            }

            // Check if assignment already exists (active)
            var existingAssignment = await _context.EmployeeElderlyAssignments
                .FirstOrDefaultAsync(a => a.EmployeeId == employeeId && a.ElderlyId == elderlyId && !a.IsDeleted);

            if (existingAssignment != null)
            {
                throw new ValidationException("Assignment already exists",
                    new Dictionary<string, string[]>
                    {
                        { "Assignment", new[] { "This employee is already assigned to this elderly" } }
                    });
            }

            // If setting as primary, remove primary status from other assignments for this elderly
            if (isPrimary)
            {
                var primaryAssignments = await _context.EmployeeElderlyAssignments
                    .Where(a => a.ElderlyId == elderlyId && a.IsPrimary && !a.IsDeleted)
                    .ToListAsync();

                foreach (var pa in primaryAssignments)
                {
                    pa.IsPrimary = false;
                    pa.UpdatedAt = DateTime.UtcNow;
                }
            }

            // Check if a soft-deleted assignment exists (same composite PK) and reactivate it
            var deletedAssignment = await _context.EmployeeElderlyAssignments
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(a => a.EmployeeId == employeeId && a.ElderlyId == elderlyId && a.IsDeleted);

            if (deletedAssignment != null)
            {
                // Reactivate the soft-deleted record
                deletedAssignment.IsDeleted = false;
                deletedAssignment.DeletedAt = null;
                deletedAssignment.IsPrimary = isPrimary;
                deletedAssignment.AssignedDate = DateTime.UtcNow;
                deletedAssignment.UpdatedAt = DateTime.UtcNow;
                deletedAssignment.UpdatedBy = _currentUserService.UserId?.ToString() ?? "System";

                await _unitOfWork.CompleteAsync();

                await _context.Entry(deletedAssignment)
                    .Reference(a => a.Employee)
                    .LoadAsync();
                await _context.Entry(deletedAssignment)
                    .Reference(a => a.Elderly)
                    .LoadAsync();

                var reactivatedDto = _mapper.Map<EmployeeAssignmentDto>(deletedAssignment);
                return new Response<EmployeeAssignmentDto>(reactivatedDto, "Employee assigned successfully");
            }

            var assignment = new EmployeeElderlyAssignment
            {
                EmployeeId = employeeId,
                ElderlyId = elderlyId,
                AssignedDate = DateTime.UtcNow,
                IsPrimary = isPrimary,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = _currentUserService.UserId?.ToString() ?? "System"
            };

            await _unitOfWork.Repository<EmployeeElderlyAssignment>().AddAsync(assignment);
            await _unitOfWork.CompleteAsync();

            // Load navigation properties for DTO
            await _context.Entry(assignment)
                .Reference(a => a.Employee)
                .LoadAsync();
            await _context.Entry(assignment)
                .Reference(a => a.Elderly)
                .LoadAsync();

            var assignmentDto = _mapper.Map<EmployeeAssignmentDto>(assignment);

            return new Response<EmployeeAssignmentDto>(assignmentDto, "Employee assigned successfully");
        }
        catch (Exception ex) when (ex is not NotFoundException && ex is not ValidationException)
        {
            _logger.LogError(ex, $"Error assigning employee {employeeId} to elderly {elderlyId}");
            throw;
        }
    }

    /// <summary>
    /// Remove employee assignment
    /// </summary>
    public async Task<Response<bool>> RemoveEmployeeAssignmentAsync(int employeeId, int elderlyId)
    {
        try
        {
            _logger.LogInformation($"Removing assignment: employee {employeeId}, elderly {elderlyId}");

            var assignment = await _context.EmployeeElderlyAssignments
                .FirstOrDefaultAsync(a => a.EmployeeId == employeeId && a.ElderlyId == elderlyId && !a.IsDeleted);

            if (assignment == null)
            {
                throw new NotFoundException("Assignment not found");
            }

            // Check if this is the primary assignment
            if (assignment.IsPrimary)
            {
                // Check if there are other assignments
                var otherAssignments = await _context.EmployeeElderlyAssignments
                    .CountAsync(a => a.ElderlyId == elderlyId && a.EmployeeId != employeeId && !a.IsDeleted);

                if (otherAssignments == 0)
                {
                    throw new BusinessRuleException("Cannot remove the only primary assignment. Assign another employee first.");
                }
            }

            // Soft delete
            assignment.IsDeleted = true;
            assignment.DeletedAt = DateTime.UtcNow;
            assignment.UpdatedAt = DateTime.UtcNow;
            assignment.UpdatedBy = _currentUserService.UserId?.ToString() ?? "System";

            await _unitOfWork.CompleteAsync();

            return new Response<bool>(true, "Assignment removed successfully");
        }
        catch (Exception ex) when (ex is not NotFoundException && ex is not BusinessRuleException)
        {
            _logger.LogError(ex, $"Error removing assignment: employee {employeeId}, elderly {elderlyId}");
            throw;
        }
    }

    /// <summary>
    /// Update primary assignment status
    /// </summary>
    public async Task<Response<bool>> UpdatePrimaryAssignmentAsync(int employeeId, int elderlyId, bool isPrimary)
    {
        try
        {
            _logger.LogInformation($"Updating primary status for assignment: employee {employeeId}, elderly {elderlyId}");

            var assignment = await _context.EmployeeElderlyAssignments
                .FirstOrDefaultAsync(a => a.EmployeeId == employeeId && a.ElderlyId == elderlyId && !a.IsDeleted);

            if (assignment == null)
            {
                throw new NotFoundException("Assignment not found");
            }

            if (isPrimary && !assignment.IsPrimary)
            {
                // Remove primary status from other assignments
                var otherPrimary = await _context.EmployeeElderlyAssignments
                    .Where(a => a.ElderlyId == elderlyId && a.IsPrimary && a.EmployeeId != employeeId && !a.IsDeleted)
                    .ToListAsync();

                foreach (var op in otherPrimary)
                {
                    op.IsPrimary = false;
                    op.UpdatedAt = DateTime.UtcNow;
                }
            }

            assignment.IsPrimary = isPrimary;
            assignment.UpdatedAt = DateTime.UtcNow;
            assignment.UpdatedBy = _currentUserService.UserId?.ToString() ?? "System";

            await _unitOfWork.CompleteAsync();

            return new Response<bool>(true, "Primary assignment updated successfully");
        }
        catch (Exception ex) when (ex is not NotFoundException)
        {
            _logger.LogError(ex, $"Error updating primary assignment: employee {employeeId}, elderly {elderlyId}");
            throw;
        }
    }

    #endregion

    #region Elderly-Family Assignments

    /// <summary>
    /// Get family assignments
    /// </summary>
    public async Task<Response<List<FamilyLinkDto>>> GetFamilyAssignmentsAsync(int? elderlyId, int? familyMemberId)
    {
        try
        {
            _logger.LogInformation("Getting family assignments");

            var query = _context.ElderlyFamilyMembers
                .Include(f => f.Elderly)
                .Include(f => f.FamilyMember)
                .Where(f => !f.IsDeleted)
                .AsQueryable();

            if (elderlyId.HasValue)
            {
                query = query.Where(f => f.ElderlyId == elderlyId.Value);
            }

            if (familyMemberId.HasValue)
            {
                query = query.Where(f => f.FamilyMemberId == familyMemberId.Value);
            }

            var assignments = await query.ToListAsync();
            var assignmentDtos = _mapper.Map<List<FamilyLinkDto>>(assignments);

            return new Response<List<FamilyLinkDto>>(assignmentDtos, "Family assignments retrieved successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting family assignments");
            throw;
        }
    }

    /// <summary>
    /// Assign family member to elderly
    /// </summary>
    public async Task<Response<FamilyLinkDto>> AssignFamilyToElderlyAsync(int elderlyId, int familyMemberId, string relationship, bool isPrimary)
    {
        try
        {
            _logger.LogInformation($"Assigning family member {familyMemberId} to elderly {elderlyId}");

            // Check if family member exists
            var familyMember = await _userManager.FindByIdAsync(familyMemberId.ToString());
            if (familyMember == null || familyMember.UserType != UserType.FamilyMember)
            {
                throw new NotFoundException($"Family member with ID {familyMemberId} not found");
            }

            // Check if elderly exists
            var elderly = await _context.Elderlies
                .FirstOrDefaultAsync(e => e.Id == elderlyId && !e.IsDeleted);

            if (elderly == null)
            {
                throw new NotFoundException($"Elderly with ID {elderlyId} not found");
            }

            // Check if assignment already exists (active)
            var existingAssignment = await _context.ElderlyFamilyMembers
                .FirstOrDefaultAsync(f => f.ElderlyId == elderlyId && f.FamilyMemberId == familyMemberId && !f.IsDeleted);

            if (existingAssignment != null)
            {
                throw new ValidationException("Assignment already exists",
                    new Dictionary<string, string[]>
                    {
                        { "Assignment", new[] { "This family member is already linked to this elderly" } }
                    });
            }

            // If setting as primary, update other assignments
            if (isPrimary)
            {
                var primaryAssignments = await _context.ElderlyFamilyMembers
                    .Where(f => f.ElderlyId == elderlyId && f.IsPrimaryContact && !f.IsDeleted)
                    .ToListAsync();

                foreach (var pa in primaryAssignments)
                {
                    pa.IsPrimaryContact = false;
                    pa.UpdatedAt = DateTime.UtcNow;
                }
            }

            // Check if a soft-deleted assignment exists (same composite PK) and reactivate it
            var deletedAssignment = await _context.ElderlyFamilyMembers
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(f => f.ElderlyId == elderlyId && f.FamilyMemberId == familyMemberId && f.IsDeleted);

            if (deletedAssignment != null)
            {
                // Reactivate the soft-deleted record
                deletedAssignment.IsDeleted = false;
                deletedAssignment.DeletedAt = null;
                deletedAssignment.Relationship = relationship;
                deletedAssignment.IsPrimaryContact = isPrimary;
                deletedAssignment.CanScheduleVisits = true;
                deletedAssignment.UpdatedAt = DateTime.UtcNow;
                deletedAssignment.UpdatedBy = _currentUserService.UserId?.ToString() ?? "System";

                await _unitOfWork.CompleteAsync();

                await _context.Entry(deletedAssignment)
                    .Reference(f => f.Elderly)
                    .LoadAsync();
                await _context.Entry(deletedAssignment)
                    .Reference(f => f.FamilyMember)
                    .LoadAsync();

                var reactivatedDto = _mapper.Map<FamilyLinkDto>(deletedAssignment);
                return new Response<FamilyLinkDto>(reactivatedDto, "Family member assigned successfully");
            }

            var assignment = new ElderlyFamilyMember
            {
                ElderlyId = elderlyId,
                FamilyMemberId = familyMemberId,
                Relationship = relationship,
                IsPrimaryContact = isPrimary,
                CanScheduleVisits = true,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = _currentUserService.UserId?.ToString() ?? "System"
            };

            await _unitOfWork.Repository<ElderlyFamilyMember>().AddAsync(assignment);
            await _unitOfWork.CompleteAsync();

            // Load navigation properties for DTO
            await _context.Entry(assignment)
                .Reference(f => f.Elderly)
                .LoadAsync();
            await _context.Entry(assignment)
                .Reference(f => f.FamilyMember)
                .LoadAsync();

            var assignmentDto = _mapper.Map<FamilyLinkDto>(assignment);

            return new Response<FamilyLinkDto>(assignmentDto, "Family member assigned successfully");
        }
        catch (Exception ex) when (ex is not NotFoundException && ex is not ValidationException)
        {
            _logger.LogError(ex, $"Error assigning family member {familyMemberId} to elderly {elderlyId}");
            throw;
        }
    }

    /// <summary>
    /// Remove family assignment
    /// </summary>
    public async Task<Response<bool>> RemoveFamilyAssignmentAsync(int elderlyId, int familyMemberId)
    {
        try
        {
            _logger.LogInformation($"Removing family assignment: elderly {elderlyId}, family {familyMemberId}");

            var assignment = await _context.ElderlyFamilyMembers
                .FirstOrDefaultAsync(f => f.ElderlyId == elderlyId && f.FamilyMemberId == familyMemberId && !f.IsDeleted);

            if (assignment == null)
            {
                throw new NotFoundException("Family assignment not found");
            }

            // Soft delete
            assignment.IsDeleted = true;
            assignment.DeletedAt = DateTime.UtcNow;
            assignment.UpdatedAt = DateTime.UtcNow;
            assignment.UpdatedBy = _currentUserService.UserId?.ToString() ?? "System";

            await _unitOfWork.CompleteAsync();

            return new Response<bool>(true, "Family assignment removed successfully");
        }
        catch (Exception ex) when (ex is not NotFoundException)
        {
            _logger.LogError(ex, $"Error removing family assignment: elderly {elderlyId}, family {familyMemberId}");
            throw;
        }
    }

    /// <summary>
    /// Update family relationship
    /// </summary>
    public async Task<Response<bool>> UpdateFamilyRelationshipAsync(int elderlyId, int familyMemberId, string relationship, bool isPrimary)
    {
        try
        {
            _logger.LogInformation($"Updating family relationship: elderly {elderlyId}, family {familyMemberId}");

            var assignment = await _context.ElderlyFamilyMembers
                .FirstOrDefaultAsync(f => f.ElderlyId == elderlyId && f.FamilyMemberId == familyMemberId && !f.IsDeleted);

            if (assignment == null)
            {
                throw new NotFoundException("Family assignment not found");
            }

            if (isPrimary && !assignment.IsPrimaryContact)
            {
                // Update other primary assignments
                var otherPrimary = await _context.ElderlyFamilyMembers
                    .Where(f => f.ElderlyId == elderlyId && f.IsPrimaryContact && f.FamilyMemberId != familyMemberId && !f.IsDeleted)
                    .ToListAsync();

                foreach (var op in otherPrimary)
                {
                    op.IsPrimaryContact = false;
                    op.UpdatedAt = DateTime.UtcNow;
                }
            }

            assignment.Relationship = relationship;
            assignment.IsPrimaryContact = isPrimary;
            assignment.UpdatedAt = DateTime.UtcNow;
            assignment.UpdatedBy = _currentUserService.UserId?.ToString() ?? "System";

            await _unitOfWork.CompleteAsync();

            return new Response<bool>(true, "Family relationship updated successfully");
        }
        catch (Exception ex) when (ex is not NotFoundException)
        {
            _logger.LogError(ex, $"Error updating family relationship: elderly {elderlyId}, family {familyMemberId}");
            throw;
        }
    }

    #endregion

    #region Visits

    /// <summary>
    /// Get all visits with filtering and pagination
    /// </summary>
    public async Task<Response<PaginatedResponse<List<VisitRequestDto>>>> GetAllVisitsAsync(AdminVisitFilterParameters parameters)
    {
        try
        {
            _logger.LogInformation("Getting all visits for admin");

            var query = _context.VisitRequests
                .Include(v => v.FamilyMember)
                .Include(v => v.Elderly)
                .Include(v => v.ApprovedBy)
                .Where(v => !v.IsDeleted)
                .AsQueryable();

            // Apply filters
            if (parameters.ElderlyId.HasValue)
            {
                query = query.Where(v => v.ElderlyId == parameters.ElderlyId.Value);
            }

            if (parameters.FamilyMemberId.HasValue)
            {
                query = query.Where(v => v.FamilyMemberId == parameters.FamilyMemberId.Value);
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

            // Apply sorting
            query = parameters.SortBy?.ToLower() switch
            {
                "date" => parameters.SortDescending
                    ? query.OrderByDescending(v => v.RequestedDate)
                    : query.OrderBy(v => v.RequestedDate),
                "status" => parameters.SortDescending
                    ? query.OrderByDescending(v => v.Status)
                    : query.OrderBy(v => v.Status),
                _ => query.OrderByDescending(v => v.RequestedDate)
            };

            var totalCount = await query.CountAsync();

            var visits = await query
                .Skip((parameters.PageNumber - 1) * parameters.PageSize)
                .Take(parameters.PageSize)
                .ToListAsync();

            var visitDtos = _mapper.Map<List<VisitRequestDto>>(visits);

            var paginatedResponse = new PaginatedResponse<List<VisitRequestDto>>(
                visitDtos, parameters.PageNumber, parameters.PageSize, totalCount);

            return new Response<PaginatedResponse<List<VisitRequestDto>>>(
                paginatedResponse, "Visits retrieved successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all visits");
            throw;
        }
    }

    #endregion

    #region System Monitoring

    /// <summary>
    /// Get system statistics
    /// </summary>
    public async Task<Response<SystemStatisticsDto>> GetSystemStatisticsAsync()
    {
        try
        {
            _logger.LogInformation("Getting system statistics");

            var today = DateTime.Today;
            var startOfWeek = today.AddDays(-(int)today.DayOfWeek);
            var startOfMonth = new DateTime(today.Year, today.Month, 1);

            // User statistics
            var totalUsers = await _context.Users.CountAsync(u => !u.IsDeleted);
            var activeUsers = await _context.Users.CountAsync(u => u.IsActive && !u.IsDeleted);
            var usersByRole = new Dictionary<string, int>();
            var usersByType = new Dictionary<string, int>();

            foreach (UserType type in Enum.GetValues(typeof(UserType)))
            {
                var count = await _context.Users
                    .CountAsync(u => u.UserType == type && !u.IsDeleted);
                usersByType[type.ToString()] = count;
            }

            var roles = await _roleManager.Roles.ToListAsync();
            foreach (var role in roles)
            {
                var count = await _context.UserRoles
                    .CountAsync(ur => ur.RoleId == role.Id);
                usersByRole[role.Name ?? role.Id.ToString()] = count;
            }

            // Elderly statistics
            var totalElderly = await _context.Elderlies.CountAsync(e => !e.IsDeleted);
            var activeElderly = await _context.Elderlies.CountAsync(e => e.IsActive && !e.IsDeleted);
            var elderlyWithFamily = await _context.Elderlies
                .CountAsync(e => e.FamilyMembers.Any() && !e.IsDeleted);
            var averageAge = await _context.Elderlies
                .Where(e => !e.IsDeleted)
                .Select(e => DateTime.Today.Year - e.DateOfBirth.Year)
                .AverageAsync();

            // Report statistics
            var totalReports = await _context.DailyReports.CountAsync(r => !r.IsDeleted);
            var reportsToday = await _context.DailyReports
                .CountAsync(r => r.ReportDate.Date == today && !r.IsDeleted);
            var reportsThisWeek = await _context.DailyReports
                .CountAsync(r => r.ReportDate.Date >= startOfWeek && r.ReportDate.Date <= today && !r.IsDeleted);
            var reportsThisMonth = await _context.DailyReports
                .CountAsync(r => r.ReportDate.Date >= startOfMonth && r.ReportDate.Date <= today && !r.IsDeleted);

            var reportsByStatus = new Dictionary<string, int>();
            foreach (ApprovalStatus status in Enum.GetValues(typeof(ApprovalStatus)))
            {
                var count = await _context.DailyReports
                    .CountAsync(r => r.ApprovalStatus == status && !r.IsDeleted);
                reportsByStatus[status.ToString()] = count;
            }

            // Activity statistics
            var loginsToday = await _context.Users
                .CountAsync(u => u.LastLoginAt.HasValue && u.LastLoginAt.Value.Date == today);
            var activeSessions = await _context.AttendanceLogs
                .CountAsync(a => a.LoginTime.Date == today && a.LogoutTime == null);
            var averageReportsPerDay = totalReports > 0
                ? Math.Round((double)totalReports / 30, 2) // Last 30 days average
                : 0;

            // System health (mock data for now)
            var lastBackup = DateTime.UtcNow.AddDays(-1);
            var pendingNotifications = await _context.Notifications
                .CountAsync(n => !n.IsRead);

            var statistics = new SystemStatisticsDto
            {
                TotalUsers = totalUsers,
                ActiveUsers = activeUsers,
                InactiveUsers = totalUsers - activeUsers,
                UsersByRole = usersByRole,
                UsersByType = usersByType,
                TotalElderly = totalElderly,
                ActiveElderly = activeElderly,
                ElderlyWithFamily = elderlyWithFamily,
                ElderlyWithoutFamily = totalElderly - elderlyWithFamily,
                AverageAge = Math.Round(averageAge, 1),
                TotalReports = totalReports,
                ReportsToday = reportsToday,
                ReportsThisWeek = reportsThisWeek,
                ReportsThisMonth = reportsThisMonth,
                ReportsByStatus = reportsByStatus,
                LoginsToday = loginsToday,
                ActiveSessions = activeSessions,
                AverageReportsPerDay = averageReportsPerDay,
                LastBackup = lastBackup,
                DatabaseSize = 150, // Mock value in MB
                PendingNotifications = pendingNotifications
            };

            return new Response<SystemStatisticsDto>(statistics, "System statistics retrieved successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting system statistics");
            throw;
        }
    }

    /// <summary>
    /// Get audit logs
    /// </summary>
    public async Task<Response<List<AuditLogDto>>> GetAuditLogsAsync(DateTime? fromDate, DateTime? toDate, string? entityType, int? entityId)
    {
        try
        {
            _logger.LogInformation("Getting audit logs");

            var query = _context.AuditLogs
                .Include(a => a.User)
                .AsQueryable();

            if (fromDate.HasValue)
            {
                query = query.Where(a => a.Timestamp >= fromDate.Value);
            }

            if (toDate.HasValue)
            {
                query = query.Where(a => a.Timestamp <= toDate.Value);
            }

            if (!string.IsNullOrEmpty(entityType))
            {
                query = query.Where(a => a.EntityName == entityType);
            }

            if (entityId.HasValue)
            {
                query = query.Where(a => a.EntityId == entityId.Value);
            }

            var logs = await query
                .OrderByDescending(a => a.Timestamp)
                .Take(1000)
                .ToListAsync();

            var logDtos = logs.Select(l => new AuditLogDto
            {
                Id = l.Id,
                UserId = l.UserId,
                UserName = l.User != null ? $"{l.User.FirstName} {l.User.LastName}" : "System",
                Action = l.Action,
                EntityName = l.EntityName,
                EntityId = l.EntityId,
                OldValues = l.OldValues,
                NewValues = l.NewValues,
                IpAddress = l.IpAddress,
                Timestamp = l.Timestamp
            }).ToList();

            return new Response<List<AuditLogDto>>(logDtos, "Audit logs retrieved successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting audit logs");
            throw;
        }
    }

    /// <summary>
    /// Get activity summary for a specific date
    /// </summary>
    public async Task<Response<ActivitySummaryDto>> GetActivitySummaryAsync(DateTime date)
    {
        try
        {
            _logger.LogInformation($"Getting activity summary for {date:yyyy-MM-dd}");

            var nextDay = date.AddDays(1);

            var newUsers = await _context.Users
                .CountAsync(u => u.CreatedAt.Date >= date && u.CreatedAt.Date < nextDay);

            var newElderly = await _context.Elderlies
                .CountAsync(e => e.CreatedAt.Date >= date && e.CreatedAt.Date < nextDay);

            var reportsSubmitted = await _context.DailyReports
                .CountAsync(r => r.SubmissionDate.Date >= date && r.SubmissionDate.Date < nextDay);

            var reportsApproved = await _context.DailyReports
                .CountAsync(r => r.ApprovedDate.HasValue &&
                                r.ApprovedDate.Value.Date >= date &&
                                r.ApprovedDate.Value.Date < nextDay);

            var logins = await _context.Users
                .CountAsync(u => u.LastLoginAt.HasValue &&
                                u.LastLoginAt.Value.Date >= date &&
                                u.LastLoginAt.Value.Date < nextDay);

            // Get recent activities from audit logs
            var recentActivities = await _context.AuditLogs
                .Include(a => a.User)
                .Where(a => a.Timestamp.Date >= date && a.Timestamp.Date < nextDay)
                .OrderByDescending(a => a.Timestamp)
                .Take(20)
                .Select(a => new RecentActivityDto
                {
                    UserName = a.User != null ? $"{a.User.FirstName} {a.User.LastName}" : "System",
                    Action = a.Action,
                    EntityType = a.EntityName,
                    Description = $"{a.Action} {a.EntityName}",
                    Timestamp = a.Timestamp
                })
                .ToListAsync();

            var summary = new ActivitySummaryDto
            {
                Date = date,
                NewUsers = newUsers,
                NewElderly = newElderly,
                ReportsSubmitted = reportsSubmitted,
                ReportsApproved = reportsApproved,
                Logins = logins,
                RecentActivities = recentActivities
            };

            return new Response<ActivitySummaryDto>(summary, "Activity summary retrieved successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error getting activity summary for {date:yyyy-MM-dd}");
            throw;
        }
    }

    #endregion

    #region Dashboard

    /// <summary>
    /// Get admin dashboard data
    /// </summary>
    public async Task<Response<AdminDashboardDto>> GetDashboardDataAsync()
    {
        try
        {
            _logger.LogInformation("Getting admin dashboard data");

            var statistics = (await GetSystemStatisticsAsync()).Data ?? new SystemStatisticsDto();

            // Recent activities
            var recentActivities = await _context.AuditLogs
                .Include(a => a.User)
                .OrderByDescending(a => a.Timestamp)
                .Take(10)
                .Select(a => new RecentActivityDto
                {
                    UserName = a.User != null ? $"{a.User.FirstName} {a.User.LastName}" : "System",
                    Action = a.Action,
                    EntityType = a.EntityName,
                    Description = $"{a.Action} {a.EntityName}",
                    Timestamp = a.Timestamp
                })
                .ToListAsync();

            // Recent users
            var recentUsers = await _context.Users
                .Where(u => !u.IsDeleted)
                .OrderByDescending(u => u.CreatedAt)
                .Take(5)
                .ToListAsync();

            var recentUserDtos = _mapper.Map<List<UserDto>>(recentUsers);

            // Recent elderly
            var recentElderly = await _context.Elderlies
                .Where(e => !e.IsDeleted)
                .OrderByDescending(e => e.CreatedAt)
                .Take(5)
                .ToListAsync();

            var recentElderlyDtos = _mapper.Map<List<ElderlyDto>>(recentElderly);

            // User growth data (last 7 days)
            var userGrowthData = new List<ChartDataDto>();
            for (int i = 6; i >= 0; i--)
            {
                var date = DateTime.Today.AddDays(-i);
                var count = await _context.Users
                    .CountAsync(u => u.CreatedAt.Date <= date && !u.IsDeleted);
                userGrowthData.Add(new ChartDataDto
                {
                    Label = date.ToString("MMM dd"),
                    Value = count
                });
            }

            // Report activity data (last 7 days)
            var reportActivityData = new List<ChartDataDto>();
            for (int i = 6; i >= 0; i--)
            {
                var date = DateTime.Today.AddDays(-i);
                var count = await _context.DailyReports
                    .CountAsync(r => r.SubmissionDate.Date == date && !r.IsDeleted);
                reportActivityData.Add(new ChartDataDto
                {
                    Label = date.ToString("MMM dd"),
                    Value = count
                });
            }

            var dashboard = new AdminDashboardDto
            {
                Statistics = statistics,
                RecentActivities = recentActivities,
                RecentUsers = recentUserDtos,
                RecentElderly = recentElderlyDtos,
                UserGrowthData = userGrowthData,
                ReportActivityData = reportActivityData
            };

            return new Response<AdminDashboardDto>(dashboard, "Dashboard data retrieved successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting admin dashboard data");
            throw;
        }
    }

    #endregion

    #region Private Methods

    /// <summary>
    /// Create audit log entry
    /// </summary>
    private async Task CreateAuditLogAsync(int? userId, string action, string entityName, int? entityId, string? oldValues, string? newValues, string ipAddress)
    {
        try
        {
            var auditLog = new AuditLog
            {
                UserId = userId,
                Action = action,
                EntityName = entityName,
                EntityId = entityId,
                OldValues = oldValues,
                NewValues = newValues,
                IpAddress = ipAddress,
                Timestamp = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            };

            await _unitOfWork.Repository<AuditLog>().AddAsync(auditLog);
            await _unitOfWork.CompleteAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating audit log");
            // Don't throw - audit logging failure shouldn't break the main operation
        }
    }

    #endregion
}