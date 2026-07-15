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
    private const string EmptyOffersJson = "[]";

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public async Task<IMethodResponse<string>> GetDailyOffersAsync(Guid restaurantId, CancellationToken ct = default)
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
            return MethodResponse<string>.Failure(new Error(
                ErrorDefaults.Codes.NotFound,
                "Restaurant not found."));
        }

        var now = DateTime.UtcNow;
        var businessDate = DateOnly.FromDateTime(now.Date);
        var cacheEntry = await offerCacheRepository.GetByRestaurantIdAsync(restaurantId, ct);

        if (IsFresh(cacheEntry, businessDate, now))
        {
            return MethodResponse<string>.Success(cacheEntry!.OffersJson);
        }

        if (restaurant.OfferProviderId == null)
        {
            return MethodResponse<string>.Success(cacheEntry?.OffersJson ?? EmptyOffersJson);
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
            return MethodResponse<string>.Failure(new Error(
                ErrorDefaults.Codes.NotFound,
                "OfferProvider not found."));
        }

        if (provider.ProviderType == EOfferProviderType.Manual)
        {
            return MethodResponse<string>.Success(cacheEntry?.OffersJson ?? EmptyOffersJson);
        }

        var fetcher = offerProviderFetcherResolver.Resolve(provider.ProviderType);
        if (fetcher == null)
        {
            return MethodResponse<string>.Failure(new Error(
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

        var offersJson = JsonSerializer.Serialize(fetchResult.Value ?? [], JsonOptions);
        await offerCacheRepository.UpsertAsync(new OfferCacheEntry
        {
            RestaurantId = restaurantId,
            BusinessDate = businessDate,
            OffersJson = offersJson,
            FetchedAtUtc = now
        }, ct);

        return MethodResponse<string>.Success(offersJson);
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

    private static IMethodResponse<string> Failure(IError? error, string fallbackCode, string fallbackMessage)
    {
        return MethodResponse<string>.Failure(error ?? new Error(fallbackCode, fallbackMessage));
    }
}
