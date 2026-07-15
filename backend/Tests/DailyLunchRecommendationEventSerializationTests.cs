using System.Text.Json;
using DTO.Messaging;

namespace Tests;

public class DailyLunchRecommendationEventSerializationTests
{
    // Mirrors the camelCase web serialization used by the outbound publisher.
    private static readonly JsonSerializerOptions Options = new(JsonSerializerDefaults.Web);

    [Fact]
    public void Event_HasFixedEnvelopeConstants()
    {
        Assert.Equal("email", AppMessageTypes.Email);
        Assert.Equal("food", AppMessageSources.Food);
        Assert.Equal("daily.lunch.recommendation", AppMessageActions.DailyLunchRecommendation);

        var recommendationEvent = new DailyLunchRecommendationEvent(
            DateTime.UtcNow,
            new DailyLunchRecommendationContent());

        Assert.Equal("email", recommendationEvent.Type);
        Assert.Equal("food", recommendationEvent.Source);
        Assert.Equal("daily.lunch.recommendation", recommendationEvent.Action);
    }

    [Fact]
    public void Event_SerializesToEmailHubContract()
    {
        var recommendationEvent = new DailyLunchRecommendationEvent(
            new DateTime(2026, 7, 15, 8, 0, 0, DateTimeKind.Utc),
            new DailyLunchRecommendationContent
            {
                Email = "user@example.com",
                FullName = "User Example",
                Locale = "et",
                Currency = "EUR",
                LinkToUserWheel = "https://app.example.com/wheel",
                RecommendationRows =
                [
                    new RecommendationRow
                    {
                        RestaurantName = "Bistro One",
                        OfferTimes = "11:00-14:00",
                        Link = "https://app.example.com/restaurants/abc",
                        Offers =
                        [
                            new OfferLine { OfferText = "Soup", OfferPrice = "4,50 €" },
                            new OfferLine { OfferText = "Free water", OfferPrice = null }
                        ]
                    }
                ]
            });

        using var document = JsonSerializer.SerializeToDocument(recommendationEvent, Options);
        var root = document.RootElement;

        Assert.Equal("email", root.GetProperty("type").GetString());
        Assert.Equal("food", root.GetProperty("source").GetString());
        Assert.Equal("daily.lunch.recommendation", root.GetProperty("action").GetString());
        Assert.True(root.TryGetProperty("timestamp", out _));

        var content = root.GetProperty("content");
        Assert.Equal("user@example.com", content.GetProperty("email").GetString());
        Assert.Equal("User Example", content.GetProperty("fullName").GetString());
        Assert.Equal("et", content.GetProperty("locale").GetString());
        Assert.Equal("EUR", content.GetProperty("currency").GetString());
        Assert.Equal("https://app.example.com/wheel", content.GetProperty("linkToUserWheel").GetString());

        var row = content.GetProperty("recommendationRows")[0];
        Assert.Equal("Bistro One", row.GetProperty("restaurantName").GetString());
        Assert.Equal("11:00-14:00", row.GetProperty("offerTimes").GetString());
        Assert.Equal("https://app.example.com/restaurants/abc", row.GetProperty("link").GetString());

        var offers = row.GetProperty("offers");
        Assert.Equal("Soup", offers[0].GetProperty("offerText").GetString());
        // Raw price text passes through unchanged, including currency symbol and locale formatting.
        Assert.Equal("4,50 €", offers[0].GetProperty("offerPrice").GetString());
        Assert.Equal(JsonValueKind.Null, offers[1].GetProperty("offerPrice").ValueKind);
    }
}
