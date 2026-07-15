using Base.Contracts.DTO;
using Contracts.Application;
using Contracts.DataAccess;
using Domain;

namespace Application;

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

public class UserWheelService(
    IUserWheelRepository userWheelRepository,
    Base.Contracts.DataAccess.IBaseUow uow,
    IMapper<UserWheel, UserWheel> mapper)
    : OwnershipScopedService<UserWheel, IUserWheelRepository>(uow, userWheelRepository, mapper), IUserWheelService
{
}
