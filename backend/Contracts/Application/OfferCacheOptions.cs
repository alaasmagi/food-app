namespace Contracts.Application;

public class OfferCacheOptions
{
    public TimeSpan Ttl { get; init; } = TimeSpan.FromHours(1);
}
