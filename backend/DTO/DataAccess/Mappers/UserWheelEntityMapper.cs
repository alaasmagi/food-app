using Base.Contracts.DTO;
using Domain;

namespace DTO.DataAccess.Mappers;

public class UserWheelEntityMapper : IMapper<UserWheel, UserWheelEntity>
{
    public UserWheel? Map(UserWheelEntity? entity)
    {
        return entity == null ? null : new UserWheel
        {
            Id = entity.Id,
            ConcurrencyToken = entity.ConcurrencyToken,
            UserId = entity.UserId,
            Name = entity.Name,
            RestaurantNames = entity.RestaurantNames,
            IsPublic = entity.IsPublic,
        };
    }

    public IEnumerable<UserWheel>? Map(IEnumerable<UserWheelEntity>? entities)
    {
        return entities?.Select(entity => Map(entity)!);
    }

    public UserWheelEntity? Map(UserWheel? entity)
    {
        return entity == null ? null : new UserWheelEntity
        {
            Id = entity.Id,
            ConcurrencyToken = entity.ConcurrencyToken,
            UserId = entity.UserId,
            Name = entity.Name,
            RestaurantNames = entity.RestaurantNames,
            IsPublic = entity.IsPublic,
        };
    }

    public IEnumerable<UserWheelEntity>? Map(IEnumerable<UserWheel>? entities)
    {
        return entities?.Select(entity => Map(entity)!);
    }
}
