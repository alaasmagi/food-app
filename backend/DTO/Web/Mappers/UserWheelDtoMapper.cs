using Base.Contracts.DTO;
using Domain;

namespace DTO.Web.Mappers;

public class UserWheelDtoMapper : IMapper<UserWheelDto, UserWheel>
{
    public UserWheelDto? Map(UserWheel? entity)
    {
        return entity == null ? null : new UserWheelDto
        {
            Id = entity.Id,
            ConcurrencyToken = entity.ConcurrencyToken,
            Name = entity.Name,
            RestaurantNames = entity.RestaurantNames,
            IsPublic = entity.IsPublic,
        };
    }

    public IEnumerable<UserWheelDto>? Map(IEnumerable<UserWheel>? entities)
    {
        return entities?.Select(entity => Map(entity)!);
    }

    public UserWheel? Map(UserWheelDto? entity)
    {
        return entity == null ? null : new UserWheel
        {
            Id = entity.Id == Guid.Empty ? Guid.NewGuid() : entity.Id,
            ConcurrencyToken = entity.ConcurrencyToken ?? string.Empty,
            Name = entity.Name,
            RestaurantNames = entity.RestaurantNames,
            IsPublic = entity.IsPublic,
        };
    }

    public IEnumerable<UserWheel>? Map(IEnumerable<UserWheelDto>? entities)
    {
        return entities?.Select(entity => Map(entity)!);
    }
}
