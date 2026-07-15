using System.Text.Json.Serialization;

namespace DTO.Messaging;

public sealed record RecommendationRow
{
    [JsonPropertyName("restaurantName")]
    public string RestaurantName { get; init; } = default!;

    [JsonPropertyName("offers")]
    public IReadOnlyList<OfferLine> Offers { get; init; } = [];

    [JsonPropertyName("offerTimes")]
    public string OfferTimes { get; init; } = default!;

    [JsonPropertyName("link")]
    public string Link { get; init; } = default!;
}
