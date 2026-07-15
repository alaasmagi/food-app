using System.Text.Json.Serialization;

namespace DTO.Messaging;

public sealed record DailyLunchRecommendationContent
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
