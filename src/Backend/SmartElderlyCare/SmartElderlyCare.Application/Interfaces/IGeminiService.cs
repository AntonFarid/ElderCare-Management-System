using SmartElderlyCare.Application.DTOs.Gemini;
using SmartElderlyCare.Application.Wrappers;

namespace SmartElderlyCare.Application.Interfaces;

/// <summary>
/// Service interface for Google Gemini AI operations
/// </summary>
public interface IGeminiService
{
    /// <summary>
    /// Generate a professional daily report from health metrics
    /// </summary>
    Task<Response<string>> GenerateDailyReportAsync(ReportGenerationRequest request);

    /// <summary>
    /// Detect health patterns and generate alerts from historical data
    /// </summary>
    Task<Response<List<HealthAlertDto>>> DetectHealthPatternsAsync(PatternDetectionRequest request);

    /// <summary>
    /// Simple test method to verify API connectivity
    /// </summary>
    Task<Response<string>> TestConnectionAsync();
}