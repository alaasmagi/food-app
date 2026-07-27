using Base.Contracts.DTO;
using Base.DataAccess.EF;
using Contracts.DataAccess;
using DataAccess.Context;
using Domain;
using DTO.DataAccess;
using Microsoft.EntityFrameworkCore;

namespace DataAccess;

public class EnvironmentRestaurantRepository
    : BaseRepository<EnvironmentRestaurant, EnvironmentRestaurantEntity, IMapper<EnvironmentRestaurant, EnvironmentRestaurantEntity>>,
        IEnvironmentRestaurantRepository
{
    private readonly AppDbContext _context;

    public EnvironmentRestaurantRepository(
        AppDbContext repositoryDbContext,
        IMapper<EnvironmentRestaurant, EnvironmentRestaurantEntity> repositoryMapper)
        : base(repositoryDbContext, repositoryMapper)
    {
        _context = repositoryDbContext;
    }

    public async Task<bool> ExistsForEnvironmentAndRestaurantAsync(Guid environmentId, Guid restaurantId, CancellationToken ct = default)
    {
        return await _context.EnvironmentRestaurants
            .AsNoTracking()
            .AnyAsync(
                environmentRestaurant =>
                    environmentRestaurant.EnvironmentId == environmentId &&
                    environmentRestaurant.RestaurantId == restaurantId,
                ct);
    }

    public async Task<IReadOnlyList<Guid>> GetRestaurantIdsForEnvironmentAsync(Guid environmentId, CancellationToken ct = default)
    {
        return await _context.EnvironmentRestaurants
            .AsNoTracking()
            .Where(environmentRestaurant => environmentRestaurant.EnvironmentId == environmentId)
            .Select(environmentRestaurant => environmentRestaurant.RestaurantId)
            .ToListAsync(ct);
    }

    public async Task<int> AddMembershipsAsync(
        Guid environmentId,
        Guid userId,
        IReadOnlyCollection<Guid> restaurantIds,
        CancellationToken ct = default)
    {
        if (restaurantIds.Count == 0)
        {
            return 0;
        }

        // Direct-context insert with manual metadata stamping, mirroring AppUserRepository's direct
        // writes: auto-fill imports a whole set at once, so a single SaveChanges beats one base
        // CreateAsync round-trip per row. The unique (UserId, EnvironmentId, RestaurantId) index is the
        // final duplicate guard even though the caller passes only ids it already found to be missing.
        var now = DateTime.UtcNow;
        var actor = userId.ToString();

        foreach (var restaurantId in restaurantIds)
        {
            _context.EnvironmentRestaurants.Add(new EnvironmentRestaurantEntity
            {
                Id = Guid.NewGuid(),
                EnvironmentId = environmentId,
                RestaurantId = restaurantId,
                UserId = userId,
                CreatedAt = now,
                UpdatedAt = now,
                CreatedBy = actor,
                UpdatedBy = actor,
                ConcurrencyToken = Guid.NewGuid().ToString("N")
            });
        }

        await _context.SaveChangesAsync(ct);
        return restaurantIds.Count;
    }

    public async Task<IReadOnlyList<DailyRecommendationRestaurantCandidate>> GetDailyRecommendationRestaurantCandidatesAsync(
        Guid userId,
        Guid? environmentId = null,
        CancellationToken ct = default)
    {
        // Flatten the user's environment memberships to their restaurants, keep only offer-capable
        // restaurants, and mark whether each can be refreshed through a provider. When environmentId
        // is set, scope to that one environment; otherwise combine all of the user's environments.
        var candidates = await _context.EnvironmentRestaurants
            .AsNoTracking()
            .Where(environmentRestaurant => environmentRestaurant.UserId == userId)
            .Where(environmentRestaurant =>
                environmentId == null || environmentRestaurant.EnvironmentId == environmentId)
            .Select(environmentRestaurant => environmentRestaurant.Restaurant!)
            .Where(restaurant => restaurant.HasOffers)
            .Select(restaurant => new DailyRecommendationRestaurantCandidate
            {
                RestaurantId = restaurant.Id,
                RestaurantName = restaurant.Name,
                OfferTimeText = restaurant.OfferTimeText,
                IsFetchable = restaurant.OfferProviderId != null &&
                              restaurant.OfferProvider!.ProviderType != EOfferProviderType.Manual
            })
            .ToListAsync(ct);

        // A restaurant can appear in more than one of the user's environments; emit it once.
        return candidates
            .GroupBy(candidate => candidate.RestaurantId)
            .Select(group => group.First())
            .ToList();
    }
}
