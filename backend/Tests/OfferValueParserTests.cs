using Application.Messaging;

namespace Tests;

public class OfferValueParserTests
{
    [Theory]
    [InlineData("7.99", "7.99")]
    [InlineData("4,50 €", "4.50")]
    [InlineData("€ 6", "6")]
    [InlineData("12,00 EUR", "12.00")]
    [InlineData("1.299,00", "1299.00")]
    [InlineData("1,299.00", "1299.00")]
    public void TryParsePrice_ProducesInvariantDecimal(string raw, string expected)
    {
        Assert.True(OfferValueParser.TryParsePrice(raw, out var value));
        Assert.Equal(expected, value);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("free")]
    [InlineData("ask staff")]
    public void TryParsePrice_RejectsUnparseable(string? raw)
    {
        Assert.False(OfferValueParser.TryParsePrice(raw, out _));
    }

    [Theory]
    [InlineData("11:00-14:00", "11:00", "14:00")]
    [InlineData("11.00 – 15.00", "11:00", "15:00")]
    [InlineData("L-R 11-15", "11:00", "15:00")]
    [InlineData("Lunch 11:30 to 14:45", "11:30", "14:45")]
    public void TryParseOfferWindow_SplitsFromUntil(string raw, string from, string until)
    {
        Assert.True(OfferValueParser.TryParseOfferWindow(raw, out var parsedFrom, out var parsedUntil));
        Assert.Equal(from, parsedFrom.ToString("HH:mm"));
        Assert.Equal(until, parsedUntil.ToString("HH:mm"));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("all day")]
    [InlineData("11:00")]           // only one time
    [InlineData("14:00-11:00")]     // until before from
    public void TryParseOfferWindow_RejectsUnusable(string? raw)
    {
        Assert.False(OfferValueParser.TryParseOfferWindow(raw, out _, out _));
    }

    [Fact]
    public void DeterministicGuid_IsStableAndVersion5()
    {
        var a = DeterministicGuid.CreateV5(DeterministicGuid.LunchRecommendationNamespace, "u:2026-07-15");
        var b = DeterministicGuid.CreateV5(DeterministicGuid.LunchRecommendationNamespace, "u:2026-07-15");
        var c = DeterministicGuid.CreateV5(DeterministicGuid.LunchRecommendationNamespace, "u:2026-07-16");

        Assert.Equal(a, b);          // same input -> same id (safe re-run)
        Assert.NotEqual(a, c);       // different date -> different id
        Assert.Equal('5', a.ToString()[14]); // version nibble
    }
}
