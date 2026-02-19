using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SmartElderlyCare.Domain.Entities;
using SmartElderlyCare.Domain.Interfaces;
using SmartElderlyCare.Infrastructure.Data.Context;

namespace SmartElderlyCare.Infrastructure.Data.Repositories;

/// <summary>
/// Repository for Elderly entity with specific queries
/// </summary>
public class ElderlyRepository : GenericRepository<Elderly>, IElderlyRepository
{
    public ElderlyRepository(ApplicationDbContext context) : base(context)
    {
    }

    /// <summary>
    /// Get elderly residents assigned to a specific employee
    /// </summary>
    public async Task<IEnumerable<Elderly>> GetElderlyByEmployeeAsync(int employeeId)
    {
        return await _context.EmployeeElderlyAssignments
            .Where(a => a.EmployeeId == employeeId && !a.IsDeleted)
            .Include(a => a.Elderly)
            .Select(a => a.Elderly)
            .Where(e => e.IsActive && !e.IsDeleted)
            .ToListAsync();
    }

    /// <summary>
    /// Get elderly residents linked to a family member
    /// </summary>
    public async Task<IEnumerable<Elderly>> GetElderlyByFamilyMemberAsync(int familyMemberId)
    {
        return await _context.ElderlyFamilyMembers
            .Where(f => f.FamilyMemberId == familyMemberId && !f.IsDeleted)
            .Include(f => f.Elderly)
            .Select(f => f.Elderly)
            .Where(e => e.IsActive && !e.IsDeleted)
            .ToListAsync();
    }

    /// <summary>
    /// Get all active elderly residents
    /// </summary>
    public async Task<IEnumerable<Elderly>> GetActiveElderlyAsync()
    {
        return await _context.Elderlies
            .Where(e => e.IsActive && !e.IsDeleted)
            .OrderBy(e => e.LastName)
            .ThenBy(e => e.FirstName)
            .ToListAsync();
    }

    /// <summary>
    /// Override GetByIdAsync to include related data
    /// </summary>
    public override async Task<Elderly?> GetByIdAsync(int id)
    {
        return await _context.Elderlies
            .Include(e => e.EmployeeAssignments)
                .ThenInclude(a => a.Employee)
            .Include(e => e.FamilyMembers)
                .ThenInclude(f => f.FamilyMember)
            .Include(e => e.DailyReports)
                .ThenInclude(d => d.HealthMetrics)
            .FirstOrDefaultAsync(e => e.Id == id && !e.IsDeleted);
    }
}