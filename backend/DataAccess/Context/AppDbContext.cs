using System.Text.Json;
using DTO.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;

namespace DataAccess.Context;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<AppUserEntity> AppUsers => Set<AppUserEntity>();
    public DbSet<OfferProviderEntity> OfferProviders => Set<OfferProviderEntity>();
    public DbSet<RestaurantEntity> Restaurants => Set<RestaurantEntity>();
    public DbSet<DiningEnvironmentEntity> DiningEnvironments => Set<DiningEnvironmentEntity>();
    public DbSet<EnvironmentRestaurantEntity> EnvironmentRestaurants => Set<EnvironmentRestaurantEntity>();
    public DbSet<FavouriteEntity> Favourites => Set<FavouriteEntity>();
    public DbSet<UserWheelEntity> UserWheels => Set<UserWheelEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.HasDefaultSchema("food");

        modelBuilder.Entity<AppUserEntity>(entity =>
        {
            entity.ToTable("AppUsers");
            entity.HasIndex(e => e.Email);
            entity.HasIndex(e => e.Username);
            entity.HasIndex(e => e.NotificationEnvironmentId);

            // Optional notification scope. No navigation on AppUserEntity (kept lean); deleting the
            // referenced DiningEnvironment sets this FK to null rather than blocking the delete.
            entity
                .HasOne<DiningEnvironmentEntity>()
                .WithMany()
                .HasForeignKey(e => e.NotificationEnvironmentId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<OfferProviderEntity>(entity =>
        {
            entity.ToTable("OfferProviders");
            entity.HasIndex(e => e.Name);

            entity.Property(e => e.Name).HasMaxLength(256).IsRequired();
            entity.Property(e => e.OfferLocator).HasMaxLength(1024).IsRequired();
            entity.Property(e => e.OfferTextLocator).HasMaxLength(1024).IsRequired();
            entity.Property(e => e.OfferPriceLocator).HasMaxLength(1024).IsRequired();
        });

        modelBuilder.Entity<RestaurantEntity>(entity =>
        {
            entity.ToTable("Restaurants");
            entity.HasIndex(e => e.Name);
            entity.HasIndex(e => e.City);
            entity.HasIndex(e => e.OfferProviderId);
            // Backs the map viewport (bounding-box) query in RestaurantRepository.GetInBoundsAsync.
            entity.HasIndex(e => new { e.Latitude, e.Longitude });

            entity.Property(e => e.Name).HasMaxLength(256).IsRequired();
            entity.Property(e => e.City).HasMaxLength(128).IsRequired();
            entity.Property(e => e.OfferTimeText).HasMaxLength(512).IsRequired();
            entity.Property(e => e.ParkingInfo).HasMaxLength(1024).IsRequired();
            entity.Property(e => e.OpeningInfo).HasMaxLength(1024).IsRequired();
            entity.Property(e => e.OffersResourceUrl).HasMaxLength(2048);

            entity
                .HasOne(e => e.OfferProvider)
                .WithMany(e => e.Restaurants)
                .HasForeignKey(e => e.OfferProviderId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<DiningEnvironmentEntity>(entity =>
        {
            entity.ToTable("DiningEnvironments");
            entity.HasIndex(e => e.UserId);

            entity.Property(e => e.Name).HasMaxLength(256).IsRequired();
            entity.Property(e => e.Description).HasMaxLength(1024);
        });

        modelBuilder.Entity<EnvironmentRestaurantEntity>(entity =>
        {
            entity.ToTable("EnvironmentRestaurants");
            entity.HasIndex(e => new { e.UserId, e.EnvironmentId, e.RestaurantId }).IsUnique();

            entity
                .HasOne(e => e.Environment)
                .WithMany(e => e.EnvironmentRestaurants)
                .HasForeignKey(e => e.EnvironmentId)
                .OnDelete(DeleteBehavior.Cascade);

            entity
                .HasOne(e => e.Restaurant)
                .WithMany()
                .HasForeignKey(e => e.RestaurantId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<FavouriteEntity>(entity =>
        {
            entity.ToTable("Favourites");
            entity.HasIndex(e => new { e.UserId, e.RestaurantId }).IsUnique();

            entity.Property(e => e.Note).HasMaxLength(1024);

            entity
                .HasOne(e => e.Restaurant)
                .WithMany()
                .HasForeignKey(e => e.RestaurantId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<UserWheelEntity>(entity =>
        {
            entity.ToTable("UserWheels");
            entity.HasIndex(e => e.UserId);

            entity.Property(e => e.Name).HasMaxLength(256).IsRequired();

            entity
                .Property(e => e.RestaurantNames)
                .HasColumnType("jsonb")
                .HasConversion(
                    names => JsonSerializer.Serialize(names, (JsonSerializerOptions?)null),
                    json => JsonSerializer.Deserialize<List<string>>(json, (JsonSerializerOptions?)null) ?? new List<string>(),
                    new ValueComparer<List<string>>(
                        (left, right) => left!.SequenceEqual(right!),
                        names => names.Aggregate(0, (hash, name) => HashCode.Combine(hash, name.GetHashCode())),
                        names => names.ToList()));
        });
    }
}
