using Base.Application;
using Base.Contracts.DTO;
using Base.DTO;
using Contracts.Application;
using Contracts.DataAccess;
using Domain;

namespace Application;

public class EnvironmentRestaurantIdentityMapper : IMapper<EnvironmentRestaurant, EnvironmentRestaurant>
{
    public EnvironmentRestaurant? Map(EnvironmentRestaurant? entity)
    {
        return entity;
    }

    public IEnumerable<EnvironmentRestaurant>? Map(IEnumerable<EnvironmentRestaurant>? entities)
    {
        return entities;
    }
}

public class EnvironmentRestaurantService
    : BaseService<EnvironmentRestaurant, EnvironmentRestaurant, IEnvironmentRestaurantRepository>, IEnvironmentRestaurantService
{
    private readonly IEnvironmentRestaurantRepository _environmentRestaurantRepository;
    private readonly IDiningEnvironmentRepository _diningEnvironmentRepository;

    public EnvironmentRestaurantService(
        IEnvironmentRestaurantRepository environmentRestaurantRepository,
        IDiningEnvironmentRepository diningEnvironmentRepository,
        Base.Contracts.DataAccess.IBaseUow uow,
        IMapper<EnvironmentRestaurant, EnvironmentRestaurant> mapper)
        : base(uow, environmentRestaurantRepository, mapper)
    {
        _environmentRestaurantRepository = environmentRestaurantRepository;
        _diningEnvironmentRepository = diningEnvironmentRepository;
    }

    public override async Task<IMethodResponse<EnvironmentRestaurant>> CreateAsync(EnvironmentRestaurant entity, Guid actor = default)
    {
        var environmentResponse = await _diningEnvironmentRepository.GetByIdAsync(entity.EnvironmentId);
        if (!environmentResponse.Successful || environmentResponse.Value == null)
        {
            return MethodResponse<EnvironmentRestaurant>.Failure(new Error(ErrorDefaults.Codes.NotFound, ErrorDefaults.Messages.NotFound));
        }

        if (environmentResponse.Value.UserId != actor)
        {
            return MethodResponse<EnvironmentRestaurant>.Failure(new Error(ErrorDefaults.Codes.Forbidden, ErrorDefaults.Messages.Forbidden));
        }

        if (await _environmentRestaurantRepository.ExistsForEnvironmentAndRestaurantAsync(entity.EnvironmentId, entity.RestaurantId))
        {
            return MethodResponse<EnvironmentRestaurant>.Failure(new Error(
                EnvironmentRestaurantErrorCodes.DuplicateMembership,
                "This Restaurant is already a member of the target DiningEnvironment."));
        }

        return await base.CreateAsync(entity, actor);
    }

    public override async Task<IMethodResponse<EnvironmentRestaurant>> GetByIdAsync(Guid id, Guid actor = default)
    {
        var ownershipError = await CheckOwnershipAsync(id, actor);
        if (ownershipError != null)
        {
            return MethodResponse<EnvironmentRestaurant>.Failure(ownershipError);
        }

        return await base.GetByIdAsync(id, actor);
    }

    public override async Task<IMethodResponse<EnvironmentRestaurant>> UpdateAsync(
        Guid id,
        EnvironmentRestaurant entity,
        string? expectedConcurrencyToken = default,
        Guid actor = default)
    {
        var ownershipError = await CheckOwnershipAsync(id, actor);
        if (ownershipError != null)
        {
            return MethodResponse<EnvironmentRestaurant>.Failure(ownershipError);
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
    /// Same unscoped-fetch-first pattern as DiningEnvironmentService (see design.md Decision 3), so
    /// cross-user access to an existing membership row surfaces as FORBIDDEN instead of NOT_FOUND.
    /// </summary>
    private async Task<IError?> CheckOwnershipAsync(Guid id, Guid actor)
    {
        var unscopedResponse = await _environmentRestaurantRepository.GetByIdAsync(id);
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
