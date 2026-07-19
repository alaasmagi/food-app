using Base.Contracts.Application;
using Base.Contracts.DTO;
using Domain;

namespace Contracts.Application;

public interface IRestaurantService : IBaseService<Restaurant>
{
    /// <summary>
    /// Restaurants inside the given map viewport, capped at <paramref name="limit"/> and ordered
    /// nearest-to-centre. Bounds are assumed validated by the caller (min &lt;= max).
    /// </summary>
    Task<IMethodResponse<IEnumerable<Restaurant>>> GetInBoundsAsync(
        double minLat,
        double minLon,
        double maxLat,
        double maxLon,
        int limit,
        CancellationToken ct = default);

    /// <summary>
    /// A single, name/city-searchable page of restaurants for the list view. Fails with
    /// <c>INVALID_PAGING</c> when <paramref name="page"/> is less than 1; <paramref name="pageSize"/> is
    /// clamped to a sane maximum.
    /// </summary>
    Task<IMethodResponse<RestaurantPage>> SearchPageAsync(
        string? search,
        int page,
        int pageSize,
        CancellationToken ct = default);
}
