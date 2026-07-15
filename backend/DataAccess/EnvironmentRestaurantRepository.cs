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

    public async Task<IReadOnlyList<DailyRecommendationRestaurantCandidate>> GetDailyRecommendationRestaurantCandidatesAsync(
        Guid userId,
        CancellationToken ct = default)
    {
        // Flatten all of the user's environment memberships to their restaurants, keep only
        // offer-capable restaurants, and mark whether each can be refreshed through a provider.
        var candidates = await _context.EnvironmentRestaurants
            .AsNoTracking()
            .Where(environmentRestaurant => environmentRestaurant.UserId == userId)
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
