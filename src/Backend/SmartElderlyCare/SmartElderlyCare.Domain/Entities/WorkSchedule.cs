using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using SmartElderlyCare.Domain.Common;
using SmartElderlyCare.Domain.Enums;

namespace SmartElderlyCare.Domain.Entities;

public class WorkSchedule : BaseEntity
{
    public int EmployeeId { get; set; }
    public DateTime ShiftDate { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public ShiftType ShiftType { get; set; }
    public int CreatedById { get; set; }
    public int? UpdatedById { get; set; }
    public string? Notes { get; set; }

    // Navigation properties
    public virtual User Employee { get; set; } = null!;
    public new virtual User CreatedBy { get; set; } = null!;
    public new virtual User? UpdatedBy { get; set; }
}