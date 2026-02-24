using System.Text.Json.Serialization;

namespace SmartElderlyCare.Application.DTOs.Gemini;

/// <summary>
/// Request for Gemini API - Matches the curl command structure
/// </summary>
public class GeminiRequest
{
    [JsonPropertyName("contents")]
    public List<GeminiContent> Contents { get; set; } = new();

    [JsonPropertyName("generationConfig")]
    public GeminiGenerationConfig? GenerationConfig { get; set; }
}

public class GeminiContent
{
    [JsonPropertyName("parts")]
    public List<GeminiPart> Parts { get; set; } = new();
}

public class GeminiPart
{
    [JsonPropertyName("text")]
    public string Text { get; set; } = string.Empty;
}

public class GeminiGenerationConfig
{
    [JsonPropertyName("maxOutputTokens")]
    public int MaxOutputTokens { get; set; } = 800;

    [JsonPropertyName("temperature")]
    public double Temperature { get; set; } = 0.7;
}

/// <summary>
/// Response from Gemini API
/// </summary>
public class GeminiResponse
{
    [JsonPropertyName("candidates")]
    public List<GeminiCandidate> Candidates { get; set; } = new();
}

public class GeminiCandidate
{
    [JsonPropertyName("content")]
    public GeminiResponseContent Content { get; set; } = new();

    [JsonPropertyName("finishReason")]
    public string FinishReason { get; set; } = string.Empty;
}

public class GeminiResponseContent
{
    [JsonPropertyName("parts")]
    public List<GeminiResponsePart> Parts { get; set; } = new();
}

public class GeminiResponsePart
{
    [JsonPropertyName("text")]
    public string Text { get; set; } = string.Empty;
}

/// <summary>
/// Report generation request from our system
/// </summary>
public class ReportGenerationRequest
{
    public int EmployeeId { get; set; }
    public int ElderlyId { get; set; }
    public string ElderlyName { get; set; } = string.Empty;
    public DateTime ReportDate { get; set; }
    public List<HealthMetricInput> HealthMetrics { get; set; } = new();
    public string? AdditionalNotes { get; set; }
}

/// <summary>
/// Health metric input for AI processing
/// </summary>
public class HealthMetricInput
{
    public string MetricType { get; set; } = string.Empty; // Meal, Medication, Activity, Mood, Vital, Symptom
    public string MetricName { get; set; } = string.Empty;
    public string MetricValue { get; set; } = string.Empty;
    public string? Unit { get; set; }
    public string? Notes { get; set; }
    public TimeSpan RecordedTime { get; set; }
}

/// <summary>
/// Health alert from AI detection
/// </summary>
public class HealthAlertDto
{
    public int ElderlyId { get; set; }
    public string ElderlyName { get; set; } = string.Empty;
    public string AlertType { get; set; } = string.Empty;
    public string Severity { get; set; } = string.Empty; // High, Medium, Low
    public string Message { get; set; } = string.Empty;
    public DateTime DetectedAt { get; set; }
    public string? Recommendation { get; set; }
}

/// <summary>
/// Pattern detection request
/// </summary>
public class PatternDetectionRequest
{
    public int ElderlyId { get; set; }
    public string ElderlyName { get; set; } = string.Empty;
    public List<ReportGenerationRequest> RecentReports { get; set; } = new();
}