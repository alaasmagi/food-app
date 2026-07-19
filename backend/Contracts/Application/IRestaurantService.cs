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
}
