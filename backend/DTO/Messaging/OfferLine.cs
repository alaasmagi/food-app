using System.Text.Json.Serialization;

namespace DTO.Messaging;

// One offer line inside a restaurant's recommendation row. Both fields are machine-readable per the
// email-hub contract: email-hub does all formatting. offerPrice is an invariant decimal string
// ("7.99"), never a JSON number and never a comma. An offer whose price cannot be produced as such a
// string is dropped upstream rather than emitted degraded, so offerPrice is always present here.
public sealed record OfferLine
{
    [JsonPropertyName("offerText")]
    public string OfferText { get; init; } = default!;

    [JsonPropertyName("offerPrice")]
    public string OfferPrice { get; init; } = default!;
}
