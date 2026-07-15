using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace DataAccess.Context;

public class OfferCacheDbContextFactory : IDesignTimeDbContextFactory<OfferCacheDbContext>
{
    public OfferCacheDbContext CreateDbContext(string[] args)
    {
        var connectionString = Environment.GetEnvironmentVariable("OFFER_CACHE_CONNECTION_STRING");
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            connectionString = "Data Source=offer-cache.db";
        }

        var options = new DbContextOptionsBuilder<OfferCacheDbContext>()
            .UseSqlite(connectionString, sqlite =>
                sqlite.MigrationsHistoryTable("__OfferCacheMigrationsHistory"))
            .Options;

        return new OfferCacheDbContext(options);
    }
}
