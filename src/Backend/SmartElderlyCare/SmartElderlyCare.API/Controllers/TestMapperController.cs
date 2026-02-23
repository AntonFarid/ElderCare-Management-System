using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartElderlyCare.Application.DTOs.Elderly;
using SmartElderlyCare.Application.Wrappers;
using SmartElderlyCare.Domain.Entities;
using SmartElderlyCare.Domain.Interfaces;
using SmartElderlyCare.Infrastructure.Data.Context;

namespace SmartElderlyCare.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TestMapperController : ControllerBase
{
    private readonly IMapper _mapper;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ApplicationDbContext _context;
    private readonly ILogger<TestMapperController> _logger;

    public TestMapperController(
        IMapper mapper,
        IUnitOfWork unitOfWork,
        ApplicationDbContext context,
        ILogger<TestMapperController> logger)
    {
        _mapper = mapper;
        _unitOfWork = unitOfWork;
        _context = context;
        _logger = logger;
    }

    [HttpGet("test-elderly-mapping")]
    public async Task<IActionResult> TestElderlyMapping()
    {
        try
        {
            // Get first elderly from database
            var elderly = await _context.Elderlies
                .Include(e => e.EmployeeAssignments)
                    .ThenInclude(a => a.Employee)
                .Include(e => e.FamilyMembers)
                    .ThenInclude(f => f.FamilyMember)
                .Include(e => e.DailyReports)
                .FirstOrDefaultAsync();

            if (elderly == null)
            {
                return NotFound(new Response<string>("No elderly found in database"));
            }

            // Map to DTOs
            var elderlyDto = _mapper.Map<ElderlyDto>(elderly);
            var elderlyDetailDto = _mapper.Map<ElderlyDetailDto>(elderly);

            return Ok(new Response<object>
            {
                Succeeded = true,
                Data = new
                {
                    BasicDto = elderlyDto,
                    DetailedDto = elderlyDetailDto,
                    OriginalEntity = new
                    {
                        elderly.Id,
                        elderly.FirstName,
                        elderly.LastName,
                        AssignmentCount = elderly.EmployeeAssignments?.Count ?? 0,
                        FamilyCount = elderly.FamilyMembers?.Count ?? 0,
                        ReportCount = elderly.DailyReports?.Count ?? 0
                    }
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error testing mapper");
            return StatusCode(500, new Response<string>
            {
                Succeeded = false,
                Message = "Error testing mapper",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpPost("test-create-mapping")]
    public async Task<IActionResult> TestCreateMapping([FromBody] CreateElderlyDto createDto)
    {
        try
        {
            // Map CreateDto to Entity
            var elderly = _mapper.Map<Elderly>(createDto);

            // Set audit fields
            elderly.CreatedAt = DateTime.UtcNow;
            elderly.CreatedBy = User.Identity?.Name ?? "System";

            return Ok(new Response<object>
            {
                Succeeded = true,
                Data = new
                {
                    OriginalDto = createDto,
                    MappedEntity = new
                    {
                        elderly.FirstName,
                        elderly.LastName,
                        elderly.DateOfBirth,
                        elderly.RoomNumber,
                        elderly.EmergencyContact,
                        elderly.MedicalConditions,
                        elderly.Allergies,
                        elderly.DietaryRestrictions,
                        elderly.IsActive,
                        elderly.CreatedAt,
                        elderly.CreatedBy
                    }
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error testing create mapping");
            return StatusCode(500, new Response<string>
            {
                Succeeded = false,
                Message = "Error testing create mapping",
                Errors = new List<string> { ex.Message }
            });
        }
    }
}