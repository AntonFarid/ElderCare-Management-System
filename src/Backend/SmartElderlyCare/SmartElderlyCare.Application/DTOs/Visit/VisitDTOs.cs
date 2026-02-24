using SmartElderlyCare.Application.DTOs.Common;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SmartElderlyCare.Application.DTOs.Visit;

/// <summary>
/// Visit request DTO
/// </summary>
public class VisitRequestDto : BaseDto
{
    public int FamilyMemberId { get; set; }
    public string FamilyMemberName { get; set; } = string.Empty;
    public int ElderlyId { get; set; }
    public string ElderlyName { get; set; } = string.Empty;
    public DateTime RequestedDate { get; set; }
    public TimeSpan RequestedTime { get; set; }
    public int DurationMinutes { get; set; }
    public string Status { get; set; } = string.Empty;
    public int? ApprovedById { get; set; }
    public string? ApprovedByName { get; set; }
    public DateTime? ApprovedDate { get; set; }
    public string? Notes { get; set; }
    public string? RejectionReason { get; set; }
}

/// <summary>
/// Create visit request DTO (family member action)
/// </summary>
public class CreateVisitRequestDto
{
    [Required(ErrorMessage = "Elderly ID is required")]
    public int ElderlyId { get; set; }

    [Required(ErrorMessage = "Visit date is required")]
    [FutureDate(ErrorMessage = "Visit date must be in the future")]
    public DateTime RequestedDate { get; set; }

    [Required(ErrorMessage = "Visit time is required")]
    public TimeSpan RequestedTime { get; set; }

    [Required(ErrorMessage = "Duration is required")]
    [Range(15, 480, ErrorMessage = "Duration must be between 15 minutes and 8 hours")]
    public int DurationMinutes { get; set; }

    public string? Notes { get; set; }
}


/// <summary>
/// Future date validation attribute
/// </summary>
public class FutureDateAttribute : ValidationAttribute
{
    public override bool IsValid(object? value)
    {
        if (value is DateTime date)
        {
            return date.Date >= DateTime.Today;
        }
        return false;
    }
}