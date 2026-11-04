using Base.Contracts.Application;
using Base.Contracts.DTO;
using Domain;

namespace Contracts.Application;

public interface IDiningEnvironmentService : IBaseService<DiningEnvironment>
{
    // Additive only: never removes existing members or creates duplicates.
    Task<IMethodResponse<DiningEnvironmentAutoFillResult>> AutoFillAsync(Guid id, Guid actor = default);
}
