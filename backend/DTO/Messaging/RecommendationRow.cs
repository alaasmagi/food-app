using System.Text.Json.Serialization;

namespace DTO.Messaging;

// One restaurant in a lunch-recommendation email. offerTimeFrom/offerTimeUntil are separate local
// wall-clock strings ("11:00", "15:00") — no timezone, no offset, no UTC conversion; they are the
// hours printed on the restaurant's door. link is this service's own restaurant URL (never a
// Keycloak action-token URL). A restaurant with no offers is omitted entirely rather than sent with
// an empty offers array.
public sealed record RecommendationRow
{
    [JsonPropertyName("restaurantName")]
    public string RestaurantName { get; init; } = default!;

    [JsonPropertyName("offers")]
    public IReadOnlyList<OfferLine> Offers { get; init; } = [];

    [JsonPropertyName("offerTimeFrom")]
    public string OfferTimeFrom { get; init; } = default!;

    [JsonPropertyName("offerTimeUntil")]
    public string OfferTimeUntil { get; init; } = default!;

    [JsonPropertyName("link")]
    public string Link { get; init; } = default!;
}
