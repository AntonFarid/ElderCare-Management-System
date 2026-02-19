using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using SmartElderlyCare.Application.Common.Exceptions;
using SmartElderlyCare.Application.Common.Settings;
using SmartElderlyCare.Application.DTOs.Authentication;
using SmartElderlyCare.Application.Interfaces;
using SmartElderlyCare.Application.Wrappers;
using SmartElderlyCare.Domain.Entities;
using SmartElderlyCare.Domain.Enums;
using SmartElderlyCare.Domain.Interfaces;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace SmartElderlyCare.Infrastructure.Services;

/// <summary>
/// Authentication service implementation with JWT
/// </summary>
public class AuthenticationService : IAuthenticationService
{
    private readonly UserManager<User> _userManager;
    private readonly RoleManager<Role> _roleManager;
    private readonly SignInManager<User> _signInManager;
    private readonly IUnitOfWork _unitOfWork;
    private readonly JwtSettings _jwtSettings;
    private readonly ILogger<AuthenticationService> _logger;

    public AuthenticationService(
        UserManager<User> userManager,
        RoleManager<Role> roleManager,
        SignInManager<User> signInManager,
        IUnitOfWork unitOfWork,
        IOptions<JwtSettings> jwtSettings,
        ILogger<AuthenticationService> logger)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _signInManager = signInManager;
        _unitOfWork = unitOfWork;
        _jwtSettings = jwtSettings.Value;
        _logger = logger;
    }

    /// <summary>
    /// Authenticate user and generate JWT token
    /// </summary>
    public async Task<Response<AuthenticationResponse>> LoginAsync(LoginRequest request)
    {
        try
        {
            _logger.LogInformation($"Login attempt for email: {request.Email}");

            // Find user by email
            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user == null)
            {
                _logger.LogWarning($"Login failed: User not found with email {request.Email}");
                throw new UnauthorizedException("Invalid email or password");
            }

            // Check if user is active
            if (!user.IsActive || user.IsDeleted)
            {
                _logger.LogWarning($"Login failed: Inactive or deleted user {request.Email}");
                throw new UnauthorizedException("Your account is not active. Please contact administrator.");
            }

            // Verify password
            var result = await _signInManager.CheckPasswordSignInAsync(user, request.Password, true);
            if (!result.Succeeded)
            {
                _logger.LogWarning($"Login failed: Invalid password for user {request.Email}");

                if (result.IsLockedOut)
                {
                    throw new UnauthorizedException("Account locked out. Please try again later.");
                }

                throw new UnauthorizedException("Invalid email or password");
            }

            // Generate JWT token
            var token = await GenerateJwtTokenAsync(user);

            // Update last login time
            user.LastLoginAt = DateTime.UtcNow;
            await _userManager.UpdateAsync(user);

            // Get user roles
            var roles = await _userManager.GetRolesAsync(user);

            _logger.LogInformation($"User {request.Email} logged in successfully");

            // Create response
            var response = new AuthenticationResponse
            {
                Id = user.Id,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email!,
                UserType = user.UserType.ToString(),
                Roles = roles.ToList(),
                Token = token,
                TokenExpiresAt = DateTime.UtcNow.AddMinutes(_jwtSettings.AccessTokenExpirationInMinutes),
                IsActive = user.IsActive
            };

            return new Response<AuthenticationResponse>(response, "Login successful");
        }
        catch (Exception ex) when (ex is not UnauthorizedException)
        {
            _logger.LogError(ex, $"Error during login for {request.Email}");
            throw;
        }
    }

    /// <summary>
    /// Register a new employee
    /// </summary>
    public async Task<Response<AuthenticationResponse>> RegisterEmployeeAsync(RegisterEmployeeRequest request)
    {
        try
        {
            _logger.LogInformation($"Registering new employee with email: {request.Email}");

            // Check if email already exists
            var existingUser = await _userManager.FindByEmailAsync(request.Email);
            if (existingUser != null)
            {
                throw new ValidationException("Email already registered", new Dictionary<string, string[]>
                {
                    { "Email", new[] { "This email is already registered" } }
                });
            }

            // Create new user
            var user = new User
            {
                UserName = request.Email,
                Email = request.Email,
                FirstName = request.FirstName,
                LastName = request.LastName,
                PhoneNumber = request.PhoneNumber,
                UserType = UserType.Employee,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = "System"
            };

            var result = await _userManager.CreateAsync(user, request.Password);
            if (!result.Succeeded)
            {
                var errors = result.Errors.ToDictionary(
                    e => e.Code,
                    e => new[] { e.Description }
                );
                throw new ValidationException("User registration failed", errors);
            }

            // Add to Employee role
            await _userManager.AddToRoleAsync(user, "Employee");

            _logger.LogInformation($"Employee registered successfully: {request.Email}");

            // Generate token for auto-login
            var token = await GenerateJwtTokenAsync(user);
            var roles = await _userManager.GetRolesAsync(user);

            var response = new AuthenticationResponse
            {
                Id = user.Id,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email!,
                UserType = user.UserType.ToString(),
                Roles = roles.ToList(),
                Token = token,
                TokenExpiresAt = DateTime.UtcNow.AddMinutes(_jwtSettings.AccessTokenExpirationInMinutes),
                IsActive = user.IsActive
            };

            return new Response<AuthenticationResponse>(response, "Employee registered successfully");
        }
        catch (Exception ex) when (ex is not ValidationException)
        {
            _logger.LogError(ex, $"Error registering employee {request.Email}");
            throw;
        }
    }

    /// <summary>
    /// Register a new family member and link to elderly
    /// </summary>
    public async Task<Response<AuthenticationResponse>> RegisterFamilyMemberAsync(RegisterFamilyMemberRequest request)
    {
        try
        {
            _logger.LogInformation($"Registering new family member with email: {request.Email}");

            // Check if email already exists
            var existingUser = await _userManager.FindByEmailAsync(request.Email);
            if (existingUser != null)
            {
                throw new ValidationException("Email already registered", new Dictionary<string, string[]>
                {
                    { "Email", new[] { "This email is already registered" } }
                });
            }

            // Verify elderly exists
            var elderly = await _unitOfWork.Repository<Elderly>().GetByIdAsync(request.ElderlyId);
            if (elderly == null)
            {
                throw new NotFoundException($"Elderly with ID {request.ElderlyId} not found");
            }

            // Create new user
            var user = new User
            {
                UserName = request.Email,
                Email = request.Email,
                FirstName = request.FirstName,
                LastName = request.LastName,
                PhoneNumber = request.PhoneNumber,
                UserType = UserType.FamilyMember,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = "System"
            };

            var result = await _userManager.CreateAsync(user, request.Password);
            if (!result.Succeeded)
            {
                var errors = result.Errors.ToDictionary(
                    e => e.Code,
                    e => new[] { e.Description }
                );
                throw new ValidationException("User registration failed", errors);
            }

            // Add to FamilyMember role
            await _userManager.AddToRoleAsync(user, "FamilyMember");

            // Create elderly-family link
            var familyLink = new ElderlyFamilyMember
            {
                ElderlyId = request.ElderlyId,
                FamilyMemberId = user.Id,
                Relationship = request.Relationship,
                IsPrimaryContact = false,
                CanScheduleVisits = true,
                CreatedAt = DateTime.UtcNow
            };

            await _unitOfWork.Repository<ElderlyFamilyMember>().AddAsync(familyLink);
            await _unitOfWork.CompleteAsync();

            _logger.LogInformation($"Family member registered successfully: {request.Email}");

            // Generate token for auto-login
            var token = await GenerateJwtTokenAsync(user);
            var roles = await _userManager.GetRolesAsync(user);

            var response = new AuthenticationResponse
            {
                Id = user.Id,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email!,
                UserType = user.UserType.ToString(),
                Roles = roles.ToList(),
                Token = token,
                TokenExpiresAt = DateTime.UtcNow.AddMinutes(_jwtSettings.AccessTokenExpirationInMinutes),
                IsActive = user.IsActive
            };

            return new Response<AuthenticationResponse>(response, "Family member registered successfully");
        }
        catch (Exception ex) when (ex is not ValidationException && ex is not NotFoundException)
        {
            _logger.LogError(ex, $"Error registering family member {request.Email}");
            throw;
        }
    }

    /// <summary>
    /// Change user password
    /// </summary>
    public async Task<Response<string>> ChangePasswordAsync(ChangePasswordRequest request, int userId)
    {
        try
        {
            _logger.LogInformation($"Changing password for user ID: {userId}");

            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null)
            {
                throw new NotFoundException($"User with ID {userId} not found");
            }

            var result = await _userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
            if (!result.Succeeded)
            {
                var errors = result.Errors.ToDictionary(
                    e => e.Code,
                    e => new[] { e.Description }
                );
                throw new ValidationException("Password change failed", errors);
            }

            _logger.LogInformation($"Password changed successfully for user ID: {userId}");

            return new Response<string>("Password changed successfully");
        }
        catch (Exception ex) when (ex is not NotFoundException && ex is not ValidationException)
        {
            _logger.LogError(ex, $"Error changing password for user {userId}");
            throw;
        }
    }

    /// <summary>
    /// Logout user
    /// </summary>
    public async Task<Response<string>> LogoutAsync(int userId)
    {
        try
        {
            _logger.LogInformation($"Logging out user ID: {userId}");

            await _signInManager.SignOutAsync();

            _logger.LogInformation($"User {userId} logged out successfully");

            return new Response<string>("Logout successful");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error during logout for user {userId}");
            throw;
        }
    }

    /// <summary>
    /// Generate JWT token for authenticated user
    /// </summary>
    private async Task<string> GenerateJwtTokenAsync(User user)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.ASCII.GetBytes(_jwtSettings.Secret);

        // Get user roles
        var roles = await _userManager.GetRolesAsync(user);

        // Create claims
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email!),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new("userId", user.Id.ToString()),
            new("userType", user.UserType.ToString()),
            new("fullName", $"{user.FirstName} {user.LastName}")
        };

        // Add role claims
        claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddMinutes(_jwtSettings.AccessTokenExpirationInMinutes),
            Issuer = _jwtSettings.Issuer,
            Audience = _jwtSettings.Audience,
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key),
                SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }
}