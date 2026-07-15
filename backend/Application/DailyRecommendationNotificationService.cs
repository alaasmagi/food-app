using System.Text.Json;
using Base.Contracts.Message;
using Contracts.Application;
using Contracts.DataAccess;
using Contracts.External;
using Domain;
using DTO.Messaging;
using Microsoft.Extensions.Logging;

namespace Application;

public class DailyRecommendationNotificationService(
    IAppUserRepository appUserRepository,
    IEnvironmentRestaurantRepository environmentRestaurantRepository,
    IOfferCacheRepository offerCacheRepository,
    IOfferFetchService offerFetchService,
    OfferCacheOptions offerCacheOptions,
    IBaseEventPublisher eventPublisher,
    DailyRecommendationNotificationOptions notificationOptions,
    ILogger<DailyRecommendationNotificationService> logger)
    : IDailyRecommendationNotificationService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public async Task RunAsync(CancellationToken ct = default)
    {
        var subscribers = await appUserRepository.GetNotificationSubscribersAsync(ct);
        logger.LogInformation("Publishing daily lunch recommendations for {SubscriberCount} opted-in users.", subscribers.Count);

        foreach (var user in subscribers)
        {
            ct.ThrowIfCancellationRequested();

            var content = await BuildContentAsync(user, ct);
            // One event per opted-in user per run, even when recommendationRows is empty.
            var recommendationEvent = new DailyLunchRecommendationEvent(DateTime.UtcNow, content);
            await eventPublisher.PublishAsync(AppMessageActions.DailyLunchRecommendation, recommendationEvent, ct);
        }
    }

    private async Task<DailyLunchRecommendationContent> BuildContentAsync(AppUser user, CancellationToken ct)
    {
        var candidates = await environmentRestaurantRepository
            .GetDailyRecommendationRestaurantCandidatesAsync(user.Id, user.NotificationEnvironmentId, ct);

        var rows = new List<RecommendationRow>();
        foreach (var candidate in candidates)
        {
            var offers = await ResolveOffersAsync(candidate, ct);
            if (offers is null || offers.Count == 0)
            {
                continue;
            }

            rows.Add(new RecommendationRow
            {
                RestaurantName = candidate.RestaurantName,
                Offers = offers
                    .Select(offer => new OfferLine
                    {
                        // Provider/cache text is passed through exactly: no trimming or normalization.
                        OfferText = offer.Text,
                        OfferPrice = offer.PriceText
                    })
                    .ToList(),
                OfferTimes = candidate.OfferTimeText,
                Link = BuildRestaurantLink(candidate.RestaurantId)
            });
        }

        return new DailyLunchRecommendationContent
        {
            Email = user.Email,
            FullName = user.FullName,
            Locale = user.Locale,
            Currency = notificationOptions.Currency,
            RecommendationRows = rows,
            LinkToUserWheel = BuildWheelLink()
        };
    }

    private async Task<IReadOnlyList<DailyOfferItem>?> ResolveOffersAsync(
        DailyRecommendationRestaurantCandidate candidate,
        CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        var businessDate = DateOnly.FromDateTime(now.Date);
        var cacheEntry = await offerCacheRepository.GetByRestaurantIdAsync(candidate.RestaurantId, ct);

        string offersJson;
        if (IsFresh(cacheEntry, businessDate, now))
        {
            offersJson = cacheEntry!.OffersJson;
        }
        else if (candidate.IsFetchable)
        {
            var fetchResult = await offerFetchService.GetDailyOffersAsync(candidate.RestaurantId, ct);
            if (!fetchResult.Successful || fetchResult.Value is null)
            {
                logger.LogWarning(
                    "Skipping restaurant {RestaurantId}: offer fetch failed ({Error}).",
                    candidate.RestaurantId,
                    fetchResult.Error);
                return null;
            }

            offersJson = fetchResult.Value;
        }
        else
        {
            // Not offer-capable through a provider and no fresh cache row: exclude.
            return null;
        }

        try
        {
            return JsonSerializer.Deserialize<List<DailyOfferItem>>(offersJson, JsonOptions);
        }
        catch (JsonException ex)
        {
            logger.LogWarning(
                ex,
                "Skipping restaurant {RestaurantId}: current offers could not be deserialized.",
                candidate.RestaurantId);
            return null;
        }
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

    private string BuildRestaurantLink(Guid restaurantId)
    {
        var path = notificationOptions.RestaurantPathTemplate
            .Replace("{restaurantId}", restaurantId.ToString());
        return CombineUrl(notificationOptions.AppBaseUrl, path);
    }

    private string BuildWheelLink()
    {
        return CombineUrl(notificationOptions.AppBaseUrl, notificationOptions.WheelPath);
    }

    private static string CombineUrl(string baseUrl, string path)
    {
        return $"{baseUrl.TrimEnd('/')}/{path.TrimStart('/')}";
    }
}
