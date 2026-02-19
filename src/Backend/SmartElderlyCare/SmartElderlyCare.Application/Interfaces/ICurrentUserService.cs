using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
namespace SmartElderlyCare.Application.Interfaces;

/// <summary>
/// Service to access current authenticated user information
/// </summary>
public interface ICurrentUserService
{
    int? UserId { get; }
    string? Email { get; }
    string? UserType { get; }
    string? FullName { get; }
    List<string> Roles { get; }
    bool IsAuthenticated { get; }
    bool IsInRole(string role);
}