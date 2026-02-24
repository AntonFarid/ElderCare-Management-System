using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartElderlyCare.Application.Common.Settings;
using SmartElderlyCare.Application.DTOs.Gemini;
using SmartElderlyCare.Application.Interfaces;
using SmartElderlyCare.Application.Wrappers;

namespace SmartElderlyCare.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class GeminiTestController : ControllerBase
{
    private readonly IGeminiService _geminiService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<GeminiTestController> _logger;

    public GeminiTestController(
        IGeminiService geminiService,
        IConfiguration configuration,
        ILogger<GeminiTestController> logger)
    {
        _geminiService = geminiService;
        _configuration = configuration;
        _logger = logger;
    }

    /// <summary>
    /// Test the Gemini API connection
    /// </summary>
    [HttpGet("test-connection")]
    public async Task<IActionResult> TestConnection()
    {
        var response = await _geminiService.TestConnectionAsync();
        return Ok(response);
    }

    /// <summary>
    /// Test report generation with sample data
    /// </summary>
    [HttpPost("test-report")]
    public async Task<IActionResult> TestReportGeneration()
    {
        var request = new ReportGenerationRequest
        {
            EmployeeId = 1,
            ElderlyId = 1,
            ElderlyName = "John Smith",
            ReportDate = DateTime.Today,
            HealthMetrics = new List<HealthMetricInput>
            {
                new HealthMetricInput
                {
                    MetricType = "Meal",
                    MetricName = "Breakfast",
                    MetricValue = "75%",
                    Notes = "Ate most of breakfast, left some cereal",
                    RecordedTime = new TimeSpan(8, 30, 0)
                },
                new HealthMetricInput
                {
                    MetricType = "Medication",
                    MetricName = "Blood Pressure Medicine",
                    MetricValue = "Taken",
                    Notes = "Taken with food as instructed",
                    RecordedTime = new TimeSpan(9, 0, 0)
                },
                new HealthMetricInput
                {
                    MetricType = "Activity",
                    MetricName = "Morning Walk",
                    MetricValue = "20",
                    Unit = "minutes",
                    Notes = "Walked in garden, good mobility",
                    RecordedTime = new TimeSpan(10, 15, 0)
                },
                new HealthMetricInput
                {
                    MetricType = "Vital",
                    MetricName = "Blood Pressure",
                    MetricValue = "128/82",
                    Unit = "mmHg",
                    RecordedTime = new TimeSpan(9, 30, 0)
                },
                new HealthMetricInput
                {
                    MetricType = "Mood",
                    MetricName = "Mood",
                    MetricValue = "Good",
                    Notes = "Cheerful and engaged",
                    RecordedTime = new TimeSpan(10, 30, 0)
                }
            },
            AdditionalNotes = "Resident was in good spirits today. Enjoyed talking about his family."
        };

        var response = await _geminiService.GenerateDailyReportAsync(request);
        return Ok(response);
    }

    /// <summary>
    /// Test pattern detection with sample data
    /// </summary>
    [HttpPost("test-patterns")]
    public async Task<IActionResult> TestPatternDetection()
    {
        // Create sample data for last 7 days
        var reports = new List<ReportGenerationRequest>();
        var random = new Random();

        for (int i = 7; i >= 1; i--)
        {
            reports.Add(new ReportGenerationRequest
            {
                ElderlyId = 1,
                ElderlyName = "John Smith",
                ReportDate = DateTime.Today.AddDays(-i),
                HealthMetrics = new List<HealthMetricInput>
                {
                    new HealthMetricInput
                    {
                        MetricType = "Meal",
                        MetricName = "Breakfast",
                        MetricValue = $"{random.Next(60, 100)}%",
                        RecordedTime = new TimeSpan(8, 30, 0)
                    },
                    new HealthMetricInput
                    {
                        MetricType = "Medication",
                        MetricName = "Blood Pressure Medicine",
                        MetricValue = random.Next(0, 10) > 2 ? "Taken" : "Missed",
                        RecordedTime = new TimeSpan(9, 0, 0)
                    },
                    new HealthMetricInput
                    {
                        MetricType = "Activity",
                        MetricName = "Walking",
                        MetricValue = random.Next(10, 30).ToString(),
                        Unit = "minutes",
                        RecordedTime = new TimeSpan(10, 0, 0)
                    },
                    new HealthMetricInput
                    {
                        MetricType = "Mood",
                        MetricName = "Mood",
                        MetricValue = random.Next(0, 10) > 3 ? "Good" : "Fair",
                        RecordedTime = new TimeSpan(10, 30, 0)
                    }
                }
            });
        }

        var request = new PatternDetectionRequest
        {
            ElderlyId = 1,
            ElderlyName = "John Smith",
            RecentReports = reports
        };

        var response = await _geminiService.DetectHealthPatternsAsync(request);
        return Ok(response);
    }

    /// <summary>
    /// Diagnostic endpoint to check configuration
    /// </summary>
    [HttpGet("diagnose")]
    public IActionResult Diagnose()
    {
        var settings = _configuration.GetSection("GeminiSettings").Get<GeminiSettings>();

        if (settings == null)
        {
            return BadRequest(new { Error = "GeminiSettings not found in configuration" });
        }

        return Ok(new
        {
            ApiKeyPresent = !string.IsNullOrEmpty(settings.ApiKey),
            ApiKeyLength = settings.ApiKey?.Length ?? 0,
            ApiKeyPrefix = settings.ApiKey?.Length >= 6 ? settings.ApiKey.Substring(0, 6) + "..." : "Too short",
            Model = settings.Model,
            MaxTokens = settings.MaxTokens,
            Temperature = settings.Temperature,
            TimeoutSeconds = settings.TimeoutSeconds
        });
    }
}