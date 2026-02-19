using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using SmartElderlyCare.Domain.Entities;
using SmartElderlyCare.Domain.Enums;

namespace SmartElderlyCare.Domain.Interfaces;

public interface IDailyReportRepository : IGenericRepository<DailyReport>
{
    Task<IEnumerable<DailyReport>> GetReportsByEmployeeAsync(int employeeId, DateTime startDate, DateTime endDate);
    Task<IEnumerable<DailyReport>> GetReportsByElderlyAsync(int elderlyId, DateTime startDate, DateTime endDate);
    Task<IEnumerable<DailyReport>> GetPendingReportsForTeamLeaderAsync(int teamLeaderId);
    Task<IEnumerable<DailyReport>> GetReportsByStatusAsync(ApprovalStatus status);
}