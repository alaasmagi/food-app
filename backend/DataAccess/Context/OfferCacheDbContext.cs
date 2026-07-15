using System.Globalization;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace DataAccess.Context;

public class OfferCacheDbContext : DbContext
{
    private static readonly ValueConverter<DateOnly, string> BusinessDateConverter = new(
        value => value.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
        value => DateOnly.ParseExact(value, "yyyy-MM-dd", CultureInfo.InvariantCulture));

    public OfferCacheDbContext(DbContextOptions<OfferCacheDbContext> options) : base(options)
    {
    }

    public DbSet<OfferCacheRow> OfferCacheRows => Set<OfferCacheRow>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<OfferCacheRow>(entity =>
        {
            entity.ToTable("OfferCache");
            entity.HasKey(e => e.RestaurantId);
            entity.Property(e => e.RestaurantId).ValueGeneratedNever();
            entity.Property(e => e.BusinessDate)
                .HasConversion(BusinessDateConverter)
                .HasMaxLength(10)
                .IsRequired();
            entity.Property(e => e.OffersJson).IsRequired();
            entity.Property(e => e.FetchedAtUtc).IsRequired();
        });
    }
}
