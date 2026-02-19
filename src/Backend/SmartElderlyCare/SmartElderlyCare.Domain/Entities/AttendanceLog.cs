using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using SmartElderlyCare.Domain.Common;

namespace SmartElderlyCare.Domain.Entities;

public class AttendanceLog : BaseEntity
{
    public int EmployeeId { get; set; }
    public DateTime LoginTime { get; set; }
    public DateTime? LogoutTime { get; set; }
    public DateOnly LogDate => DateOnly.FromDateTime(LoginTime);

    // Navigation property
    public virtual User Employee { get; set; } = null!;
}