namespace Contracts.DataAccess;

public interface IOfferCacheRepository
{
    Task<OfferCacheEntry?> GetByRestaurantIdAsync(Guid restaurantId, CancellationToken ct = default);

    Task UpsertAsync(OfferCacheEntry entry, CancellationToken ct = default);
}
