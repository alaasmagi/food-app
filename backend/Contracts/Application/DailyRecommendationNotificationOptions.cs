namespace Contracts.Application;

// Link and content options for daily lunch recommendation emails. Path templates are kept
// configurable so frontend route changes do not require code changes.
public class DailyRecommendationNotificationOptions
{
    public string AppBaseUrl { get; init; } = "https://app.example.com";
    public string RestaurantPathTemplate { get; init; } = "/restaurants/{restaurantId}";
    public string WheelPath { get; init; } = "/wheel";
    public string Currency { get; init; } = "EUR";
}
