using Base.Contracts.DTO;
using Base.DTO;
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
    public async Task<IMethodResponse<UserWheel>> GetPublicByIdAsync(Guid id)
    {
        // Unscoped fetch (no actor filter), then gate on IsPublic. Missing and non-public collapse to
        // the same NOT_FOUND so wheel ids cannot be enumerated, and no FORBIDDEN is ever returned.
        var response = await ServiceRepository.GetByIdAsync(id);
        if (!response.Successful || response.Value is not { IsPublic: true })
        {
            return MethodResponse<UserWheel>.Failure(
                new Error(ErrorDefaults.Codes.NotFound, ErrorDefaults.Messages.NotFound));
        }

        return MethodResponse<UserWheel>.Success(response.Value);
    }
}
