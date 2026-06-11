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

        // Apply timeout from settings, fallback to 30 seconds
        _httpClient.Timeout = TimeSpan.FromSeconds(_settings.TimeoutSeconds > 0 ? _settings.TimeoutSeconds : 30);

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
        if (string.IsNullOrEmpty(generatedText))
            return string.Empty;

        return generatedText.Trim();
    }

    /// <summary>
    /// Generate fallback report when AI is unavailable
    /// </summary>
    private string GenerateFallbackReport(ReportGenerationRequest request)
    {
        var sb = new StringBuilder();
        var elderlyName = request.ElderlyName;

        sb.AppendLine("## DAILY CARE REPORT");
        sb.AppendLine();
        sb.AppendLine($"**Resident:** {elderlyName}  ");
        sb.AppendLine($"**Date:** {request.ReportDate:MMMM d, yyyy}  ");
        sb.AppendLine($"**Shift:** Daily Summary  ");
        sb.AppendLine($"**Prepared By:** Healthcare Assistant  ");
        sb.AppendLine();
        sb.AppendLine("***");
        sb.AppendLine();
        sb.AppendLine("### 1. SUMMARY");
        sb.AppendLine();

        var meals = request.HealthMetrics.Where(m => m.MetricType.Equals("Meal", StringComparison.OrdinalIgnoreCase)).ToList();
        var medications = request.HealthMetrics.Where(m => m.MetricType.Equals("Medication", StringComparison.OrdinalIgnoreCase)).ToList();
        var activities = request.HealthMetrics.Where(m => m.MetricType.Equals("Activity", StringComparison.OrdinalIgnoreCase)).ToList();
        var vitals = request.HealthMetrics.Where(m => m.MetricType.Equals("Vital", StringComparison.OrdinalIgnoreCase) || m.MetricType.Equals("Vitals", StringComparison.OrdinalIgnoreCase)).ToList();
        var symptoms = request.HealthMetrics.Where(m => m.MetricType.Equals("Symptom", StringComparison.OrdinalIgnoreCase) || m.MetricType.Equals("Symptoms", StringComparison.OrdinalIgnoreCase)).ToList();
        var mood = request.HealthMetrics.FirstOrDefault(m => m.MetricType.Equals("Mood", StringComparison.OrdinalIgnoreCase));

        // Generate dynamic summary text based on vitals anomalies
        var criticalVitalsList = new List<string>();
        foreach (var v in vitals)
        {
            var vName = v.MetricName.ToLower();
            if (vName.Contains("blood pressure") || vName.Contains("bp"))
            {
                var parts = v.MetricValue.Split('/');
                if (parts.Length == 2 && int.TryParse(parts[0], out int sys) && int.TryParse(parts[1], out int dia))
                {
                    if (sys >= 160 || dia >= 100 || sys <= 85 || dia <= 50) criticalVitalsList.Add("Blood Pressure");
                }
            }
            if ((vName.Contains("oxygen") || vName.Contains("spo2")) && int.TryParse(v.MetricValue, out int o2Val) && o2Val <= 92)
            {
                criticalVitalsList.Add("Oxygen Saturation (SpO2)");
            }
            if ((vName.Contains("heart rate") || vName.Contains("hr") || vName.Contains("pulse")) && int.TryParse(v.MetricValue, out int hrVal) && (hrVal >= 120 || hrVal <= 50))
            {
                criticalVitalsList.Add("Heart Rate");
            }
        }

        var summaryText = $"Overall, {elderlyName} was stable today. All recorded signs and activities have been documented below.";
        if (criticalVitalsList.Any())
        {
            summaryText = $"Overall, {elderlyName} was monitored closely today. Critical vital sign changes in {string.Join(", ", criticalVitalsList)} require immediate clinical review and verification.";
        }

        sb.AppendLine(summaryText);
        sb.AppendLine();
        sb.AppendLine("***");
        sb.AppendLine();
        sb.AppendLine("### 2. MEDICATIONS");
        sb.AppendLine();
        if (medications.Any())
        {
            foreach (var med in medications)
            {
                var medName = med.MetricName;
                var medVal = med.MetricValue;
                var medTime = med.RecordedTime.ToString(@"hh\:mm");
                sb.AppendLine($"- **{medName}**: {medVal} (Recorded at {medTime})");
            }
        }
        else
        {
            sb.AppendLine("No medication logs recorded for this shift.");
        }
        sb.AppendLine();
        sb.AppendLine("***");
        sb.AppendLine();
        sb.AppendLine("### 3. MEALS");
        sb.AppendLine();
        if (meals.Any())
        {
            foreach (var meal in meals)
            {
                var mName = meal.MetricName;
                var mVal = meal.MetricValue;
                var mTime = meal.RecordedTime.ToString(@"hh\:mm");
                sb.AppendLine($"- **{mName}**: {mVal} (Recorded at {mTime})");
            }
        }
        else
        {
            sb.AppendLine("No nutrition logs recorded for this shift.");
        }
        sb.AppendLine();
        sb.AppendLine("***");
        sb.AppendLine();
        sb.AppendLine("### 4. ACTIVITIES");
        sb.AppendLine();
        if (activities.Any())
        {
            foreach (var act in activities)
            {
                var aName = act.MetricName;
                var aVal = act.MetricValue;
                var aUnit = act.Unit;
                var aTime = act.RecordedTime.ToString(@"hh\:mm");
                sb.AppendLine($"- **{aName}**: {aVal} {aUnit} (Recorded at {aTime})");
            }
        }
        else
        {
            sb.AppendLine("No activity logs recorded for this shift.");
        }
        sb.AppendLine();
        sb.AppendLine("***");
        sb.AppendLine();
        sb.AppendLine("### 5. OBSERVATIONS");
        sb.AppendLine();

        var obsLines = new List<string>();
        if (vitals.Any())
        {
            var vitalDetails = new List<string>();
            foreach (var v in vitals)
            {
                vitalDetails.Add($"{v.MetricName} of {v.MetricValue} {v.Unit} (at {v.RecordedTime:hh\\:mm})");
            }
            obsLines.Add($"- **Vitals Monitored**: {string.Join(", ", vitalDetails)}");
        }
        if (symptoms.Any())
        {
            var symptomDetails = new List<string>();
            foreach (var s in symptoms)
            {
                symptomDetails.Add($"{s.MetricName}: {s.MetricValue} {s.Unit} (at {s.RecordedTime:hh\\:mm})");
            }
            obsLines.Add($"- **Symptoms Reported**: {string.Join(", ", symptomDetails)}");
        }
        if (mood != null)
        {
            obsLines.Add($"- **Mood Rating**: {mood.MetricValue}/10");
        }
        if (!string.IsNullOrEmpty(request.AdditionalNotes))
        {
            obsLines.Add($"- **Caregiver Notes**: {request.AdditionalNotes}");
        }

        if (obsLines.Any())
        {
            foreach (var line in obsLines)
            {
                sb.AppendLine(line);
            }
        }
        else
        {
            sb.AppendLine("No clinical observations recorded.");
        }

        sb.AppendLine();
        sb.AppendLine("***");
        sb.AppendLine();
        sb.AppendLine("### 6. RECOMMENDATIONS FOR NEXT SHIFT");
        sb.AppendLine();

        var recs = new List<string>();
        if (criticalVitalsList.Any())
        {
            recs.Add("1. **Immediate Vital Sign Re-assessment**: Re-measure out-of-range parameters immediately using secondary equipment.");
            recs.Add("2. **Routine Clinical Monitoring**: Monitor the resident closely and record vitals hourly until stabilized.");
            recs.Add("3. **Escalation**: Notify the nurse supervisor or primary care doctor if parameters do not stabilize.");
        }
        else
        {
            recs.Add("1. **Routine Care Continuation**: Continue standard daily routine logs, medication scheduling, and hydration checks.");
            recs.Add("2. **Activity Engagement**: Encourage mild physical movement and standard meals.");
        }

        foreach (var rec in recs)
        {
            sb.AppendLine(rec);
        }

        return sb.ToString();
    }

    #endregion
}