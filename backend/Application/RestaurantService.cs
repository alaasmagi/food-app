using Base.Application;
using Base.Contracts.DTO;
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
}
