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
    public DbSet<ProcessedMessageEntity> ProcessedMessages => Set<ProcessedMessageEntity>();
    public DbSet<PublishedRecommendationEntity> PublishedRecommendations => Set<PublishedRecommendationEntity>();

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

            // Existing users predate identity enabled/disabled tracking and are enabled; the column
            // default backfills them to true rather than silently disabling every recipient.
            entity.Property(e => e.IsEnabled).HasDefaultValue(true);

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
        });

        modelBuilder.Entity<RestaurantEntity>(entity =>
        {
            entity.ToTable("Restaurants");
            entity.HasIndex(e => e.Name);
            entity.HasIndex(e => e.City);
            entity.HasIndex(e => e.OfferProviderId);
            // Backs the map viewport (bounding-box) query in RestaurantRepository.GetInBoundsAsync.
            entity.HasIndex(e => new { e.Latitude, e.Longitude });

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

            entity
                .HasOne(e => e.Restaurant)
                .WithMany()
                .HasForeignKey(e => e.RestaurantId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ProcessedMessageEntity>(entity =>
        {
            entity.ToTable("ProcessedMessages");
            // Envelope id is the idempotency key: the primary key already enforces uniqueness, so a
            // redelivery's insert fails and the consumer acks the duplicate.
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedNever();
        });

        modelBuilder.Entity<PublishedRecommendationEntity>(entity =>
        {
            entity.ToTable("PublishedRecommendations");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedNever();
            // One send per recipient per local date makes a same-day re-run a no-op.
            entity.HasIndex(e => new { e.UserId, e.LocalDate }).IsUnique();
        });

        modelBuilder.Entity<UserWheelEntity>(entity =>
        {
            entity.ToTable("UserWheels");
            entity.HasIndex(e => e.UserId);

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
