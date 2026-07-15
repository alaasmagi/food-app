using Base.Application;
using Base.Contracts.DTO;
using Base.DTO;
using Contracts.Application;
using Contracts.DataAccess;
using Domain;

namespace Application;

public class DiningEnvironmentIdentityMapper : IMapper<DiningEnvironment, DiningEnvironment>
{
    public DiningEnvironment? Map(DiningEnvironment? entity)
    {
        return entity;
    }

    public IEnumerable<DiningEnvironment>? Map(IEnumerable<DiningEnvironment>? entities)
    {
        return entities;
    }
}

public class DiningEnvironmentService
    : BaseService<DiningEnvironment, DiningEnvironment, IDiningEnvironmentRepository>, IDiningEnvironmentService
{
    private readonly IDiningEnvironmentRepository _diningEnvironmentRepository;
    private readonly IAppUserRepository _appUserRepository;

    public DiningEnvironmentService(
        IDiningEnvironmentRepository diningEnvironmentRepository,
        IAppUserRepository appUserRepository,
        Base.Contracts.DataAccess.IBaseUow uow,
        IMapper<DiningEnvironment, DiningEnvironment> mapper)
        : base(uow, diningEnvironmentRepository, mapper)
    {
        _diningEnvironmentRepository = diningEnvironmentRepository;
        _appUserRepository = appUserRepository;
    }

    public override async Task<IMethodResponse<DiningEnvironment>> GetByIdAsync(Guid id, Guid actor = default)
    {
        var ownershipError = await CheckOwnershipAsync(id, actor);
        if (ownershipError != null)
        {
            return MethodResponse<DiningEnvironment>.Failure(ownershipError);
        }

        return await base.GetByIdAsync(id, actor);
    }

    public override async Task<IMethodResponse<DiningEnvironment>> UpdateAsync(
        Guid id,
        DiningEnvironment entity,
        string? expectedConcurrencyToken = default,
        Guid actor = default)
    {
        var ownershipError = await CheckOwnershipAsync(id, actor);
        if (ownershipError != null)
        {
            return MethodResponse<DiningEnvironment>.Failure(ownershipError);
        }

        return await base.UpdateAsync(id, entity, expectedConcurrencyToken, actor);
    }

    public override async Task<IMethodResponse<bool>> RemoveAsync(
        Guid id,
        string? expectedConcurrencyToken = default,
        Guid actor = default)
    {
        var ownershipError = await CheckOwnershipAsync(id, actor);
        if (ownershipError != null)
        {
            return MethodResponse<bool>.Failure(ownershipError);
        }

        var removeResult = await base.RemoveAsync(id, expectedConcurrencyToken, actor);
        if (removeResult.Successful && removeResult.Value)
        {
            // Clear the notification scope of any user that pointed at this environment.
            await _appUserRepository.ClearNotificationEnvironmentAsync(id);
        }

        return removeResult;
    }

    /// <summary>
    /// BaseRepository's actor scoping would already return NOT_FOUND for a foreign-owned row before any
    /// ownership check runs, so this fetches unscoped first to distinguish "does not exist" from
    /// "exists but belongs to someone else" and report FORBIDDEN for the latter (see design.md Decision 3).
    /// </summary>
    private async Task<IError?> CheckOwnershipAsync(Guid id, Guid actor)
    {
        var unscopedResponse = await _diningEnvironmentRepository.GetByIdAsync(id);
        if (!unscopedResponse.Successful || unscopedResponse.Value == null)
        {
            return new Error(ErrorDefaults.Codes.NotFound, ErrorDefaults.Messages.NotFound);
        }

        if (unscopedResponse.Value.UserId != actor)
        {
            return new Error(ErrorDefaults.Codes.Forbidden, ErrorDefaults.Messages.Forbidden);
        }

        return null;
    }
}
