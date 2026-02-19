using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using SmartElderlyCare.Domain.Common;
using SmartElderlyCare.Domain.Enums;

namespace SmartElderlyCare.Domain.Entities;

/// <summary>
/// Extends IdentityUser to add custom properties
/// This will be used with ASP.NET Core Identity as approved
/// </summary>
public class User : IdentityUser<int>, IAuditableEntity
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public UserType UserType { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public string? UpdatedBy { get; set; }

    // Soft delete properties
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }

    // Navigation properties
    public virtual ICollection<DailyReport> DailyReports { get; set; } = new List<DailyReport>();
    public virtual ICollection<AttendanceLog> AttendanceLogs { get; set; } = new List<AttendanceLog>();
    public virtual ICollection<WorkSchedule> WorkSchedules { get; set; } = new List<WorkSchedule>();
    public virtual ICollection<Notification> Notifications { get; set; } = new List<Notification>();

    // For employees: assigned elderly residents
    public virtual ICollection<EmployeeElderlyAssignment> EmployeeAssignments { get; set; } = new List<EmployeeElderlyAssignment>();

    // For family members: linked elderly
    public virtual ICollection<ElderlyFamilyMember> FamilyLinks { get; set; } = new List<ElderlyFamilyMember>();

    // For team leaders: approvals made
    public virtual ICollection<DailyReport> ApprovedReports { get; set; } = new List<DailyReport>();
    public DateTime? LastLoginAt { get; set; }

}

/// <summary>
/// Role entity extending IdentityRole
/// </summary>
public class Role : IdentityRole<int>
{
    public string? Description { get; set; }
}