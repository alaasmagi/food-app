using System.Text.Json;
using Base.Contracts.DTO;
using Base.DTO;
using Contracts.Application;
using Contracts.DataAccess;
using Contracts.External;
using Domain;

namespace Application;

public class OfferFetchService(
    IRestaurantRepository restaurantRepository,
    IOfferProviderRepository offerProviderRepository,
    IOfferCacheRepository offerCacheRepository,
    IOfferProviderFetcherResolver offerProviderFetcherResolver,
    OfferCacheOptions offerCacheOptions)
    : IOfferFetchService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public async Task<IMethodResponse<IReadOnlyCollection<DailyOfferItem>>> GetDailyOffersAsync(Guid restaurantId, CancellationToken ct = default)
    {
        var restaurantResult = await restaurantRepository.GetByIdAsync(restaurantId);
        if (!restaurantResult.Successful)
        {
            return Failure(
                restaurantResult.Error,
                ErrorDefaults.Codes.NotFound,
                "Restaurant not found.");
        }

        var restaurant = restaurantResult.Value;
        if (restaurant == null)
        {
            return MethodResponse<IReadOnlyCollection<DailyOfferItem>>.Failure(new Error(
                ErrorDefaults.Codes.NotFound,
                "Restaurant not found."));
        }

        var now = DateTime.UtcNow;
        var businessDate = DateOnly.FromDateTime(now.Date);
        var cacheEntry = await offerCacheRepository.GetByRestaurantIdAsync(restaurantId, ct);

        if (IsFresh(cacheEntry, businessDate, now))
        {
            return Success(cacheEntry!.OffersJson);
        }

        if (restaurant.OfferProviderId == null)
        {
            return Success(cacheEntry?.OffersJson);
        }

        var providerResult = await offerProviderRepository.GetByIdAsync(restaurant.OfferProviderId.Value);
        if (!providerResult.Successful)
        {
            return Failure(
                providerResult.Error,
                ErrorDefaults.Codes.NotFound,
                "OfferProvider not found.");
        }

        var provider = providerResult.Value;
        if (provider == null)
        {
            return MethodResponse<IReadOnlyCollection<DailyOfferItem>>.Failure(new Error(
                ErrorDefaults.Codes.NotFound,
                "OfferProvider not found."));
        }

        if (provider.ProviderType == EOfferProviderType.Manual)
        {
            return Success(cacheEntry?.OffersJson);
        }

        var fetcher = offerProviderFetcherResolver.Resolve(provider.ProviderType);
        if (fetcher == null)
        {
            return MethodResponse<IReadOnlyCollection<DailyOfferItem>>.Failure(new Error(
                OfferFetchErrorCodes.UnsupportedProviderType,
                $"OfferProvider type '{provider.ProviderType}' is not supported."));
        }

        var fetchResult = await fetcher.FetchAsync(restaurant, provider, ct);
        if (!fetchResult.Successful)
        {
            return Failure(
                fetchResult.Error,
                OfferFetchErrorCodes.FetchFailed,
                "Offer provider fetch failed.");
        }

        var offers = fetchResult.Value ?? [];
        var offersJson = JsonSerializer.Serialize(offers, JsonOptions);
        await offerCacheRepository.UpsertAsync(new OfferCacheEntry
        {
            RestaurantId = restaurantId,
            BusinessDate = businessDate,
            OffersJson = offersJson,
            FetchedAtUtc = now
        }, ct);

        return MethodResponse<IReadOnlyCollection<DailyOfferItem>>.Success(offers);
    }

    private bool IsFresh(OfferCacheEntry? cacheEntry, DateOnly businessDate, DateTime now)
    {
        if (cacheEntry == null || cacheEntry.BusinessDate != businessDate)
        {
            return false;
        }

        var fetchedAtUtc = cacheEntry.FetchedAtUtc.Kind == DateTimeKind.Utc
            ? cacheEntry.FetchedAtUtc
            : DateTime.SpecifyKind(cacheEntry.FetchedAtUtc, DateTimeKind.Utc);

        return fetchedAtUtc.Add(offerCacheOptions.Ttl) > now;
    }

    private static IMethodResponse<IReadOnlyCollection<DailyOfferItem>> Success(string? offersJson)
    {
        var offers = offersJson == null
            ? []
            : JsonSerializer.Deserialize<List<DailyOfferItem>>(offersJson, JsonOptions) ?? [];

        return MethodResponse<IReadOnlyCollection<DailyOfferItem>>.Success(offers);
    }

    private static IMethodResponse<IReadOnlyCollection<DailyOfferItem>> Failure(IError? error, string fallbackCode, string fallbackMessage)
    {
        return MethodResponse<IReadOnlyCollection<DailyOfferItem>>.Failure(error ?? new Error(fallbackCode, fallbackMessage));
    }
}
