using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
namespace SmartElderlyCare.Domain.Enums;

public enum UserType
{
    Admin = 1,
    TeamLeader = 2,
    Employee = 3,
    FamilyMember = 4
}

public enum ApprovalStatus
{
    Pending = 1,
    Approved = 2,
    Rejected = 3
}

public enum MetricType
{
    Meal = 1,
    Medication = 2,
    Activity = 3,
    Symptom = 4,
    Vital = 5,
    Mood = 6
}

public enum NotificationType
{
    HealthAlert = 1,
    ReportApproved = 2,
    ReportRejected = 3,
    VisitRequest = 4,
    ScheduleChange = 5,
    General = 6
}

public enum VisitStatus
{
    Pending = 1,
    Approved = 2,
    Rejected = 3,
    Cancelled = 4,
    Completed = 5
}

public enum ShiftType
{
    Morning = 1,    // 6 AM - 2 PM
    Afternoon = 2,  // 2 PM - 10 PM
    Night = 3,      // 10 PM - 6 AM
    Overnight = 4,   // 12 AM - 8 AM
    OffDay = 5       // For scheduled days off
}