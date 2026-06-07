using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace SmartElderlyCare.Application.DTOs.AI;

public class DietRecommendationInputDto
{
    [JsonPropertyName("elderly_id")]
    public int ElderlyId { get; set; }

    [JsonPropertyName("age")]
    public int Age { get; set; }

    [JsonPropertyName("medical_conditions")]
    public string MedicalConditions { get; set; } = string.Empty;

    [JsonPropertyName("allergies")]
    public string Allergies { get; set; } = string.Empty;

    [JsonPropertyName("dietary_restrictions")]
    public string DietaryRestrictions { get; set; } = string.Empty;

    [JsonPropertyName("avg_meals_eaten_percent")]
    public double AvgMealsEatenPercent { get; set; }

    [JsonPropertyName("recent_avg_blood_sugar")]
    public double RecentAvgBloodSugar { get; set; }

    [JsonPropertyName("recent_avg_systolic_bp")]
    public double RecentAvgSystolicBp { get; set; }
}

public class MealRecommendationItemDto
{
    [JsonPropertyName("recipe_name")]
    public string RecipeName { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    [JsonPropertyName("calories")]
    public int Calories { get; set; }

    [JsonPropertyName("protein_g")]
    public int ProteinG { get; set; }

    [JsonPropertyName("carbs_g")]
    public int CarbsG { get; set; }

    [JsonPropertyName("fat_g")]
    public int FatG { get; set; }

    [JsonPropertyName("type")]
    public string Type { get; set; } = string.Empty; // e.g. "breakfast", "lunch", "dinner"
}

public class DietRecommendationOutputDto
{
    [JsonPropertyName("elderly_id")]
    public int ElderlyId { get; set; }

    [JsonPropertyName("meals")]
    public List<MealRecommendationItemDto> Meals { get; set; } = new();

    [JsonPropertyName("dietitian_notes")]
    public string DietitianNotes { get; set; } = string.Empty;

    [JsonPropertyName("avg_meals_eaten_percent")]
    public double AvgMealsEatenPercent { get; set; }

    [JsonPropertyName("recent_avg_blood_sugar")]
    public double RecentAvgBloodSugar { get; set; }

    [JsonPropertyName("recent_avg_systolic_bp")]
    public double RecentAvgSystolicBp { get; set; }
}
