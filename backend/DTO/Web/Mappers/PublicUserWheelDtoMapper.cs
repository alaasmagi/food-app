using Base.Contracts.DTO;
using Domain;

namespace DTO.Web.Mappers;

public class PublicUserWheelDtoMapper : IMapper<PublicUserWheelDto, UserWheel>
{
    public PublicUserWheelDto? Map(UserWheel? entity)
    {
        return entity == null ? null : new PublicUserWheelDto
        {
            Name = entity.Name,
            RestaurantNames = entity.RestaurantNames,
        };
    }

    public IEnumerable<PublicUserWheelDto>? Map(IEnumerable<UserWheel>? entities)
    {
        return entities?.Select(entity => Map(entity)!);
    }

    // The public surface is read-only; the reverse direction exists only to satisfy the IMapper
    // contract and copies the two fields the minimal DTO carries.
    public UserWheel? Map(PublicUserWheelDto? entity)
    {
        return entity == null ? null : new UserWheel
        {
            Name = entity.Name,
            RestaurantNames = entity.RestaurantNames,
        };
    }

    public IEnumerable<UserWheel>? Map(IEnumerable<PublicUserWheelDto>? entities)
    {
        return entities?.Select(entity => Map(entity)!);
    }
}
