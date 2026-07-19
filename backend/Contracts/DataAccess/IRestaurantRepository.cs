using Base.Contracts.DataAccess;
using Domain;

namespace Contracts.DataAccess;

public interface IRestaurantRepository : IBaseRepository<Restaurant>
{
    /// <summary>
    /// Restaurants whose coordinates fall inside the given bounding box, ordered by distance to the
    /// box centre so that when more than <paramref name="limit"/> match, the closest ones are kept.
    /// </summary>
    Task<IReadOnlyList<Restaurant>> GetInBoundsAsync(
        double minLat,
        double minLon,
        double maxLat,
        double maxLon,
        int limit,
        CancellationToken ct = default);
}
