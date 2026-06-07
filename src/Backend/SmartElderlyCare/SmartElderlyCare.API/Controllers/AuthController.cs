using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartElderlyCare.Application.DTOs.Authentication;
using SmartElderlyCare.Application.DTOs.Common;
using SmartElderlyCare.Application.DTOs.Elderly;
using SmartElderlyCare.Application.Interfaces;
using SmartElderlyCare.Application.Wrappers;
using System.Security.Claims;

namespace SmartElderlyCare.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthenticationService _authenticationService;
    private readonly IAdminService _adminService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        IAuthenticationService authenticationService,
        IAdminService adminService,
        ILogger<AuthController> logger)
    {
        _authenticationService = authenticationService;
        _adminService = adminService;
        _logger = logger;
    }

    /// <summary>
    /// Authenticate user and get JWT token
    /// </summary>
    /// <param name="request">Login credentials</param>
    /// <returns>JWT token and user info</returns>
    [HttpPost("login")]
    [ProducesResponseType(typeof(Response<AuthenticationResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Response<string>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(Response<string>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new Response<string>("Invalid request data"));
        }

        var response = await _authenticationService.LoginAsync(request);
        return Ok(response);
    }

    /// <summary>
    /// Register a new employee (Admin only)
    /// </summary>
    /// <param name="request">Employee registration data</param>
    /// <returns>Created employee info with token</returns>
    [HttpPost("register/employee")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(Response<AuthenticationResponse>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(Response<string>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> RegisterEmployee([FromBody] RegisterEmployeeRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new Response<string>("Invalid request data"));
        }

        var response = await _authenticationService.RegisterEmployeeAsync(request);
        return StatusCode(StatusCodes.Status201Created, response);
    }

    /// <summary>
    /// Register a new family member (Public registration with validation)
    /// </summary>
    /// <param name="request">Family member registration data</param>
    /// <returns>Created family member info with token</returns>
    [HttpPost("register/family")]
    [ProducesResponseType(typeof(Response<AuthenticationResponse>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(Response<string>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(Response<string>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RegisterFamilyMember([FromBody] RegisterFamilyMemberRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new Response<string>("Invalid request data"));
        }

        var response = await _authenticationService.RegisterFamilyMemberAsync(request);
        return StatusCode(StatusCodes.Status201Created, response);
    }

    /// <summary>
    /// Change user password (Authenticated users only)
    /// </summary>
    /// <param name="request">Password change data</param>
    /// <returns>Success message</returns>
    [HttpPost("change-password")]
    [Authorize]
    [ProducesResponseType(typeof(Response<string>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Response<string>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new Response<string>("Invalid request data"));
        }

        var userId = int.Parse(User.FindFirstValue("userId") ?? "0");
        var response = await _authenticationService.ChangePasswordAsync(request, userId);
        return Ok(response);
    }

    /// <summary>
    /// Request password reset token
    /// </summary>
    [HttpPost("forgot-password")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(Response<string>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Response<string>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new Response<string>("Invalid request data"));
        }

        var response = await _authenticationService.ForgotPasswordAsync(request);
        return Ok(response);
    }

    /// <summary>
    /// Reset password using token
    /// </summary>
    [HttpPost("reset-password")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(Response<string>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Response<string>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new Response<string>("Invalid request data"));
        }

        var response = await _authenticationService.ResetPasswordAsync(request);
        return Ok(response);
    }

    /// <summary>
    /// Logout user (Authenticated users only)
    /// </summary>
    /// <returns>Success message</returns>
    [HttpPost("logout")]
    [Authorize]
    [ProducesResponseType(typeof(Response<string>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Logout()
    {
        var userId = int.Parse(User.FindFirstValue("userId") ?? "0");
        var response = await _authenticationService.LogoutAsync(userId);
        return Ok(response);
    }

    /// <summary>
    /// Get current authenticated user info
    /// </summary>
    /// <returns>Current user info</returns>
    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(Response<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public IActionResult GetCurrentUser()
    {
        var userId = User.FindFirstValue("userId");
        var email = User.FindFirstValue(ClaimTypes.Email);
        var userType = User.FindFirstValue("userType");
        var fullName = User.FindFirstValue("fullName");
        var roles = User.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList();

        return Ok(new Response<object>
        {
            Succeeded = true,
            Data = new
            {
                UserId = userId,
                Email = email,
                UserType = userType,
                FullName = fullName,
                Roles = roles
            }
        });
    }


}