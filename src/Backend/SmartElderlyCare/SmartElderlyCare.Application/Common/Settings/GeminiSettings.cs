namespace SmartElderlyCare.Application.Common.Settings;

/// <summary>
/// Google Gemini AI configuration settings
/// </summary>
public class GeminiSettings
{
    public string ApiKey { get; set; } = string.Empty;
    public string Model { get; set; } = "gemini-flash-latest"; // Using the model from your curl command
    public int MaxTokens { get; set; } = 800;
    public double Temperature { get; set; } = 0.7;
    public int TimeoutSeconds { get; set; } = 30;
}