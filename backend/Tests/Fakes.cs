using Base.Contracts.DTO;
using Base.Contracts.Message;
using Base.DTO;
using Contracts.Application;
using Contracts.DataAccess;

namespace Tests;

internal sealed class FakeOfferCacheRepository : IOfferCacheRepository
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

internal sealed class FakeOfferFetchService : IOfferFetchService
{
    private readonly Dictionary<Guid, IMethodResponse<string>> _results = new();

    public void SetSuccess(Guid restaurantId, string offersJson)
        => _results[restaurantId] = MethodResponse<string>.Success(offersJson);

    public void SetFailure(Guid restaurantId)
        => _results[restaurantId] = MethodResponse<string>.Failure(new Error("fetch.failed", "boom"));

    public Task<IMethodResponse<string>> GetDailyOffersAsync(Guid restaurantId, CancellationToken ct = default)
        => Task.FromResult(_results.TryGetValue(restaurantId, out var result)
            ? result
            : MethodResponse<string>.Failure(new Error("not.configured", "no result configured")));
}

// Records confirmed publishes with their AMQP expiration. FailIds forces an unconfirmed result for
// matching envelope ids so tests can exercise the "unconfirmed means failed" path.
internal sealed class FakeEventPublisher : IBaseEventPublisher
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

internal sealed record PublishedEnvelope(object Envelope, string? Expiration);

// Minimal TimeProvider returning a fixed instant, for deterministic scheduling/expiry tests.
internal sealed class FixedTimeProvider(DateTimeOffset now) : TimeProvider
{
    public override DateTimeOffset GetUtcNow() => now;
}
