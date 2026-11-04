using Base.Contracts.Application;
using Base.Contracts.DTO;
using Domain;

namespace Contracts.Application;

public interface IRestaurantService : IBaseService<Restaurant>
{
    // Bounds are assumed validated by the caller (min <= max).
    Task<IMethodResponse<IEnumerable<Restaurant>>> GetInBoundsAsync(
        double minLat,
        double minLon,
        double maxLat,
        double maxLon,
        int limit,
        CancellationToken ct = default);

    Task<IMethodResponse<RestaurantPage>> SearchPageAsync(
        string? search,
        int page,
        int pageSize,
        CancellationToken ct = default);
}
