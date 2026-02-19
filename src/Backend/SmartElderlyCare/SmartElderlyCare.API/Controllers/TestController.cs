using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SmartElderlyCare.Application.Wrappers;
using SmartElderlyCare.Domain.Entities;
using SmartElderlyCare.Domain.Interfaces;

namespace SmartElderlyCare.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TestController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<TestController> _logger;

    public TestController(IUnitOfWork unitOfWork, ILogger<TestController> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    [HttpGet("test-repository")]
    public async Task<IActionResult> TestRepository()
    {
        try
        {
            // Test Generic Repository
            var elderlyRepo = _unitOfWork.Repository<Elderly>();
            var allElderly = await elderlyRepo.GetAllAsync();

            // Test Specific Repository
            var dailyReportRepo = _unitOfWork.Repository<DailyReport>() as IDailyReportRepository;

            return Ok(new Response<object>
            {
                Succeeded = true,
                Message = "Repository pattern working correctly",
                Data = new
                {
                    ElderlyCount = allElderly.Count(),
                    Message = "Database connection successful"
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error testing repository");
            return StatusCode(500, new Response<string>
            {
                Succeeded = false,
                Message = "Error testing repository",
                Errors = new List<string> { ex.Message }
            });
        }
    }
}