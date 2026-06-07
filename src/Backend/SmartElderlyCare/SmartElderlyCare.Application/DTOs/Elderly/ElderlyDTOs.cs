using SmartElderlyCare.Application.DTOs.Common;
using SmartElderlyCare.Application.DTOs.User;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SmartElderlyCare.Application.DTOs.Elderly;

/// <summary>
/// Basic elderly DTO
/// </summary>
public class ElderlyDto : BaseDto
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName => $"{FirstName} {LastName}";
    public DateTime DateOfBirth { get; set; }
    public int Age => DateTime.Today.Year - DateOfBirth.Year -
                      (DateTime.Today.DayOfYear < DateOfBirth.DayOfYear ? 1 : 0);
    public string? RoomNumber { get; set; }
    public string? EmergencyContact { get; set; }
    public string? MedicalConditions { get; set; }
    public string ConnectionCode { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}

/// <summary>
/// Detailed elderly DTO with relationships
/// </summary>
public class ElderlyDetailDto : ElderlyDto
{
    public string? Allergies { get; set; }
    public string? DietaryRestrictions { get; set; }
    public string? ProfileImageUrl { get; set; }

    // Related data
    public List<EmployeeAssignmentDto> AssignedEmployees { get; set; } = new();
    public List<FamilyLinkDto> FamilyMembers { get; set; } = new();
    public int TotalReports { get; set; }
    public DateTime? LastReportDate { get; set; }

    // Audit fields
    public DateTime CreatedAt { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime? UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }
}

/// <summary>
/// Employee assignment DTO
/// </summary>
public class EmployeeAssignmentDto
{
    public int EmployeeId { get; set; }
    public string EmployeeName { get; set; } = string.Empty;
    public string EmployeeEmail { get; set; } = string.Empty;
    public string EmployeePhoneNumber { get; set; } = string.Empty;
    public int ElderlyId { get; set; }
    public string ElderlyName { get; set; } = string.Empty;
    public string RoomNumber { get; set; } = string.Empty;
    public DateTime AssignedDate { get; set; }
    public bool IsPrimary { get; set; }
}

/// <summary>
/// Family link DTO
/// </summary>
public class FamilyLinkDto
{
    public int FamilyMemberId { get; set; }
    public string FamilyMemberName { get; set; } = string.Empty;
    public string Relationship { get; set; } = string.Empty;
    public bool IsPrimaryContact { get; set; }
    public bool CanScheduleVisits { get; set; }
}

/// <summary>
/// Create elderly DTO
/// </summary>
public class CreateElderlyDto
{
    [Required(ErrorMessage = "First name is required")]
    [StringLength(100, MinimumLength = 2)]
    public string FirstName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Last name is required")]
    [StringLength(100, MinimumLength = 2)]
    public string LastName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Date of birth is required")]
    public DateTime DateOfBirth { get; set; }

    [Required(ErrorMessage = "Room number is required")]
    public string RoomNumber { get; set; } = string.Empty;

    [Required(ErrorMessage = "Emergency contact is required")]
    [Phone]
    public string EmergencyContact { get; set; } = string.Empty;

    public string? MedicalConditions { get; set; }
    public string? Allergies { get; set; }
    public string? DietaryRestrictions { get; set; }

    // Optional: Initial employee assignments
    public List<int>? AssignedEmployeeIds { get; set; }
}

/// <summary>
/// Update elderly DTO
/// </summary>
public class UpdateElderlyDto
{
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? RoomNumber { get; set; }
    public string? EmergencyContact { get; set; }
    public string? MedicalConditions { get; set; }
    public string? Allergies { get; set; }
    public string? DietaryRestrictions { get; set; }
    public bool? IsActive { get; set; }
}