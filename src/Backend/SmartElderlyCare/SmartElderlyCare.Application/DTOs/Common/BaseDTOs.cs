using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SmartElderlyCare.Application.DTOs.Common;

/// <summary>
/// Base DTO with common properties
/// </summary>
public class BaseDto
{
    public int Id { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

/// <summary>
/// Base DTO for audit-enabled entities
/// </summary>
public class AuditableDto : BaseDto
{
    public string CreatedBy { get; set; } = string.Empty;
    public string? UpdatedBy { get; set; }
}

/// <summary>
/// Base DTO for soft-deletable entities
/// </summary>
public class SoftDeleteDto : AuditableDto
{
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
}