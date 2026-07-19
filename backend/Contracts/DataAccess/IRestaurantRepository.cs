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

    /// <summary>
    /// A single page of restaurants, optionally filtered by a case-insensitive match on name or city,
    /// ordered by name. Returns the page items together with the total count of matches (so the caller
    /// can render pagination). The base <c>GetAllByPageAsync</c>/<c>GetCountAsync</c> can't be used here
    /// because they take no filter.
    /// </summary>
    Task<(IReadOnlyList<Restaurant> Items, int Total)> SearchPageAsync(
        string? search,
        int pageNr,
        int pageSize,
        CancellationToken ct = default);
}
