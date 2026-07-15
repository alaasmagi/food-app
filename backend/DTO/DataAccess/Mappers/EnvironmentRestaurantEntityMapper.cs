using Base.Contracts.DTO;
using Domain;

namespace DTO.DataAccess.Mappers;

public class EnvironmentRestaurantEntityMapper : IMapper<EnvironmentRestaurant, EnvironmentRestaurantEntity>
{
    public EnvironmentRestaurant? Map(EnvironmentRestaurantEntity? entity)
    {
        return entity == null ? null : new EnvironmentRestaurant
        {
            Id = entity.Id,
            ConcurrencyToken = entity.ConcurrencyToken,
            UserId = entity.UserId,
            EnvironmentId = entity.EnvironmentId,
            RestaurantId = entity.RestaurantId,
        };
    }

    public IEnumerable<EnvironmentRestaurant>? Map(IEnumerable<EnvironmentRestaurantEntity>? entities)
    {
        return entities?.Select(entity => Map(entity)!);
    }

    public EnvironmentRestaurantEntity? Map(EnvironmentRestaurant? entity)
    {
        return entity == null ? null : new EnvironmentRestaurantEntity
        {
            Id = entity.Id,
            ConcurrencyToken = entity.ConcurrencyToken,
            UserId = entity.UserId,
            EnvironmentId = entity.EnvironmentId,
            RestaurantId = entity.RestaurantId,
        };
    }

    public IEnumerable<EnvironmentRestaurantEntity>? Map(IEnumerable<EnvironmentRestaurant>? entities)
    {
        return entities?.Select(entity => Map(entity)!);
    }
}
