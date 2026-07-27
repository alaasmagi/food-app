using Base.Contracts.DataAccess;
using Domain;

namespace Contracts.DataAccess;

public interface IEnvironmentRestaurantRepository : IBaseRepository<EnvironmentRestaurant>
{
    Task<bool> ExistsForEnvironmentAndRestaurantAsync(Guid environmentId, Guid restaurantId, CancellationToken ct = default);

    /// <summary>
    /// The restaurant ids already members of the given environment. Lets the auto-fill caller compute,
    /// in one round-trip, which in-radius restaurants are new versus already present.
    /// </summary>
    Task<IReadOnlyList<Guid>> GetRestaurantIdsForEnvironmentAsync(Guid environmentId, CancellationToken ct = default);

    /// <summary>
    /// Inserts an <c>EnvironmentRestaurant</c> membership owned by <paramref name="userId"/> for each
    /// given restaurant id, stamping audit/concurrency metadata, and returns the number inserted. The
    /// caller is responsible for passing only ids not already present; the unique
    /// (UserId, EnvironmentId, RestaurantId) index is the final guard against duplicates.
    /// </summary>
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
