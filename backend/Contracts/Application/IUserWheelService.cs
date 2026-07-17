using Base.Contracts.Application;
using Base.Contracts.DTO;
using Domain;

namespace Contracts.Application;

public interface IUserWheelService : IBaseService<UserWheel>
{
    /// <summary>
    /// Unauthenticated read of a shared wheel. Returns the wheel only when it exists AND IsPublic is
    /// true; otherwise fails with NOT_FOUND so a non-public wheel is indistinguishable from a
    /// non-existent one. Never resolves an actor and never returns FORBIDDEN.
    /// </summary>
    Task<IMethodResponse<UserWheel>> GetPublicByIdAsync(Guid id);
}
