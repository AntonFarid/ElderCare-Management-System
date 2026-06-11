using System.Text.Json.Serialization;

namespace SmartElderlyCare.Application.DTOs.AI;

public class HealthRiskInputDto
{
    [JsonPropertyName("elderly_id")]
    public int ElderlyId { get; set; }

    [JsonPropertyName("age")]
    public int Age { get; set; }

    [JsonPropertyName("heart_rate")]
    public int HeartRate { get; set; }

    [JsonPropertyName("systolic_bp")]
    public int SystolicBp { get; set; }

    [JsonPropertyName("diastolic_bp")]
    public int DiastolicBp { get; set; }

    [JsonPropertyName("blood_sugar")]
    public int BloodSugar { get; set; }

    [JsonPropertyName("body_temperature")]
    public double BodyTemperature { get; set; }

    [JsonPropertyName("mobility_score")]
    public int MobilityScore { get; set; }

    [JsonPropertyName("sleep_hours")]
    public double SleepHours { get; set; }

    [JsonPropertyName("missed_medications")]
    public int MissedMedications { get; set; }

    [JsonPropertyName("meals_eaten_percent")]
    public int MealsEatenPercent { get; set; }

    [JsonPropertyName("mood_score")]
    public int MoodScore { get; set; }

    [JsonPropertyName("oxygen_saturation")]
    public int OxygenSaturation { get; set; }

    [JsonPropertyName("respiratory_rate")]
    public int RespiratoryRate { get; set; }

    [JsonPropertyName("water_intake_ml")]
    public int WaterIntakeMl { get; set; }

    [JsonPropertyName("pain_level")]
    public int PainLevel { get; set; }
}

public class HealthRiskOutputDto
{
    [JsonPropertyName("elderly_id")]
    public int ElderlyId { get; set; }

    [JsonPropertyName("risk_level")]
    public string RiskLevel { get; set; } = string.Empty;

    [JsonPropertyName("confidence_score")]
    public double ConfidenceScore { get; set; }

    [JsonPropertyName("recommendation")]
    public string Recommendation { get; set; } = string.Empty;
}
