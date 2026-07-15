using System.Text.Json.Serialization;

namespace DTO.Messaging;

public sealed record OfferLine
{
    [JsonPropertyName("offerText")]
    public string OfferText { get; init; } = default!;

    [JsonPropertyName("offerPrice")]
    public string? OfferPrice { get; init; }
}
