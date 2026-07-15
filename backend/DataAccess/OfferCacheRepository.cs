using Contracts.DataAccess;
using DataAccess.Context;
using Microsoft.EntityFrameworkCore;

namespace DataAccess;

public class OfferCacheRepository(OfferCacheDbContext context) : IOfferCacheRepository
{
    public async Task<OfferCacheEntry?> GetByRestaurantIdAsync(Guid restaurantId, CancellationToken ct = default)
    {
        var row = await context.OfferCacheRows
            .AsNoTracking()
            .SingleOrDefaultAsync(cacheRow => cacheRow.RestaurantId == restaurantId, ct);

        return row == null ? null : new OfferCacheEntry
        {
            RestaurantId = row.RestaurantId,
            BusinessDate = row.BusinessDate,
            OffersJson = row.OffersJson,
            FetchedAtUtc = row.FetchedAtUtc
        };
    }

    public async Task UpsertAsync(OfferCacheEntry entry, CancellationToken ct = default)
    {
        var existing = await context.OfferCacheRows
            .SingleOrDefaultAsync(row => row.RestaurantId == entry.RestaurantId, ct);

        if (existing == null)
        {
            context.OfferCacheRows.Add(new OfferCacheRow
            {
                RestaurantId = entry.RestaurantId,
                BusinessDate = entry.BusinessDate,
                OffersJson = entry.OffersJson,
                FetchedAtUtc = entry.FetchedAtUtc
            });
        }
        else
        {
            existing.BusinessDate = entry.BusinessDate;
            existing.OffersJson = entry.OffersJson;
            existing.FetchedAtUtc = entry.FetchedAtUtc;
        }

        await context.SaveChangesAsync(ct);
    }
}
