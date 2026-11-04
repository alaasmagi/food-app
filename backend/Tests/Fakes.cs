using System.Net;
using Base.Contracts.DTO;
using Base.Contracts.Message;
using Base.DTO;
using Contracts.Application;
using Contracts.DataAccess;
using Domain;

namespace Tests;

internal class FakeOfferCacheRepository : IOfferCacheRepository
{
    private readonly Dictionary<Guid, OfferCacheEntry> _entries = new();

    public void Set(Guid restaurantId, OfferCacheEntry entry) => _entries[restaurantId] = entry;

    public Task<OfferCacheEntry?> GetByRestaurantIdAsync(Guid restaurantId, CancellationToken ct = default)
        => Task.FromResult(_entries.TryGetValue(restaurantId, out var entry) ? entry : null);

    public Task UpsertAsync(OfferCacheEntry entry, CancellationToken ct = default)
    {
        _entries[entry.RestaurantId] = entry;
        return Task.CompletedTask;
    }
}

internal class FakeOfferFetchService : IOfferFetchService
{
    private readonly Dictionary<Guid, IMethodResponse<IReadOnlyCollection<DailyOfferItem>>> _results = new();

    public void SetSuccess(Guid restaurantId, IReadOnlyCollection<DailyOfferItem> offers)
        => _results[restaurantId] = MethodResponse<IReadOnlyCollection<DailyOfferItem>>.Success(offers);

    public void SetFailure(Guid restaurantId)
        => _results[restaurantId] = MethodResponse<IReadOnlyCollection<DailyOfferItem>>.Failure(new Error("fetch.failed", "boom"));

    public Task<IMethodResponse<IReadOnlyCollection<DailyOfferItem>>> GetDailyOffersAsync(Guid restaurantId, CancellationToken ct = default)
        => Task.FromResult(_results.TryGetValue(restaurantId, out var result)
            ? result
            : MethodResponse<IReadOnlyCollection<DailyOfferItem>>.Failure(new Error("not.configured", "no result configured")));
}

// Records confirmed publishes with their AMQP expiration. FailIds forces an unconfirmed result for
// matching envelope ids so tests can exercise the "unconfirmed means failed" path.
internal class FakeEventPublisher : IBaseEventPublisher
{
    public List<PublishedEnvelope> Published { get; } = new();
    public HashSet<string> FailIds { get; } = new();

    public Task<PublishResult> PublishAsync<TContent>(
        IBaseEventEnvelope<TContent> message,
        string? expiration = null,
        CancellationToken cancellationToken = default)
    {
        if (FailIds.Contains(message.Id))
        {
            return Task.FromResult(PublishResult.Failed("forced failure"));
        }

        Published.Add(new PublishedEnvelope(message, expiration));
        return Task.FromResult(PublishResult.Ok());
    }
}

internal record PublishedEnvelope(object Envelope, string? Expiration);

// Minimal TimeProvider returning a fixed instant, for deterministic scheduling/expiry tests.
internal class FixedTimeProvider(DateTimeOffset now) : TimeProvider
{
    public override DateTimeOffset GetUtcNow() => now;
}

// Returns a fixed response (or throws) for every request, for HttpClient-based fetcher tests.
internal class FakeHttpMessageHandler(HttpStatusCode statusCode, string content) : HttpMessageHandler
{
    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        => Task.FromResult(new HttpResponseMessage(statusCode) { Content = new StringContent(content) });
}
