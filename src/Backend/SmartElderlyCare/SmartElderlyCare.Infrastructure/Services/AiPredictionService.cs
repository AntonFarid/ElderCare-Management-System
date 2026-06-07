using System;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using SmartElderlyCare.Application.DTOs.AI;
using SmartElderlyCare.Application.Interfaces;

namespace SmartElderlyCare.Infrastructure.Services;

public class AiPredictionService : IAiPredictionService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<AiPredictionService> _logger;

    public AiPredictionService(HttpClient httpClient, ILogger<AiPredictionService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
        // In a real application, this should come from configuration (e.g. appsettings.json)
        _httpClient.BaseAddress = new Uri("http://localhost:8000/"); 
        _httpClient.DefaultRequestHeaders.Add("X-API-Key", "eldercare-secret-key-2026");
    }

    public async Task<HealthRiskOutputDto?> PredictHealthRiskAsync(HealthRiskInputDto inputData)
    {
        try
        {
            var response = await _httpClient.PostAsJsonAsync("api/ml/predict-health-risk", inputData);

            if (response.IsSuccessStatusCode)
            {
                var prediction = await response.Content.ReadFromJsonAsync<HealthRiskOutputDto>();
                return prediction;
            }
            else
            {
                _logger.LogWarning($"AI Prediction API failed with status code: {response.StatusCode}");
                return null;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error communicating with AI Prediction Service");
            return null;
        }
    }

    public async Task<DietRecommendationOutputDto?> RecommendDietAsync(DietRecommendationInputDto inputData)
    {
        try
        {
            var response = await _httpClient.PostAsJsonAsync("api/ml/recommend-diet", inputData);

            if (response.IsSuccessStatusCode)
            {
                var recommendation = await response.Content.ReadFromJsonAsync<DietRecommendationOutputDto>();
                return recommendation;
            }
            else
            {
                _logger.LogWarning($"AI Diet Recommender API failed with status code: {response.StatusCode}");
                return null;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error communicating with AI Diet Recommender Service");
            return null;
        }
    }
}
