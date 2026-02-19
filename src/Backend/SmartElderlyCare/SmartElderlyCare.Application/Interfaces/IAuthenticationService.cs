using SmartElderlyCare.Application.DTOs.Authentication;
using SmartElderlyCare.Application.Wrappers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SmartElderlyCare.Application.Interfaces;

/// <summary>
/// Service interface for authentication operations
/// </summary>
public interface IAuthenticationService
{
    Task<Response<AuthenticationResponse>> LoginAsync(LoginRequest request);
    Task<Response<AuthenticationResponse>> RegisterEmployeeAsync(RegisterEmployeeRequest request);
    Task<Response<AuthenticationResponse>> RegisterFamilyMemberAsync(RegisterFamilyMemberRequest request);
    Task<Response<string>> ChangePasswordAsync(ChangePasswordRequest request, int userId);
    Task<Response<string>> LogoutAsync(int userId);
}