namespace Contracts.DataAccess;

// Read model for daily recommendation assembly: the minimal restaurant fields the notification
// service needs, plus whether the restaurant can be refreshed through an offer provider.
public sealed record DailyRecommendationRestaurantCandidate
{
    public Guid RestaurantId { get; init; }
    public string RestaurantName { get; init; } = default!;
    public string OfferTimeText { get; init; } = default!;
    public bool IsFetchable { get; init; }
}
