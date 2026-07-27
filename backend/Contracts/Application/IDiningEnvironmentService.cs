using Base.Contracts.Application;
using Base.Contracts.DTO;
using Domain;

namespace Contracts.Application;

public interface IDiningEnvironmentService : IBaseService<DiningEnvironment>
{
    /// <summary>
    /// Additively imports every restaurant within the environment's stored auto-fill radius as an
    /// <c>EnvironmentRestaurant</c> membership. Owner-scoped: NOT_FOUND when the id does not exist,
    /// FORBIDDEN when it belongs to another user, AUTO_FILL_LOCATION_REQUIRED (400) when the
    /// environment has no stored coordinates. Never removes existing members or creates duplicates.
    /// </summary>
    Task<IMethodResponse<DiningEnvironmentAutoFillResult>> AutoFillAsync(Guid id, Guid actor = default);
}
