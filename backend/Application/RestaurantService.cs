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
    // Upper bound on list page size so a client can't request an unbounded page.
    private const int MaxPageSize = 100;

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

    public async Task<IMethodResponse<RestaurantPage>> SearchPageAsync(
        string? search,
        int page,
        int pageSize,
        CancellationToken ct = default)
    {
        if (page < 1)
        {
            return MethodResponse<RestaurantPage>.Failure(
                new Error(ErrorDefaults.Codes.InvalidPaging, ErrorDefaults.Messages.InvalidPaging));
        }

        var clampedPageSize = Math.Clamp(pageSize, 1, MaxPageSize);
        var (items, total) = await restaurantRepository.SearchPageAsync(search, page, clampedPageSize, ct);
        return MethodResponse<RestaurantPage>.Success(new RestaurantPage(items, total, page, clampedPageSize));
    }
}
