using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using SmartElderlyCare.Domain.Common;
using SmartElderlyCare.Domain.Enums;

namespace SmartElderlyCare.Domain.Entities;

public class VisitRequest : BaseEntity
{
    public int FamilyMemberId { get; set; }
    public int ElderlyId { get; set; }
    public DateTime RequestedDate { get; set; }
    public TimeSpan RequestedTime { get; set; }
    public int DurationMinutes { get; set; }
    public VisitStatus Status { get; set; } = VisitStatus.Pending;
    public int? ApprovedById { get; set; }
    public DateTime? ApprovedDate { get; set; }
    public string? Notes { get; set; }
    public string? RejectionReason { get; set; }

    // Navigation properties
    public virtual User FamilyMember { get; set; } = null!;
    public virtual Elderly Elderly { get; set; } = null!;
    public virtual User? ApprovedBy { get; set; }
}