using Base.Contracts.DTO;
using Domain;

namespace Application.Mappers;

public class UserWheelIdentityMapper : IMapper<UserWheel, UserWheel>
{
    public UserWheel? Map(UserWheel? entity)
    {
        return entity;
    }

    public IEnumerable<UserWheel>? Map(IEnumerable<UserWheel>? entities)
    {
        return entities;
    }
}
