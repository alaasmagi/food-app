using Base.Contracts.DataAccess;
using Domain;

namespace Contracts.DataAccess;

public interface IEnvironmentRestaurantRepository : IBaseRepository<EnvironmentRestaurant>
{
    Task<bool> ExistsForEnvironmentAndRestaurantAsync(Guid environmentId, Guid restaurantId, CancellationToken ct = default);

    Task<IReadOnlyList<Guid>> GetRestaurantIdsForEnvironmentAsync(Guid environmentId, CancellationToken ct = default);

    // Callers pass only new ids; the unique (UserId, EnvironmentId, RestaurantId) index is the final guard.
    Task<int> AddMembershipsAsync(
        Guid environmentId,
        Guid userId,
        IReadOnlyCollection<Guid> restaurantIds,
        CancellationToken ct = default);

    Task<IReadOnlyList<DailyRecommendationRestaurantCandidate>> GetDailyRecommendationRestaurantCandidatesAsync(
        Guid userId,
        Guid? environmentId = null,
        CancellationToken ct = default);
}
