using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using SmartElderlyCare.Domain.Common;

namespace SmartElderlyCare.Domain.Entities;

public class ElderlyFamilyMember : BaseEntity
{
    public int ElderlyId { get; set; }
    public int FamilyMemberId { get; set; }
    public string Relationship { get; set; } = string.Empty;
    public bool IsPrimaryContact { get; set; }
    public bool CanScheduleVisits { get; set; } = true;

    // Navigation properties
    public virtual Elderly Elderly { get; set; } = null!;
    public virtual User FamilyMember { get; set; } = null!;
}