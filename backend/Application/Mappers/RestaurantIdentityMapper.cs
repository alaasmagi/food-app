using Base.Contracts.DTO;
using Domain;

namespace Application.Mappers;

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
