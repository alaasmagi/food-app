using Base.Contracts.Application;
using Base.Contracts.DTO;
using Domain;

namespace Contracts.Application;

public interface IUserWheelService : IBaseService<UserWheel>
{
    // A non-public wheel returns NOT_FOUND so it is indistinguishable from a missing one.
    Task<IMethodResponse<UserWheel>> GetPublicByIdAsync(Guid id);
}
