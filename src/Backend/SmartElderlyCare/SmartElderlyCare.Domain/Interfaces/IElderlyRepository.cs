using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using SmartElderlyCare.Domain.Entities;

namespace SmartElderlyCare.Domain.Interfaces;

public interface IElderlyRepository : IGenericRepository<Elderly>
{
    Task<IEnumerable<Elderly>> GetElderlyByEmployeeAsync(int employeeId);
    Task<IEnumerable<Elderly>> GetElderlyByFamilyMemberAsync(int familyMemberId);
    Task<IEnumerable<Elderly>> GetActiveElderlyAsync();
}