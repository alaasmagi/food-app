using System.Text.Json.Serialization;

namespace DTO.Messaging;

// content payload of a `lunch-recommendation` command on email-hub.commands. Flat (no nesting
// wrapper) per the envelope contract. All values are machine-readable: currency is an ISO 4217 code
// ("EUR", never a symbol) and linkToUserWheel is this service's own URL. locale is per recipient.
public sealed record LunchRecommendationContent
{
    [JsonPropertyName("email")]
    public string Email { get; init; } = default!;

    [JsonPropertyName("fullName")]
    public string FullName { get; init; } = default!;

    [JsonPropertyName("locale")]
    public string Locale { get; init; } = default!;

    [JsonPropertyName("currency")]
    public string Currency { get; init; } = default!;

    [JsonPropertyName("recommendationRows")]
    public IReadOnlyList<RecommendationRow> RecommendationRows { get; init; } = [];

    [JsonPropertyName("linkToUserWheel")]
    public string LinkToUserWheel { get; init; } = default!;
}
