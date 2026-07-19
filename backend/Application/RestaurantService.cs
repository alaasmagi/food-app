using Base.Application;
using Base.Contracts.DTO;
using Base.DTO;
using Contracts.Application;
using Contracts.DataAccess;
using Domain;

namespace Application;

public class RestaurantIdentityMapper : IMapper<Restaurant, Restaurant>
{
    public Restaurant? Map(Restaurant? entity)
    {
        return entity;
    }

    public IEnumerable<Restaurant>? Map(IEnumerable<Restaurant>? entities)
    {
        return entities;
    }
}

public class RestaurantService(
    IRestaurantRepository restaurantRepository,
    Base.Contracts.DataAccess.IBaseUow uow,
    IMapper<Restaurant, Restaurant> mapper)
    : BaseService<Restaurant, Restaurant, IRestaurantRepository>(uow, restaurantRepository, mapper), IRestaurantService
{
    // Guardrail so a wide viewport can never pull the whole table; the controller's default is smaller.
    private const int MaxLimit = 500;

    public async Task<IMethodResponse<IEnumerable<Restaurant>>> GetInBoundsAsync(
        double minLat,
        double minLon,
        double maxLat,
        double maxLon,
        int limit,
        CancellationToken ct = default)
    {
        var clampedLimit = Math.Clamp(limit, 1, MaxLimit);
        var restaurants = await restaurantRepository.GetInBoundsAsync(minLat, minLon, maxLat, maxLon, clampedLimit, ct);
        return MethodResponse<IEnumerable<Restaurant>>.Success(restaurants);
    }
}
