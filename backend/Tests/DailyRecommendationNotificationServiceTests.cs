using System.Globalization;
using System.Text.Json;
using Application;
using Application.Messaging;
using Base.Message;
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

    // 2026-07-15 05:00Z == 08:00 in Europe/Tallinn (summer, UTC+3). Local send date is 2026-07-15.
    private static readonly DateTimeOffset FakeNow = new(2026, 7, 15, 5, 0, 0, TimeSpan.Zero);
    private static readonly DateOnly LocalDate = new(2026, 7, 15);

    [Fact]
    public async Task RunAsync_ParsesPriceToInvariantDecimal_AndSplitsOfferWindow()
    {
        await using var context = TestAppDbContextFactory.CreateInMemory();
        var userId = AddUser(context, sendNotifications: true, isEnabled: true);
        var restaurant = AddRestaurantForUser(context, userId, "Bistro One", "11:00-14:00", fetchable: true);
        await context.SaveChangesAsync();

        var fetch = new FakeOfferFetchService();
        fetch.SetSuccess(restaurant.Id, OffersJson(("Soup", "4,50 €"), ("Water", null), ("Pasta", "6 €")));

        var publisher = new FakeEventPublisher();
        var service = CreateService(context, new FakeOfferCacheRepository(), fetch, publisher);

        await service.RunAsync();

        var envelope = SinglePublished(publisher);
        Assert.Equal("food-app", envelope.Source);
        Assert.Equal("food-app", envelope.Tenant);
        Assert.Equal("lunch-recommendation", envelope.Action);
        Assert.Equal("1.0", envelope.ContentVersion);

        var row = Assert.Single(envelope.Content.RecommendationRows);
        Assert.Equal("Bistro One", row.RestaurantName);
        Assert.Equal("11:00", row.OfferTimeFrom);
        Assert.Equal("14:00", row.OfferTimeUntil);
        Assert.Equal($"https://app.example.com/restaurants/{restaurant.Id}", row.Link);
        Assert.Equal("EUR", envelope.Content.Currency);

        // Water has no parseable price and is dropped; Soup/Pasta become invariant decimal strings.
        Assert.Collection(row.Offers,
            soup =>
            {
                Assert.Equal("Soup", soup.OfferText);
                Assert.Equal("4.50", soup.OfferPrice);
            },
            pasta =>
            {
                Assert.Equal("Pasta", pasta.OfferText);
                Assert.Equal("6", pasta.OfferPrice);
            });
    }

    [Fact]
    public async Task RunAsync_DerivesDeterministicIdAndExpiration_FromEarliestWindow()
    {
        await using var context = TestAppDbContextFactory.CreateInMemory();
        var userId = AddUser(context, sendNotifications: true, isEnabled: true);
        var early = AddRestaurantForUser(context, userId, "Closes 13", "11:00-13:00", fetchable: true);
        var late = AddRestaurantForUser(context, userId, "Closes 15", "11:00-15:00", fetchable: true);
        await context.SaveChangesAsync();

        var fetch = new FakeOfferFetchService();
        fetch.SetSuccess(early.Id, OffersJson(("A", "5 €")));
        fetch.SetSuccess(late.Id, OffersJson(("B", "5 €")));

        var publisher = new FakeEventPublisher();
        var service = CreateService(context, new FakeOfferCacheRepository(), fetch, publisher);

        await service.RunAsync();

        var published = Assert.Single(publisher.Published);
        var envelope = (BaseEventEnvelope<LunchRecommendationContent>)published.Envelope;

        var expectedId = DeterministicGuid
            .CreateV5(DeterministicGuid.LunchRecommendationNamespace, $"{userId}:2026-07-15")
            .ToString();
        Assert.Equal(expectedId, envelope.Id);

        // Earliest window ends 13:00 Tallinn == 10:00Z; from 05:00Z that is 5h = 18_000_000 ms.
        Assert.Equal("18000000", published.Expiration);
    }

    [Fact]
    public async Task RunAsync_RecipientWithNoOffers_PublishesNothing()
    {
        await using var context = TestAppDbContextFactory.CreateInMemory();
        var userId = AddUser(context, sendNotifications: true, isEnabled: true);
        var restaurant = AddRestaurantForUser(context, userId, "Empty", "11:00-14:00", fetchable: true);
        await context.SaveChangesAsync();

        var fetch = new FakeOfferFetchService();
        fetch.SetSuccess(restaurant.Id, "[]");

        var publisher = new FakeEventPublisher();
        var service = CreateService(context, new FakeOfferCacheRepository(), fetch, publisher);

        await service.RunAsync();

        Assert.Empty(publisher.Published);
    }

    [Fact]
    public async Task RunAsync_RestaurantWithNoParseablePrice_IsOmitted()
    {
        await using var context = TestAppDbContextFactory.CreateInMemory();
        var userId = AddUser(context, sendNotifications: true, isEnabled: true);
        var restaurant = AddRestaurantForUser(context, userId, "Unpriced", "11:00-14:00", fetchable: true);
        await context.SaveChangesAsync();

        var fetch = new FakeOfferFetchService();
        fetch.SetSuccess(restaurant.Id, OffersJson(("Soup", null), ("Water", "free")));

        var publisher = new FakeEventPublisher();
        var service = CreateService(context, new FakeOfferCacheRepository(), fetch, publisher);

        await service.RunAsync();

        // Both offers unpriced -> restaurant omitted -> no rows -> nothing published.
        Assert.Empty(publisher.Published);
    }

    [Fact]
    public async Task RunAsync_OfferWindowAlreadyEnded_IsOmitted()
    {
        await using var context = TestAppDbContextFactory.CreateInMemory();
        var userId = AddUser(context, sendNotifications: true, isEnabled: true);
        // 07:00 Tallinn == 04:00Z, before the 05:00Z fake now -> window already ended.
        var restaurant = AddRestaurantForUser(context, userId, "Breakfast", "06:00-07:00", fetchable: true);
        await context.SaveChangesAsync();

        var fetch = new FakeOfferFetchService();
        fetch.SetSuccess(restaurant.Id, OffersJson(("Porridge", "3 €")));

        var publisher = new FakeEventPublisher();
        var service = CreateService(context, new FakeOfferCacheRepository(), fetch, publisher);

        await service.RunAsync();

        Assert.Empty(publisher.Published);
    }

    [Fact]
    public async Task RunAsync_ExcludesOptedOutAndDisabledUsers()
    {
        await using var context = TestAppDbContextFactory.CreateInMemory();
        var enabledOptedIn = AddUser(context, sendNotifications: true, isEnabled: true);
        var optedOut = AddUser(context, sendNotifications: false, isEnabled: true);
        var disabled = AddUser(context, sendNotifications: true, isEnabled: false);

        foreach (var userId in new[] { enabledOptedIn, optedOut, disabled })
        {
            var restaurant = AddRestaurantForUser(context, userId, $"R-{userId:N}", "11:00-14:00", fetchable: false);
            SetFreshCache(context, restaurant.Id);
        }

        await context.SaveChangesAsync();

        var cache = BuildCache(context);
        var publisher = new FakeEventPublisher();
        var service = CreateService(context, cache, new FakeOfferFetchService(), publisher);

        await service.RunAsync();

        var envelope = SinglePublished(publisher);
        var expectedEmail = (await context.AppUsers.FindAsync(enabledOptedIn))!.Email;
        Assert.Equal(expectedEmail, envelope.Content.Email);
    }

    [Fact]
    public async Task RunAsync_SecondRunSameDay_SendsNothing()
    {
        await using var context = TestAppDbContextFactory.CreateInMemory();
        var userId = AddUser(context, sendNotifications: true, isEnabled: true);
        var restaurant = AddRestaurantForUser(context, userId, "Bistro", "11:00-14:00", fetchable: true);
        await context.SaveChangesAsync();

        var fetch = new FakeOfferFetchService();
        fetch.SetSuccess(restaurant.Id, OffersJson(("Soup", "4 €")));

        var publisher = new FakeEventPublisher();
        var store = new PublishedRecommendationStore(context);
        var service = CreateService(context, new FakeOfferCacheRepository(), fetch, publisher, store);

        await service.RunAsync();
        await service.RunAsync();

        Assert.Single(publisher.Published);
    }

    [Fact]
    public async Task RunAsync_UnconfirmedPublish_IsNotRecorded_AndRetriesNextRun()
    {
        await using var context = TestAppDbContextFactory.CreateInMemory();
        var userId = AddUser(context, sendNotifications: true, isEnabled: true);
        var restaurant = AddRestaurantForUser(context, userId, "Bistro", "11:00-14:00", fetchable: true);
        await context.SaveChangesAsync();

        var fetch = new FakeOfferFetchService();
        fetch.SetSuccess(restaurant.Id, OffersJson(("Soup", "4 €")));

        var deterministicId = DeterministicGuid
            .CreateV5(DeterministicGuid.LunchRecommendationNamespace, $"{userId}:2026-07-15")
            .ToString();

        var publisher = new FakeEventPublisher();
        publisher.FailIds.Add(deterministicId);
        var store = new PublishedRecommendationStore(context);
        var service = CreateService(context, new FakeOfferCacheRepository(), fetch, publisher, store);

        await service.RunAsync();
        Assert.Empty(publisher.Published);
        Assert.False(await store.IsPublishedAsync(userId, LocalDate, default));

        // Broker recovers: the same deterministic id is republished on the next run.
        publisher.FailIds.Clear();
        await service.RunAsync();

        var envelope = SinglePublished(publisher);
        Assert.Equal(deterministicId, envelope.Id);
        Assert.True(await store.IsPublishedAsync(userId, LocalDate, default));
    }

    private static DailyRecommendationNotificationService CreateService(
        AppDbContext context,
        IOfferCacheRepository cache,
        IOfferFetchService fetch,
        FakeEventPublisher publisher,
        IPublishedRecommendationStore? store = null)
    {
        return new DailyRecommendationNotificationService(
            new AppUserRepository(context, new AppUserEntityMapper()),
            new EnvironmentRestaurantRepository(context, new EnvironmentRestaurantEntityMapper()),
            cache,
            fetch,
            new OfferCacheOptions { Ttl = TimeSpan.FromHours(1) },
            publisher,
            store ?? new PublishedRecommendationStore(context),
            new MessagingOptions { Slug = "food-app", UsersQueue = "food-app.users" },
            new DailyRecommendationNotificationOptions
            {
                AppBaseUrl = "https://app.example.com",
                RestaurantPathTemplate = "/restaurants/{restaurantId}",
                WheelPath = "/wheel",
                Currency = "EUR",
                TimeZone = "Europe/Tallinn"
            },
            new FixedTimeProvider(FakeNow),
            NullLogger<DailyRecommendationNotificationService>.Instance);
    }

    private static BaseEventEnvelope<LunchRecommendationContent> SinglePublished(FakeEventPublisher publisher)
        => (BaseEventEnvelope<LunchRecommendationContent>)Assert.Single(publisher.Published).Envelope;

    private readonly Dictionary<Guid, OfferCacheEntry> _freshCache = new();

    private void SetFreshCache(AppDbContext context, Guid restaurantId)
        => _freshCache[restaurantId] = new OfferCacheEntry
        {
            RestaurantId = restaurantId,
            BusinessDate = LocalDate,
            OffersJson = OffersJson(("Special", "5 €")),
            FetchedAtUtc = FakeNow.UtcDateTime
        };

    private IOfferCacheRepository BuildCache(AppDbContext context)
    {
        var cache = new FakeOfferCacheRepository();
        foreach (var (restaurantId, entry) in _freshCache)
        {
            cache.Set(restaurantId, entry);
        }

        return cache;
    }

    private static string OffersJson(params (string Text, string? Price)[] offers)
    {
        var items = offers
            .Select(offer => new DailyOfferItem { Text = offer.Text, PriceText = offer.Price })
            .ToList();
        return JsonSerializer.Serialize(items, JsonOptions);
    }

    private static Guid AddUser(AppDbContext context, bool sendNotifications, bool isEnabled)
    {
        var id = Guid.NewGuid();
        var user = new AppUserEntity
        {
            Id = id,
            Email = $"{id:N}@example.com",
            Username = id.ToString("N"),
            FullName = "Test User",
            Locale = "et",
            SendNotifications = sendNotifications,
            IsEnabled = isEnabled
        };
        Stamp(user);
        context.AppUsers.Add(user);
        return id;
    }

    private static RestaurantEntity AddRestaurantForUser(
        AppDbContext context,
        Guid userId,
        string name,
        string offerTimeText,
        bool fetchable)
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
            OfferTimeText = offerTimeText,
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
