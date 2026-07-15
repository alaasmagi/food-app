using Base.Contracts.DTO;
using Domain;

namespace DTO.Web.Mappers;

public class EnvironmentRestaurantDtoMapper : IMapper<EnvironmentRestaurantDto, EnvironmentRestaurant>
{
    public EnvironmentRestaurantDto? Map(EnvironmentRestaurant? entity)
    {
        return entity == null ? null : new EnvironmentRestaurantDto
        {
            Id = entity.Id,
            ConcurrencyToken = entity.ConcurrencyToken,
            EnvironmentId = entity.EnvironmentId,
            RestaurantId = entity.RestaurantId,
        };
    }

    public IEnumerable<EnvironmentRestaurantDto>? Map(IEnumerable<EnvironmentRestaurant>? entities)
    {
        return entities?.Select(entity => Map(entity)!);
    }

    public EnvironmentRestaurant? Map(EnvironmentRestaurantDto? entity)
    {
        return entity == null ? null : new EnvironmentRestaurant
        {
            Id = entity.Id == Guid.Empty ? Guid.NewGuid() : entity.Id,
            ConcurrencyToken = entity.ConcurrencyToken ?? string.Empty,
            EnvironmentId = entity.EnvironmentId,
            RestaurantId = entity.RestaurantId,
        };
    }

    public IEnumerable<EnvironmentRestaurant>? Map(IEnumerable<EnvironmentRestaurantDto>? entities)
    {
        return entities?.Select(entity => Map(entity)!);
    }
}
