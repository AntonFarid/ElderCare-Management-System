using System.Threading.Tasks;
using SmartElderlyCare.Application.DTOs.AI;

namespace SmartElderlyCare.Application.Interfaces;

public interface IAiPredictionService
{
    Task<HealthRiskOutputDto?> PredictHealthRiskAsync(HealthRiskInputDto inputData);
    Task<DietRecommendationOutputDto?> RecommendDietAsync(DietRecommendationInputDto inputData);
}
