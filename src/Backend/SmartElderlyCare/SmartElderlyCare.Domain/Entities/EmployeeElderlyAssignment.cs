using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using SmartElderlyCare.Domain.Common;

namespace SmartElderlyCare.Domain.Entities;

public class EmployeeElderlyAssignment : BaseEntity, IAuditableEntity
{
    public int EmployeeId { get; set; }
    public int ElderlyId { get; set; }
    public DateTime AssignedDate { get; set; }
    public DateTime? EndDate { get; set; }
    public bool IsPrimary { get; set; }

    // Audit properties
    public string CreatedBy { get; set; } = string.Empty;
    public string? UpdatedBy { get; set; }

    // Navigation properties
    public virtual User Employee { get; set; } = null!;
    public virtual Elderly Elderly { get; set; } = null!;
}