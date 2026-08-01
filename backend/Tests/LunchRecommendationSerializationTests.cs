using System.Text.Json;
using Base.Message;
using DTO.Messaging;

namespace Tests;

public class LunchRecommendationSerializationTests
{
    [Fact]
    public void Envelope_SerializesToEmailHubContract()
    {
        var envelope = new BaseEventEnvelope<LunchRecommendationContent>
        {
            Id = "2b9dc316-98d7-488f-8614-6d275497d0b9",
            Source = "food-app",
            Tenant = "food-app",
            Action = LunchRecommendationContract.Action,
            Timestamp = BaseEventEnvelope<LunchRecommendationContent>.FormatTimestamp(
                new DateTimeOffset(2026, 7, 15, 8, 0, 0, TimeSpan.Zero)),
            ContentVersion = LunchRecommendationContract.ContentVersion,
            Content = new LunchRecommendationContent
            {
                Email = "user@example.com",
                FullName = "User Example",
                Locale = "et",
                Currency = "EUR",
                LinkToUserWheel = "https://food.example.com/wheel",
                RecommendationRows =
                [
                    new RecommendationRow
                    {
                        RestaurantName = "MySushi Rocca al Mare",
                        OfferTimeFrom = "11:00",
                        OfferTimeUntil = "15:00",
                        Link = "https://food.example.com/restaurants/mysushi-rocca",
                        Offers =
                        [
                            new OfferLine { OfferText = "California Sushi 8tk", OfferPrice = "7.99" }
                        ]
                    }
                ]
            }
        };

        using var document = JsonSerializer.SerializeToDocument(envelope);
        var root = document.RootElement;

        Assert.Equal("2b9dc316-98d7-488f-8614-6d275497d0b9", root.GetProperty("id").GetString());
        Assert.Equal("food-app", root.GetProperty("source").GetString());
        Assert.Equal("food-app", root.GetProperty("tenant").GetString());
        Assert.Equal("lunch-recommendation", root.GetProperty("action").GetString());
        Assert.Equal("2026-07-15T08:00:00.000Z", root.GetProperty("timestamp").GetString());
        Assert.Equal("1.0", root.GetProperty("contentVersion").GetString());
        // The exchange carries the message kind; there is no `type` field on the envelope.
        Assert.False(root.TryGetProperty("type", out _));

        var content = root.GetProperty("content");
        Assert.Equal("user@example.com", content.GetProperty("email").GetString());
        Assert.Equal("EUR", content.GetProperty("currency").GetString());
        Assert.Equal("https://food.example.com/wheel", content.GetProperty("linkToUserWheel").GetString());

        var row = content.GetProperty("recommendationRows")[0];
        Assert.Equal("MySushi Rocca al Mare", row.GetProperty("restaurantName").GetString());
        Assert.Equal("11:00", row.GetProperty("offerTimeFrom").GetString());
        Assert.Equal("15:00", row.GetProperty("offerTimeUntil").GetString());
        Assert.Equal("https://food.example.com/restaurants/mysushi-rocca", row.GetProperty("link").GetString());

        var offer = row.GetProperty("offers")[0];
        Assert.Equal("California Sushi 8tk", offer.GetProperty("offerText").GetString());
        // Price is an invariant decimal string, never a JSON number.
        var price = offer.GetProperty("offerPrice");
        Assert.Equal(JsonValueKind.String, price.ValueKind);
        Assert.Equal("7.99", price.GetString());
    }
}
