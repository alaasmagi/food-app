using Base.Contracts.DataAccess;
using Domain;

namespace Contracts.DataAccess;

public interface IRestaurantRepository : IBaseRepository<Restaurant>
{
    // Ordered by distance to the box centre so the closest ones are kept when the limit is hit.
    Task<IReadOnlyList<Restaurant>> GetInBoundsAsync(
        double minLat,
        double minLon,
        double maxLat,
        double maxLon,
        int limit,
        CancellationToken ct = default);

    // No limit: the auto-fill pre-filter must not drop any match before the exact radius test.
    Task<IReadOnlyList<Restaurant>> GetAllInBoundsAsync(
        double minLat,
        double minLon,
        double maxLat,
        double maxLon,
        CancellationToken ct = default);

    // The base GetAllByPageAsync/GetCountAsync take no filter, so search paging needs its own query.
    Task<(IReadOnlyList<Restaurant> Items, int Total)> SearchPageAsync(
        string? search,
        int pageNr,
        int pageSize,
        CancellationToken ct = default);
}
