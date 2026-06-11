using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace SmartElderlyCare.Application.DTOs.AI;

public class RecipeDto
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
    public string Type { get; set; } = string.Empty; // "breakfast", "lunch", or "dinner"

    [JsonPropertyName("tags")]
    public List<string> Tags { get; set; } = new();
}
