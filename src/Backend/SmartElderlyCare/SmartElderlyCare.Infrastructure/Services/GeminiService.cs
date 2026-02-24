using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SmartElderlyCare.Application.Common.Settings;
using SmartElderlyCare.Application.DTOs.Gemini;
using SmartElderlyCare.Application.Interfaces;
using SmartElderlyCare.Application.Wrappers;

namespace SmartElderlyCare.Infrastructure.Services;

/// <summary>
/// Google Gemini AI service implementation
/// Matches the exact curl command format provided
/// </summary>
public class GeminiService : IGeminiService
{
    private readonly HttpClient _httpClient;
    private readonly GeminiSettings _settings;
    private readonly ILogger<GeminiService> _logger;
    private readonly JsonSerializerOptions _jsonOptions;

    // Base URL for Gemini API - using v1beta as in the curl command
    private const string GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/";

    public GeminiService(
        HttpClient httpClient,
        IOptions<GeminiSettings> settings,
        ILogger<GeminiService> logger)
    {
        _httpClient = httpClient;
        _settings = settings.Value;
        _logger = logger;

        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
        };

        _logger.LogInformation($"GeminiService initialized with Model: {_settings.Model}, API Key length: {_settings.ApiKey?.Length ?? 0}");
    }

    /// <summary>
    /// Generate a professional daily report
    /// </summary>
    public async Task<Response<string>> GenerateDailyReportAsync(ReportGenerationRequest request)
    {
        try
        {
            _logger.LogInformation($"Generating daily report for elderly {request.ElderlyId}");

            var prompt = ConstructReportPrompt(request);
            var response = await CallGeminiApiAsync(prompt);

            if (string.IsNullOrEmpty(response))
            {
                _logger.LogWarning("Gemini API returned empty response, using fallback");
                return new Response<string>(GenerateFallbackReport(request), "Report generated using fallback template");
            }

            var formattedReport = FormatGeneratedReport(response, request);
            return new Response<string>(formattedReport, "Report generated successfully by Gemini AI");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating report with Gemini");
            var fallback = GenerateFallbackReport(request);
            return new Response<string>(fallback, "Report generated using fallback template (AI service error)");
        }
    }

    /// <summary>
    /// Detect health patterns and generate alerts
    /// </summary>
    public async Task<Response<List<HealthAlertDto>>> DetectHealthPatternsAsync(PatternDetectionRequest request)
    {
        try
        {
            _logger.LogInformation($"Detecting health patterns for elderly {request.ElderlyId}");

            if (request.RecentReports.Count < 3)
            {
                return new Response<List<HealthAlertDto>>(new List<HealthAlertDto>(), "Insufficient data for pattern detection (need at least 3 reports)");
            }

            var prompt = ConstructPatternDetectionPrompt(request.ElderlyName, request.RecentReports);
            var response = await CallGeminiApiAsync(prompt);

            if (string.IsNullOrEmpty(response))
            {
                return new Response<List<HealthAlertDto>>(new List<HealthAlertDto>(), "Pattern detection completed - no alerts generated");
            }

            var alerts = ParseAlertsFromResponse(response, request.ElderlyId, request.ElderlyName);
            return new Response<List<HealthAlertDto>>(alerts, $"Detected {alerts.Count} potential health patterns");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error detecting health patterns with Gemini");
            return new Response<List<HealthAlertDto>>(new List<HealthAlertDto>(), "Pattern detection unavailable due to error");
        }
    }

    /// <summary>
    /// Simple test method to verify API connectivity
    /// </summary>
    public async Task<Response<string>> TestConnectionAsync()
    {
        try
        {
            _logger.LogInformation("Testing Gemini API connection");

            var testPrompt = "Say 'Gemini AI is working correctly' in one sentence.";
            var response = await CallGeminiApiAsync(testPrompt);

            if (string.IsNullOrEmpty(response))
            {
                return new Response<string> { Data = "Failed to get response from Gemini API", Succeeded = false };
            }

            return new Response<string>(response, "Gemini API connection successful");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error testing Gemini connection");
            return new Response<string> { Data = $"Connection test failed: {ex.Message}", Succeeded = false };
        }
    }

    #region Private Methods - API Call

    /// <summary>
    /// Call Gemini API with the exact format from the curl command
    /// </summary>
    private async Task<string> CallGeminiApiAsync(string prompt)
    {
        try
        {
            // Build URL exactly like the curl command: /v1beta/models/{model}:generateContent
            var url = $"{GEMINI_API_URL}{_settings.Model}:generateContent";

            _logger.LogDebug($"Calling Gemini API at: {url}");

            // Build request exactly matching the curl command structure
            var request = new GeminiRequest
            {
                Contents = new List<GeminiContent>
                {
                    new GeminiContent
                    {
                        Parts = new List<GeminiPart>
                        {
                            new GeminiPart { Text = prompt }
                        }
                    }
                },
                GenerationConfig = new GeminiGenerationConfig
                {
                    MaxOutputTokens = _settings.MaxTokens,
                    Temperature = _settings.Temperature
                }
            };

            var jsonRequest = JsonSerializer.Serialize(request, _jsonOptions);
            _logger.LogDebug($"Request body: {jsonRequest}");

            // Create HTTP request with API key in header (X-goog-api-key) exactly like curl
            var httpRequest = new HttpRequestMessage(HttpMethod.Post, url);
            httpRequest.Headers.Add("X-goog-api-key", _settings.ApiKey);
            httpRequest.Content = new StringContent(jsonRequest, Encoding.UTF8, "application/json");

            // Send request
            var response = await _httpClient.SendAsync(httpRequest);

            // Read response
            var responseContent = await response.Content.ReadAsStringAsync();

            _logger.LogInformation($"Gemini API Response Status: {(int)response.StatusCode} {response.StatusCode}");

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError($"Gemini API error: {response.StatusCode} - {responseContent}");

                // Try to parse error message for better diagnostics
                try
                {
                    var errorObj = JsonSerializer.Deserialize<Dictionary<string, object>>(responseContent);
                    if (errorObj != null && errorObj.ContainsKey("error"))
                    {
                        var error = errorObj["error"].ToString();
                        _logger.LogError($"Gemini error details: {error}");
                    }
                }
                catch { }

                return string.Empty;
            }

            // Parse successful response
            var geminiResponse = JsonSerializer.Deserialize<GeminiResponse>(responseContent, _jsonOptions);

            var generatedText = geminiResponse?.Candidates?
                .FirstOrDefault()?.Content?
                .Parts?.FirstOrDefault()?.Text ?? string.Empty;

            _logger.LogInformation($"Successfully generated response of length: {generatedText.Length}");

            return generatedText;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Exception in CallGeminiApiAsync");
            return string.Empty;
        }
    }

    #endregion

    #region Private Methods - Prompt Construction

    /// <summary>
    /// Construct prompt for report generation
    /// </summary>
    private string ConstructReportPrompt(ReportGenerationRequest request)
    {
        var sb = new StringBuilder();

        sb.AppendLine("You are a professional healthcare assistant. Generate a detailed daily care report in a professional format.");
        sb.AppendLine();
        sb.AppendLine($"RESIDENT: {request.ElderlyName}");
        sb.AppendLine($"DATE: {request.ReportDate:MMMM d, yyyy}");
        sb.AppendLine();
        sb.AppendLine("HEALTH METRICS FOR TODAY:");

        foreach (var metric in request.HealthMetrics.OrderBy(m => m.RecordedTime))
        {
            var timeStr = metric.RecordedTime.ToString(@"hh\:mm");
            var valueStr = string.IsNullOrEmpty(metric.Unit)
                ? metric.MetricValue
                : $"{metric.MetricValue} {metric.Unit}";

            sb.AppendLine($"- {timeStr}: {metric.MetricName} - {valueStr}");

            if (!string.IsNullOrEmpty(metric.Notes))
            {
                sb.AppendLine($"  Note: {metric.Notes}");
            }
        }

        if (!string.IsNullOrEmpty(request.AdditionalNotes))
        {
            sb.AppendLine();
            sb.AppendLine($"ADDITIONAL NOTES: {request.AdditionalNotes}");
        }

        sb.AppendLine();
        sb.AppendLine("Please generate a professional report with the following sections:");
        sb.AppendLine("1. SUMMARY - Overall condition and mood");
        sb.AppendLine("2. MEDICATIONS - Adherence and observations");
        sb.AppendLine("3. MEALS - Consumption and appetite");
        sb.AppendLine("4. ACTIVITIES - Engagement and mobility");
        sb.AppendLine("5. OBSERVATIONS - Any notable changes or concerns");
        sb.AppendLine("6. RECOMMENDATIONS - Suggestions for next shift");
        sb.AppendLine();
        sb.AppendLine("Format the report professionally with clear section headers. Use a warm but professional tone.");

        return sb.ToString();
    }

    /// <summary>
    /// Construct prompt for pattern detection
    /// </summary>
    private string ConstructPatternDetectionPrompt(string elderlyName, List<ReportGenerationRequest> reports)
    {
        var sb = new StringBuilder();

        sb.AppendLine("You are a healthcare analytics expert. Analyze these daily reports and identify any health patterns or concerns.");
        sb.AppendLine();
        sb.AppendLine($"RESIDENT: {elderlyName}");
        sb.AppendLine($"ANALYSIS PERIOD: Last {reports.Count} days");
        sb.AppendLine();
        sb.AppendLine("DAILY REPORTS:");

        foreach (var report in reports.OrderBy(r => r.ReportDate))
        {
            sb.AppendLine($"\n--- {report.ReportDate:yyyy-MM-dd} ---");
            foreach (var metric in report.HealthMetrics)
            {
                sb.AppendLine($"{metric.MetricType}: {metric.MetricName} = {metric.MetricValue} {metric.Unit}");
            }
        }

        sb.AppendLine();
        sb.AppendLine("Based on this data, identify and list any:");
        sb.AppendLine("1. Declining trends (reduced appetite, lower activity, etc.)");
        sb.AppendLine("2. Recurring symptoms or issues");
        sb.AppendLine("3. Medication adherence problems");
        sb.AppendLine("4. Unusual patterns that need attention");
        sb.AppendLine();
        sb.AppendLine("For each concern found, provide:");
        sb.AppendLine("- The specific issue detected");
        sb.AppendLine("- Severity level (High/Medium/Low)");
        sb.AppendLine("- A brief recommendation");
        sb.AppendLine();
        sb.AppendLine("If no concerns are found, simply state 'No significant patterns detected'.");

        return sb.ToString();
    }

    /// <summary>
    /// Parse alerts from Gemini response
    /// </summary>
    private List<HealthAlertDto> ParseAlertsFromResponse(string response, int elderlyId, string elderlyName)
    {
        var alerts = new List<HealthAlertDto>();

        if (string.IsNullOrEmpty(response) || response.Contains("No significant patterns detected"))
            return alerts;

        var lines = response.Split('\n', StringSplitOptions.RemoveEmptyEntries);
        HealthAlertDto? currentAlert = null;

        foreach (var line in lines)
        {
            var trimmedLine = line.Trim();

            if (trimmedLine.Contains("High") || trimmedLine.Contains("Medium") || trimmedLine.Contains("Low"))
            {
                // New alert detected
                if (currentAlert != null)
                    alerts.Add(currentAlert);

                currentAlert = new HealthAlertDto
                {
                    ElderlyId = elderlyId,
                    ElderlyName = elderlyName,
                    AlertType = "Health Pattern Detected",
                    DetectedAt = DateTime.UtcNow
                };

                // Try to determine severity
                if (trimmedLine.Contains("High")) currentAlert.Severity = "High";
                else if (trimmedLine.Contains("Medium")) currentAlert.Severity = "Medium";
                else currentAlert.Severity = "Low";

                currentAlert.Message = trimmedLine;
            }
            else if (currentAlert != null && trimmedLine.Contains("Recommend"))
            {
                currentAlert.Recommendation = trimmedLine;
            }
            else if (currentAlert != null && !string.IsNullOrEmpty(trimmedLine))
            {
                currentAlert.Message += " " + trimmedLine;
            }
        }

        if (currentAlert != null)
            alerts.Add(currentAlert);

        return alerts;
    }

    /// <summary>
    /// Format the generated report
    /// </summary>
    private string FormatGeneratedReport(string generatedText, ReportGenerationRequest request)
    {
        // Clean up any markdown or extra spaces
        var report = generatedText
            .Replace("**", "")
            .Replace("##", "")
            .Replace("  ", " ")
            .Trim();

        return report;
    }

    /// <summary>
    /// Generate fallback report when AI is unavailable
    /// </summary>
    private string GenerateFallbackReport(ReportGenerationRequest request)
    {
        var sb = new StringBuilder();

        sb.AppendLine("DAILY CARE REPORT");
        sb.AppendLine("=================");
        sb.AppendLine();
        sb.AppendLine($"Resident: {request.ElderlyName}");
        sb.AppendLine($"Date: {request.ReportDate:MMMM d, yyyy}");
        sb.AppendLine();
        sb.AppendLine("SUMMARY");
        sb.AppendLine("-------");

        var meals = request.HealthMetrics.Where(m => m.MetricType == "Meal").ToList();
        var medications = request.HealthMetrics.Where(m => m.MetricType == "Medication").ToList();
        var activities = request.HealthMetrics.Where(m => m.MetricType == "Activity").ToList();
        var mood = request.HealthMetrics.FirstOrDefault(m => m.MetricType == "Mood");

        if (mood != null)
        {
            sb.AppendLine($"Mood: {mood.MetricValue}");
        }

        if (meals.Any())
        {
            sb.AppendLine();
            sb.AppendLine("MEALS");
            foreach (var meal in meals)
            {
                sb.AppendLine($"- {meal.MetricName}: {meal.MetricValue} at {meal.RecordedTime:hh\\:mm}");
            }
        }

        if (medications.Any())
        {
            sb.AppendLine();
            sb.AppendLine("MEDICATIONS");
            foreach (var med in medications)
            {
                sb.AppendLine($"- {med.MetricName}: {med.MetricValue} at {med.RecordedTime:hh\\:mm}");
            }
        }

        if (activities.Any())
        {
            sb.AppendLine();
            sb.AppendLine("ACTIVITIES");
            foreach (var activity in activities)
            {
                sb.AppendLine($"- {activity.MetricName}: {activity.MetricValue} {activity.Unit} at {activity.RecordedTime:hh\\:mm}");
            }
        }

        if (!string.IsNullOrEmpty(request.AdditionalNotes))
        {
            sb.AppendLine();
            sb.AppendLine("ADDITIONAL NOTES");
            sb.AppendLine(request.AdditionalNotes);
        }

        sb.AppendLine();
        sb.AppendLine("Note: This is a template-based report. AI-generated reports will be available when the service is connected.");

        return sb.ToString();
    }

    #endregion
}