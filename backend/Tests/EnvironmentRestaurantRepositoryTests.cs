using DataAccess;
using DataAccess.Context;
using Domain;
using DTO.DataAccess;
using DTO.DataAccess.Mappers;

namespace Tests;

public class EnvironmentRestaurantRepositoryTests
{
    [Fact]
    public async Task GetDailyRecommendationRestaurantCandidatesAsync_FlattensAllEnvironments_AndDeduplicatesByRestaurantId()
    {
        await using var context = TestAppDbContextFactory.CreateInMemory();
        var userId = Guid.NewGuid();

        var r1 = AddRestaurant(context, "Bistro One", hasOffers: true);
        var r2 = AddRestaurant(context, "Bistro Two", hasOffers: true);
        var envA = AddEnvironment(context, userId, "Env A");
        var envB = AddEnvironment(context, userId, "Env B");
        // r1 appears in both environments; r2 only in B.
        AddMembership(context, userId, envA, r1);
        AddMembership(context, userId, envB, r1);
        AddMembership(context, userId, envB, r2);
        await context.SaveChangesAsync();

        var candidates = await CreateRepository(context)
            .GetDailyRecommendationRestaurantCandidatesAsync(userId);

        Assert.Equal(2, candidates.Count);
        Assert.Single(candidates, c => c.RestaurantId == r1.Id);
        Assert.Single(candidates, c => c.RestaurantId == r2.Id);
    }

    [Fact]
    public async Task GetDailyRecommendationRestaurantCandidatesAsync_ExcludesRestaurantsWithoutOffers()
    {
        await using var context = TestAppDbContextFactory.CreateInMemory();
        var userId = Guid.NewGuid();

        var withOffers = AddRestaurant(context, "Has Offers", hasOffers: true);
        var withoutOffers = AddRestaurant(context, "No Offers", hasOffers: false);
        var env = AddEnvironment(context, userId, "Env");
        AddMembership(context, userId, env, withOffers);
        AddMembership(context, userId, env, withoutOffers);
        await context.SaveChangesAsync();

        var candidates = await CreateRepository(context)
            .GetDailyRecommendationRestaurantCandidatesAsync(userId);

        Assert.Single(candidates);
        Assert.Equal(withOffers.Id, candidates[0].RestaurantId);
    }

    [Fact]
    public async Task GetDailyRecommendationRestaurantCandidatesAsync_ComputesFetchableFlag()
    {
        await using var context = TestAppDbContextFactory.CreateInMemory();
        var userId = Guid.NewGuid();

        var htmlProvider = AddProvider(context, "Html", EOfferProviderType.Html);
        var manualProvider = AddProvider(context, "Manual", EOfferProviderType.Manual);

        var fetchable = AddRestaurant(context, "Fetchable", hasOffers: true, provider: htmlProvider);
        var manual = AddRestaurant(context, "Manual", hasOffers: true, provider: manualProvider);
        var noProvider = AddRestaurant(context, "No Provider", hasOffers: true);

        var env = AddEnvironment(context, userId, "Env");
        AddMembership(context, userId, env, fetchable);
        AddMembership(context, userId, env, manual);
        AddMembership(context, userId, env, noProvider);
        await context.SaveChangesAsync();

        var candidates = await CreateRepository(context)
            .GetDailyRecommendationRestaurantCandidatesAsync(userId);

        Assert.True(candidates.Single(c => c.RestaurantId == fetchable.Id).IsFetchable);
        Assert.False(candidates.Single(c => c.RestaurantId == manual.Id).IsFetchable);
        Assert.False(candidates.Single(c => c.RestaurantId == noProvider.Id).IsFetchable);
    }

    [Fact]
    public async Task GetDailyRecommendationRestaurantCandidatesAsync_ScopesByUser()
    {
        await using var context = TestAppDbContextFactory.CreateInMemory();
        var userId = Guid.NewGuid();
        var otherUserId = Guid.NewGuid();

        var mine = AddRestaurant(context, "Mine", hasOffers: true);
        var theirs = AddRestaurant(context, "Theirs", hasOffers: true);
        AddMembership(context, userId, AddEnvironment(context, userId, "Mine"), mine);
        AddMembership(context, otherUserId, AddEnvironment(context, otherUserId, "Theirs"), theirs);
        await context.SaveChangesAsync();

        var candidates = await CreateRepository(context)
            .GetDailyRecommendationRestaurantCandidatesAsync(userId);

        Assert.Single(candidates);
        Assert.Equal(mine.Id, candidates[0].RestaurantId);
    }

    [Fact]
    public async Task GetDailyRecommendationRestaurantCandidatesAsync_ScopedToEnvironment_ReturnsOnlyThatEnvironmentsRestaurants()
    {
        await using var context = TestAppDbContextFactory.CreateInMemory();
        var userId = Guid.NewGuid();

        var inScope = AddRestaurant(context, "In Scope", hasOffers: true);
        var outOfScope = AddRestaurant(context, "Out Of Scope", hasOffers: true);
        var envA = AddEnvironment(context, userId, "Env A");
        var envB = AddEnvironment(context, userId, "Env B");
        AddMembership(context, userId, envA, inScope);
        AddMembership(context, userId, envB, outOfScope);
        await context.SaveChangesAsync();

        var candidates = await CreateRepository(context)
            .GetDailyRecommendationRestaurantCandidatesAsync(userId, envA.Id);

        Assert.Single(candidates);
        Assert.Equal(inScope.Id, candidates[0].RestaurantId);
        Assert.DoesNotContain(candidates, c => c.RestaurantId == outOfScope.Id);
    }

    private static EnvironmentRestaurantRepository CreateRepository(AppDbContext context)
    {
        return new EnvironmentRestaurantRepository(context, new EnvironmentRestaurantEntityMapper());
    }

    private static OfferProviderEntity AddProvider(AppDbContext context, string name, EOfferProviderType type)
    {
        var provider = new OfferProviderEntity
        {
            Id = Guid.NewGuid(),
            Name = name,
            ProviderType = type,
            OfferLocator = "loc",
            OfferTextLocator = "text",
            OfferPriceLocator = "price"
        };
        Stamp(provider);
        context.OfferProviders.Add(provider);
        return provider;
    }

    private static RestaurantEntity AddRestaurant(
        AppDbContext context, string name, bool hasOffers, OfferProviderEntity? provider = null)
    {
        var restaurant = new RestaurantEntity
        {
            Id = Guid.NewGuid(),
            Name = name,
            City = "City",
            OfferTimeText = "11:00-14:00",
            ParkingInfo = "parking",
            OpeningInfo = "opening",
            HasOffers = hasOffers,
            OfferProviderId = provider?.Id,
            OfferProvider = provider
        };
        Stamp(restaurant);
        context.Restaurants.Add(restaurant);
        return restaurant;
    }

    private static DiningEnvironmentEntity AddEnvironment(AppDbContext context, Guid userId, string name)
    {
        var environment = new DiningEnvironmentEntity
        {
            Id = Guid.NewGuid(),
            Name = name,
            UserId = userId
        };
        Stamp(environment);
        context.DiningEnvironments.Add(environment);
        return environment;
    }

    private static void AddMembership(
        AppDbContext context, Guid userId, DiningEnvironmentEntity environment, RestaurantEntity restaurant)
    {
        var membership = new EnvironmentRestaurantEntity
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            EnvironmentId = environment.Id,
            Environment = environment,
            RestaurantId = restaurant.Id,
            Restaurant = restaurant
        };
        Stamp(membership);
        context.EnvironmentRestaurants.Add(membership);
    }

    private static void Stamp(dynamic entity)
    {
        var now = DateTime.UtcNow;
        entity.CreatedBy = "test";
        entity.UpdatedBy = "test";
        entity.CreatedAt = now;
        entity.UpdatedAt = now;
        entity.ConcurrencyToken = Guid.NewGuid().ToString("N");
    }
}
