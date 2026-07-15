using Base.Contracts.DataAccess;
using Domain;

namespace Contracts.DataAccess;

public interface IEnvironmentRestaurantRepository : IBaseRepository<EnvironmentRestaurant>
{
    Task<bool> ExistsForEnvironmentAndRestaurantAsync(Guid environmentId, Guid restaurantId, CancellationToken ct = default);

    Task<IReadOnlyList<DailyRecommendationRestaurantCandidate>> GetDailyRecommendationRestaurantCandidatesAsync(
        Guid userId,
        CancellationToken ct = default);
}
