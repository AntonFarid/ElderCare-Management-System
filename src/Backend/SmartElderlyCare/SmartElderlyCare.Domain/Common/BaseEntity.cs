using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
namespace SmartElderlyCare.Domain.Common;

/// <summary>
/// Base entity with common properties for all domain entities
/// Implements soft delete pattern as per requirement
/// </summary>
public abstract class BaseEntity
{
    public int Id { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    // Soft delete properties - as approved in clarification
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
}

/// <summary>
/// Interface for entities that require audit logging
/// </summary>
public interface IAuditableEntity
{
    string CreatedBy { get; set; }
    string? UpdatedBy { get; set; }
}