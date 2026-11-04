using Base.Contracts.DTO;
using Domain;

namespace Application.Mappers;

public class EnvironmentRestaurantIdentityMapper : IMapper<EnvironmentRestaurant, EnvironmentRestaurant>
{
    public EnvironmentRestaurant? Map(EnvironmentRestaurant? entity)
    {
        return entity;
    }

    public IEnumerable<EnvironmentRestaurant>? Map(IEnumerable<EnvironmentRestaurant>? entities)
    {
        return entities;
    }
}
