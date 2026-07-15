using Base.Application;
using Base.Contracts.DataAccess;
using Base.Contracts.Domain;
using Base.Contracts.DTO;
using Base.DTO;

namespace Application;

/// <summary>
/// Shared base for services whose entities implement <see cref="IBaseEntityUserId{TKey}"/>. Fetches the
/// row unscoped first (bypassing BaseRepository's actor filter) so cross-user access to an existing row
/// reports FORBIDDEN instead of the NOT_FOUND that BaseRepository's actor-scoped queries would otherwise
/// produce for a foreign-owned row (see add-user-wheel design.md Decision 3).
/// </summary>
public abstract class OwnershipScopedService<TDomainEntity, TRepository>
    : BaseService<TDomainEntity, TDomainEntity, TRepository>
    where TDomainEntity : class, IBaseEntity<Guid>, IBaseEntityUserId<Guid>
    where TRepository : class, IBaseRepository<TDomainEntity, Guid, Guid>
{
    protected OwnershipScopedService(
        IBaseUow uow,
        TRepository repository,
        IMapper<TDomainEntity, TDomainEntity> mapper)
        : base(uow, repository, mapper)
    {
    }

    public override async Task<IMethodResponse<TDomainEntity>> GetByIdAsync(Guid id, Guid actor = default)
    {
        var ownershipError = await CheckOwnershipAsync(id, actor);
        if (ownershipError != null)
        {
            return MethodResponse<TDomainEntity>.Failure(ownershipError);
        }

        return await base.GetByIdAsync(id, actor);
    }

    public override async Task<IMethodResponse<TDomainEntity>> UpdateAsync(
        Guid id,
        TDomainEntity entity,
        string? expectedConcurrencyToken = default,
        Guid actor = default)
    {
        var ownershipError = await CheckOwnershipAsync(id, actor);
        if (ownershipError != null)
        {
            return MethodResponse<TDomainEntity>.Failure(ownershipError);
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

        return await base.RemoveAsync(id, expectedConcurrencyToken, actor);
    }

    private async Task<IError?> CheckOwnershipAsync(Guid id, Guid actor)
    {
        var unscopedResponse = await ServiceRepository.GetByIdAsync(id);
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
