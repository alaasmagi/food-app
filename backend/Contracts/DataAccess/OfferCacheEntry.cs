namespace Contracts.DataAccess;

public class OfferCacheEntry
{
    public Guid RestaurantId { get; set; }
    public DateOnly BusinessDate { get; set; }
    public string OffersJson { get; set; } = default!;
    public DateTime FetchedAtUtc { get; set; }
}
