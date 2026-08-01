using System.Globalization;
using System.Text.Json;
using Application.Messaging;
using Base.Contracts.Message;
using Base.Message;
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
    IPublishedRecommendationStore publishedStore,
    MessagingOptions messagingOptions,
    DailyRecommendationNotificationOptions notificationOptions,
    TimeProvider timeProvider,
    ILogger<DailyRecommendationNotificationService> logger)
    : IDailyRecommendationNotificationService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public async Task RunAsync(CancellationToken ct = default)
    {
        var timeZone = ResolveTimeZone();
        var nowUtc = timeProvider.GetUtcNow();
        var localDate = DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(nowUtc, timeZone).DateTime);

        var subscribers = await appUserRepository.GetNotificationSubscribersAsync(ct);
        logger.LogInformation(
            "Daily lunch recommendation batch for {LocalDate}: {SubscriberCount} opted-in, enabled recipients.",
            localDate,
            subscribers.Count);

        var published = 0;
        var skippedNoOffers = 0;
        var skippedAlreadySent = 0;
        var failedToConfirm = 0;

        foreach (var user in subscribers)
        {
            ct.ThrowIfCancellationRequested();

            // Re-run safety: a recipient already published for this local date is never sent twice.
            if (await publishedStore.IsPublishedAsync(user.Id, localDate, ct))
            {
                skippedAlreadySent++;
                continue;
            }

            var rows = await BuildRowsAsync(user, nowUtc, localDate, timeZone, ct);
            if (rows.Count == 0)
            {
                // No offers at all → publish nothing. An email with zero rows is worse than silence.
                skippedNoOffers++;
                logger.LogInformation("Skipped recipient {UserId}: no current offers to send.", user.Id);
                continue;
            }

            // The message dies in the queue at the end of the earliest offer window, so an email-hub
            // outage through lunch discards it rather than delivering it stale after the offers ended.
            var earliestWindowEndUtc = rows.Min(row => row.WindowEndUtc);
            var timeToLive = earliestWindowEndUtc - nowUtc;
            if (timeToLive <= TimeSpan.Zero)
            {
                skippedNoOffers++;
                logger.LogInformation("Skipped recipient {UserId}: earliest offer window already ended.", user.Id);
                continue;
            }

            var envelopeId = DeterministicGuid.CreateV5(
                DeterministicGuid.LunchRecommendationNamespace,
                $"{user.Id}:{localDate:yyyy-MM-dd}");

            var envelope = new BaseEventEnvelope<LunchRecommendationContent>
            {
                Id = envelopeId.ToString(),
                Source = messagingOptions.Slug,
                Tenant = messagingOptions.Slug,
                Action = LunchRecommendationContract.Action,
                Timestamp = BaseEventEnvelope<LunchRecommendationContent>.FormatTimestamp(nowUtc),
                ContentVersion = LunchRecommendationContract.ContentVersion,
                Content = BuildContent(user, rows)
            };

            var expiration = ((long)timeToLive.TotalMilliseconds).ToString(CultureInfo.InvariantCulture);

            var result = await eventPublisher.PublishAsync(envelope, expiration, ct);
            if (!result.Success)
            {
                // Unconfirmed means failed: do not record it, so the next run republishes the same
                // deterministic id (which email-hub deduplicates if it did arrive).
                failedToConfirm++;
                logger.LogError(
                    "Publish not confirmed for {EnvelopeId} (recipient {UserId}, action {Action}): {Reason}",
                    envelopeId,
                    user.Id,
                    envelope.Action,
                    result.FailureReason);
                continue;
            }

            await publishedStore.RecordPublishedAsync(envelopeId, user.Id, localDate, nowUtc.UtcDateTime, ct);
            published++;
        }

        logger.LogInformation(
            "Daily lunch recommendation batch for {LocalDate} complete: {Published} published, " +
            "{SkippedNoOffers} skipped (no current offers), {SkippedAlreadySent} skipped (already sent today), " +
            "{FailedToConfirm} failed to confirm.",
            localDate,
            published,
            skippedNoOffers,
            skippedAlreadySent,
            failedToConfirm);
    }

    private async Task<List<PreparedRow>> BuildRowsAsync(
        AppUser user,
        DateTimeOffset nowUtc,
        DateOnly localDate,
        TimeZoneInfo timeZone,
        CancellationToken ct)
    {
        var candidates = await environmentRestaurantRepository
            .GetDailyRecommendationRestaurantCandidatesAsync(user.Id, user.NotificationEnvironmentId, ct);

        var rows = new List<PreparedRow>();
        foreach (var candidate in candidates)
        {
            // A restaurant whose offer window cannot be parsed into from/until is omitted rather than
            // sent with a bad window (Step 5: never emit degraded rows).
            if (!OfferValueParser.TryParseOfferWindow(candidate.OfferTimeText, out var from, out var until))
            {
                logger.LogDebug(
                    "Omitted restaurant {RestaurantId} for {UserId}: offer window not parseable.",
                    candidate.RestaurantId,
                    user.Id);
                continue;
            }

            var windowEndUtc = ToInstant(localDate, until, timeZone);
            if (windowEndUtc <= nowUtc)
            {
                // This restaurant's window already ended today; a stale row must not be sent.
                logger.LogDebug(
                    "Omitted restaurant {RestaurantId} for {UserId}: offer window already ended.",
                    candidate.RestaurantId,
                    user.Id);
                continue;
            }

            var offers = await ResolveOffersAsync(candidate, localDate, nowUtc, ct);
            if (offers is null || offers.Count == 0)
            {
                continue;
            }

            var lines = new List<OfferLine>();
            foreach (var offer in offers)
            {
                // Drop an offer whose price cannot be produced as an invariant decimal string.
                if (!OfferValueParser.TryParsePrice(offer.PriceText, out var price))
                {
                    continue;
                }

                lines.Add(new OfferLine { OfferText = offer.Text, OfferPrice = price });
            }

            if (lines.Count == 0)
            {
                // No priced offers survived: omit the restaurant rather than send an empty offers array.
                logger.LogDebug(
                    "Omitted restaurant {RestaurantId} for {UserId}: no offers with a parseable price.",
                    candidate.RestaurantId,
                    user.Id);
                continue;
            }

            rows.Add(new PreparedRow(
                new RecommendationRow
                {
                    RestaurantName = candidate.RestaurantName,
                    Offers = lines,
                    OfferTimeFrom = from.ToString("HH:mm", CultureInfo.InvariantCulture),
                    OfferTimeUntil = until.ToString("HH:mm", CultureInfo.InvariantCulture),
                    Link = BuildRestaurantLink(candidate.RestaurantId)
                },
                windowEndUtc));
        }

        return rows;
    }

    private LunchRecommendationContent BuildContent(AppUser user, IReadOnlyList<PreparedRow> rows)
    {
        return new LunchRecommendationContent
        {
            Email = user.Email,
            FullName = user.FullName,
            Locale = user.Locale,
            Currency = notificationOptions.Currency,
            RecommendationRows = rows.Select(row => row.Row).ToList(),
            LinkToUserWheel = BuildWheelLink()
        };
    }

    private async Task<IReadOnlyList<DailyOfferItem>?> ResolveOffersAsync(
        DailyRecommendationRestaurantCandidate candidate,
        DateOnly businessDate,
        DateTimeOffset nowUtc,
        CancellationToken ct)
    {
        var cacheEntry = await offerCacheRepository.GetByRestaurantIdAsync(candidate.RestaurantId, ct);

        string offersJson;
        if (IsFresh(cacheEntry, businessDate, nowUtc))
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

    private bool IsFresh(OfferCacheEntry? cacheEntry, DateOnly businessDate, DateTimeOffset nowUtc)
    {
        if (cacheEntry == null || cacheEntry.BusinessDate != businessDate)
        {
            return false;
        }

        var fetchedAtUtc = cacheEntry.FetchedAtUtc.Kind == DateTimeKind.Utc
            ? cacheEntry.FetchedAtUtc
            : DateTime.SpecifyKind(cacheEntry.FetchedAtUtc, DateTimeKind.Utc);

        return fetchedAtUtc.Add(offerCacheOptions.Ttl) > nowUtc.UtcDateTime;
    }

    // Interprets a local wall-clock time on the business date as a UTC instant, so the offer window
    // is anchored to Europe/Tallinn regardless of the host's local time.
    private static DateTimeOffset ToInstant(DateOnly localDate, TimeOnly localTime, TimeZoneInfo timeZone)
    {
        var localDateTime = DateTime.SpecifyKind(localDate.ToDateTime(localTime), DateTimeKind.Unspecified);
        return new DateTimeOffset(TimeZoneInfo.ConvertTimeToUtc(localDateTime, timeZone), TimeSpan.Zero);
    }

    private TimeZoneInfo ResolveTimeZone()
    {
        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById(notificationOptions.TimeZone);
        }
        catch (Exception ex) when (ex is TimeZoneNotFoundException or InvalidTimeZoneException)
        {
            logger.LogWarning(
                ex,
                "Notification time zone '{TimeZoneId}' not found; falling back to UTC.",
                notificationOptions.TimeZone);
            return TimeZoneInfo.Utc;
        }
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

    // A prepared row plus the UTC instant its offer window ends, used to compute the message expiration.
    private sealed record PreparedRow(RecommendationRow Row, DateTimeOffset WindowEndUtc);
}
