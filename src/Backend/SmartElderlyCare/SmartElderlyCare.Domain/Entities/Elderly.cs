using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using SmartElderlyCare.Domain.Common;

namespace SmartElderlyCare.Domain.Entities;

public class Elderly : BaseEntity, IAuditableEntity
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public DateTime DateOfBirth { get; set; }
    public string? RoomNumber { get; set; }
    public string? EmergencyContact { get; set; }
    public string? MedicalConditions { get; set; }
    public string? Allergies { get; set; }
    public string? DietaryRestrictions { get; set; }
    public string? ProfileImageUrl { get; set; }
    public bool IsActive { get; set; } = true;

    // Unique code for family members to connect to this resident
    public string ConnectionCode { get; set; } = Guid.NewGuid().ToString("N").Substring(0, 6).ToUpper();

    // Audit fields
    public string CreatedBy { get; set; } = string.Empty;
    public string? UpdatedBy { get; set; }

    // Navigation properties
    public virtual ICollection<DailyReport> DailyReports { get; set; } = new List<DailyReport>();
    public virtual ICollection<EmployeeElderlyAssignment> EmployeeAssignments { get; set; } = new List<EmployeeElderlyAssignment>();
    public virtual ICollection<ElderlyFamilyMember> FamilyMembers { get; set; } = new List<ElderlyFamilyMember>();
    public virtual ICollection<VisitRequest> VisitRequests { get; set; } = new List<VisitRequest>();
}