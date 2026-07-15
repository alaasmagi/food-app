using Base.Contracts.DTO;
using Base.Contracts.Message;
using Base.DTO;
using Contracts.Application;
using Contracts.DataAccess;
using Contracts.External;

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

internal sealed class FakeEventPublisher : IBaseEventPublisher
{
    public List<object> Published { get; } = new();

    public Task PublishAsync<TContent>(string topic, IBaseEventEnvelope<TContent> message, CancellationToken cancellationToken = default)
    {
        Published.Add(message!);
        return Task.CompletedTask;
    }
}
