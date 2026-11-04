using Base.Application;
using Base.Contracts.DTO;
using Base.DTO;
using Contracts.Application;
using Contracts.DataAccess;
using Domain;

namespace Application;

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

    // One rating per (user, restaurant): creating again for a rated restaurant updates the existing row.
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

    // Fetches unscoped first so cross-user access to an existing row reports FORBIDDEN instead of NOT_FOUND.
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
