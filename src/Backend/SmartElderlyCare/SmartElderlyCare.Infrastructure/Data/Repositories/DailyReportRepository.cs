using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SmartElderlyCare.Domain.Entities;
using SmartElderlyCare.Domain.Enums;
using SmartElderlyCare.Domain.Interfaces;
using SmartElderlyCare.Infrastructure.Data.Context;

namespace SmartElderlyCare.Infrastructure.Data.Repositories;

/// <summary>
/// Repository for DailyReport entity with specific queries
/// </summary>
public class DailyReportRepository : GenericRepository<DailyReport>, IDailyReportRepository
{
    public DailyReportRepository(ApplicationDbContext context) : base(context)
    {
    }

    /// <summary>
    /// Get reports by employee within date range
    /// </summary>
    public async Task<IEnumerable<DailyReport>> GetReportsByEmployeeAsync(
        int employeeId,
        DateTime startDate,
        DateTime endDate)
    {
        return await _context.DailyReports
            .Include(d => d.Elderly)
            .Include(d => d.HealthMetrics)
            .Where(d => d.EmployeeId == employeeId &&
                       d.ReportDate >= startDate &&
                       d.ReportDate <= endDate &&
                       !d.IsDeleted)
            .OrderByDescending(d => d.ReportDate)
            .ToListAsync();
    }

    /// <summary>
    /// Get reports by elderly within date range
    /// </summary>
    public async Task<IEnumerable<DailyReport>> GetReportsByElderlyAsync(
        int elderlyId,
        DateTime startDate,
        DateTime endDate)
    {
        return await _context.DailyReports
            .Include(d => d.Employee)
            .Include(d => d.HealthMetrics)
            .Where(d => d.ElderlyId == elderlyId &&
                       d.ReportDate >= startDate &&
                       d.ReportDate <= endDate &&
                       !d.IsDeleted)
            .OrderByDescending(d => d.ReportDate)
            .ToListAsync();
    }

    /// <summary>
    /// Get pending reports for team leader approval
    /// </summary>
    public async Task<IEnumerable<DailyReport>> GetPendingReportsForTeamLeaderAsync(int teamLeaderId)
    {
        // Team leaders can see pending reports for elderly under their supervision
        // This is a simplified version - actual implementation might need team leader's assigned elderly
        return await _context.DailyReports
            .Include(d => d.Employee)
            .Include(d => d.Elderly)
            .Include(d => d.HealthMetrics)
            .Where(d => d.ApprovalStatus == ApprovalStatus.Pending && !d.IsDeleted)
            .OrderBy(d => d.SubmissionDate)
            .ToListAsync();
    }

    /// <summary>
    /// Get reports by approval status
    /// </summary>
    public async Task<IEnumerable<DailyReport>> GetReportsByStatusAsync(ApprovalStatus status)
    {
        return await _context.DailyReports
            .Include(d => d.Employee)
            .Include(d => d.Elderly)
            .Where(d => d.ApprovalStatus == status && !d.IsDeleted)
            .OrderByDescending(d => d.SubmissionDate)
            .ToListAsync();
    }

    /// <summary>
    /// Override GetByIdAsync to include related entities
    /// </summary>
    public override async Task<DailyReport?> GetByIdAsync(int id)
    {
        return await _context.DailyReports
            .Include(d => d.Employee)
            .Include(d => d.Elderly)
            .Include(d => d.ApprovedBy)
            .Include(d => d.HealthMetrics)
            .FirstOrDefaultAsync(d => d.Id == id && !d.IsDeleted);
    }
}