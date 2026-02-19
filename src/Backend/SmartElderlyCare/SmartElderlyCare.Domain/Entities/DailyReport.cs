using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using SmartElderlyCare.Domain.Common;
using SmartElderlyCare.Domain.Enums;

namespace SmartElderlyCare.Domain.Entities;

public class DailyReport : BaseEntity, IAuditableEntity
{
    public int EmployeeId { get; set; }
    public int ElderlyId { get; set; }
    public DateTime ReportDate { get; set; }
    public DateTime SubmissionDate { get; set; }
    public ApprovalStatus ApprovalStatus { get; set; } = ApprovalStatus.Pending;
    public int? ApprovedById { get; set; }
    public DateTime? ApprovedDate { get; set; }
    public string? RejectionReason { get; set; }
    public string AiGeneratedReport { get; set; } = string.Empty;

    // Structured data stored as JSON
    public string StructuredData { get; set; } = string.Empty;

    // Audit fields
    public string CreatedBy { get; set; } = string.Empty;
    public string? UpdatedBy { get; set; }

    // Navigation properties
    public virtual User Employee { get; set; } = null!;
    public virtual Elderly Elderly { get; set; } = null!;
    public virtual User? ApprovedBy { get; set; }
    public virtual ICollection<HealthMetric> HealthMetrics { get; set; } = new List<HealthMetric>();
}