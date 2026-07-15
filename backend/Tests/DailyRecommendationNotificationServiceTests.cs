using System.Text.Json;
using Application;
using Contracts.Application;
using Contracts.DataAccess;
using Contracts.External;
using DataAccess;
using DataAccess.Context;
using Domain;
using DTO.DataAccess;
using DTO.DataAccess.Mappers;
using DTO.Messaging;
using Microsoft.Extensions.Logging.Abstractions;

namespace Tests;

public class DailyRecommendationNotificationServiceTests
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    [Fact]
    public async Task RunAsync_FreshCache_BuildsRowWithRawPriceAndPlainDeepLinks()
    {
        await using var context = TestAppDbContextFactory.CreateInMemory();
        var userId = AddOptedInUser(context);
        var restaurant = AddRestaurantForUser(context, userId, "Bistro One", fetchable: true);
        await context.SaveChangesAsync();

        var cache = new FakeOfferCacheRepository();
        cache.Set(restaurant.Id, FreshEntry(restaurant.Id,
            OffersJson(("Soup", "4,50 €"), ("Water", null))));

        var publisher = new FakeEventPublisher();
        var service = CreateService(context, cache, new FakeOfferFetchService(), publisher);

        await service.RunAsync();

        var content = Assert.IsType<DailyLunchRecommendationEvent>(Assert.Single(publisher.Published)).Content;
        var row = Assert.Single(content.RecommendationRows);
        Assert.Equal("Bistro One", row.RestaurantName);
        Assert.Equal($"https://app.example.com/restaurants/{restaurant.Id}", row.Link);
        Assert.Equal("https://app.example.com/wheel", content.LinkToUserWheel);
        Assert.Equal("EUR", content.Currency);

        Assert.Collection(row.Offers,
            first =>
            {
                Assert.Equal("Soup", first.OfferText);
                Assert.Equal("4,50 €", first.OfferPrice);
            },
            second =>
            {
                Assert.Equal("Water", second.OfferText);
                Assert.Null(second.OfferPrice);
            });
    }

    [Fact]
    public async Task RunAsync_NonFetchableWithoutFreshCache_ExcludesRestaurantButStillPublishes()
    {
        await using var context = TestAppDbContextFactory.CreateInMemory();
        var userId = AddOptedInUser(context);
        AddRestaurantForUser(context, userId, "No Provider", fetchable: false);
        await context.SaveChangesAsync();

        var publisher = new FakeEventPublisher();
        var service = CreateService(context, new FakeOfferCacheRepository(), new FakeOfferFetchService(), publisher);

        await service.RunAsync();

        var content = Assert.IsType<DailyLunchRecommendationEvent>(Assert.Single(publisher.Published)).Content;
        Assert.Empty(content.RecommendationRows);
    }

    [Fact]
    public async Task RunAsync_FetchFailure_ExcludesOnlyThatRestaurant()
    {
        await using var context = TestAppDbContextFactory.CreateInMemory();
        var userId = AddOptedInUser(context);
        var ok = AddRestaurantForUser(context, userId, "Fetch OK", fetchable: true);
        var failing = AddRestaurantForUser(context, userId, "Fetch Fails", fetchable: true);
        await context.SaveChangesAsync();

        var fetch = new FakeOfferFetchService();
        fetch.SetSuccess(ok.Id, OffersJson(("Pasta", "6 €")));
        fetch.SetFailure(failing.Id);

        var publisher = new FakeEventPublisher();
        var service = CreateService(context, new FakeOfferCacheRepository(), fetch, publisher);

        await service.RunAsync();

        var content = Assert.IsType<DailyLunchRecommendationEvent>(Assert.Single(publisher.Published)).Content;
        var row = Assert.Single(content.RecommendationRows);
        Assert.Equal("Fetch OK", row.RestaurantName);
    }

    [Fact]
    public async Task RunAsync_EmptyOffers_ExcludesRestaurant()
    {
        await using var context = TestAppDbContextFactory.CreateInMemory();
        var userId = AddOptedInUser(context);
        var restaurant = AddRestaurantForUser(context, userId, "Empty", fetchable: true);
        await context.SaveChangesAsync();

        var fetch = new FakeOfferFetchService();
        fetch.SetSuccess(restaurant.Id, "[]");

        var publisher = new FakeEventPublisher();
        var service = CreateService(context, new FakeOfferCacheRepository(), fetch, publisher);

        await service.RunAsync();

        var content = Assert.IsType<DailyLunchRecommendationEvent>(Assert.Single(publisher.Published)).Content;
        Assert.Empty(content.RecommendationRows);
    }

    [Fact]
    public async Task RunAsync_PublishesOneEventPerOptedInUser()
    {
        await using var context = TestAppDbContextFactory.CreateInMemory();
        AddOptedInUser(context);
        AddOptedInUser(context);
        AddOptedOutUser(context);
        await context.SaveChangesAsync();

        var publisher = new FakeEventPublisher();
        var service = CreateService(context, new FakeOfferCacheRepository(), new FakeOfferFetchService(), publisher);

        await service.RunAsync();

        Assert.Equal(2, publisher.Published.Count);
    }

    private static DailyRecommendationNotificationService CreateService(
        AppDbContext context,
        IOfferCacheRepository cache,
        IOfferFetchService fetch,
        FakeEventPublisher publisher)
    {
        return new DailyRecommendationNotificationService(
            new AppUserRepository(context, new AppUserEntityMapper()),
            new EnvironmentRestaurantRepository(context, new EnvironmentRestaurantEntityMapper()),
            cache,
            fetch,
            new OfferCacheOptions { Ttl = TimeSpan.FromHours(1) },
            publisher,
            new DailyRecommendationNotificationOptions
            {
                AppBaseUrl = "https://app.example.com",
                RestaurantPathTemplate = "/restaurants/{restaurantId}",
                WheelPath = "/wheel",
                Currency = "EUR"
            },
            NullLogger<DailyRecommendationNotificationService>.Instance);
    }

    private static OfferCacheEntry FreshEntry(Guid restaurantId, string offersJson) => new()
    {
        RestaurantId = restaurantId,
        BusinessDate = DateOnly.FromDateTime(DateTime.UtcNow.Date),
        OffersJson = offersJson,
        FetchedAtUtc = DateTime.UtcNow
    };

    private static string OffersJson(params (string Text, string? Price)[] offers)
    {
        var items = offers
            .Select(offer => new DailyOfferItem { Text = offer.Text, PriceText = offer.Price })
            .ToList();
        return JsonSerializer.Serialize(items, JsonOptions);
    }

    private static Guid AddOptedInUser(AppDbContext context) => AddUser(context, enabled: true);

    private static void AddOptedOutUser(AppDbContext context) => AddUser(context, enabled: false);

    private static Guid AddUser(AppDbContext context, bool enabled)
    {
        var id = Guid.NewGuid();
        var user = new AppUserEntity
        {
            Id = id,
            Email = $"{id:N}@example.com",
            Username = id.ToString("N"),
            FullName = "Test User",
            Locale = "et",
            SendNotifications = enabled
        };
        Stamp(user);
        context.AppUsers.Add(user);
        return id;
    }

    private static RestaurantEntity AddRestaurantForUser(AppDbContext context, Guid userId, string name, bool fetchable)
    {
        OfferProviderEntity? provider = null;
        if (fetchable)
        {
            provider = new OfferProviderEntity
            {
                Id = Guid.NewGuid(),
                Name = $"{name} Provider",
                ProviderType = EOfferProviderType.Html,
                OfferLocator = "loc",
                OfferTextLocator = "text",
                OfferPriceLocator = "price"
            };
            Stamp(provider);
            context.OfferProviders.Add(provider);
        }

        var restaurant = new RestaurantEntity
        {
            Id = Guid.NewGuid(),
            Name = name,
            City = "City",
            OfferTimeText = "11:00-14:00",
            ParkingInfo = "parking",
            OpeningInfo = "opening",
            HasOffers = true,
            OfferProviderId = provider?.Id,
            OfferProvider = provider
        };
        Stamp(restaurant);
        context.Restaurants.Add(restaurant);

        var environment = new DiningEnvironmentEntity
        {
            Id = Guid.NewGuid(),
            Name = "Env",
            UserId = userId
        };
        Stamp(environment);
        context.DiningEnvironments.Add(environment);

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

        return restaurant;
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
