using Base.Application;
using Base.Contracts.DTO;
using Base.DTO;
using Contracts.Application;
using Contracts.DataAccess;
using Domain;

namespace Application;

public class FavouriteIdentityMapper : IMapper<Favourite, Favourite>
{
    public Favourite? Map(Favourite? entity)
    {
        return entity;
    }

    public IEnumerable<Favourite>? Map(IEnumerable<Favourite>? entities)
    {
        return entities;
    }
}

public class FavouriteService
    : BaseService<Favourite, Favourite, IFavouriteRepository>, IFavouriteService
{
    private readonly IFavouriteRepository _favouriteRepository;

    public FavouriteService(
        IFavouriteRepository favouriteRepository,
        Base.Contracts.DataAccess.IBaseUow uow,
        IMapper<Favourite, Favourite> mapper)
        : base(uow, favouriteRepository, mapper)
    {
        _favouriteRepository = favouriteRepository;
    }

    /// <summary>
    /// A Favourite is one rating per (user, restaurant): re-submitting a create for a restaurant the
    /// actor already rated updates that existing row in place instead of erroring or duplicating
    /// (see design.md Decision 3). The current ConcurrencyToken is read here and handed straight to
    /// UpdateAsync so the caller never needs to know the existing row's id or token.
    /// </summary>
    public override async Task<IMethodResponse<Favourite>> CreateAsync(Favourite entity, Guid actor = default)
    {
        var existing = await _favouriteRepository.GetByRestaurantAsync(entity.RestaurantId, actor);
        if (existing != null)
        {
            return await base.UpdateAsync(existing.Id, entity, existing.ConcurrencyToken, actor);
        }

        return await base.CreateAsync(entity, actor);
    }

    public override async Task<IMethodResponse<Favourite>> GetByIdAsync(Guid id, Guid actor = default)
    {
        var ownershipError = await CheckOwnershipAsync(id, actor);
        if (ownershipError != null)
        {
            return MethodResponse<Favourite>.Failure(ownershipError);
        }

        return await base.GetByIdAsync(id, actor);
    }

    public override async Task<IMethodResponse<Favourite>> UpdateAsync(
        Guid id,
        Favourite entity,
        string? expectedConcurrencyToken = default,
        Guid actor = default)
    {
        var ownershipError = await CheckOwnershipAsync(id, actor);
        if (ownershipError != null)
        {
            return MethodResponse<Favourite>.Failure(ownershipError);
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

    /// <summary>
    /// Same unscoped-fetch-first pattern as DiningEnvironmentService (see design.md Decision 2), so
    /// cross-user access to an existing Favourite surfaces as FORBIDDEN instead of NOT_FOUND.
    /// </summary>
    private async Task<IError?> CheckOwnershipAsync(Guid id, Guid actor)
    {
        var unscopedResponse = await _favouriteRepository.GetByIdAsync(id);
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
