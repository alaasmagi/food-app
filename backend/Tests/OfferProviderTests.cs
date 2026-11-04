using Domain;

namespace Tests;

public class OfferProviderTests
{
    [Theory]
    [InlineData(EOfferProviderType.Api, "foods > restaurants > mysushi > menu", "name", "price")]
    [InlineData(EOfferProviderType.Api, "menu", ".", "")]
    [InlineData(EOfferProviderType.Api, "my key > menu items", "dish name", "price")]
    [InlineData(EOfferProviderType.Html, "#mysushi > .menu-item", ".dish-name", ".price")]
    [InlineData(EOfferProviderType.Html, "ul > li", ".", "span")]
    public void ValidateLocators_ValidPaths_ReturnsNull(
        EOfferProviderType providerType, string offerLocator, string textLocator, string priceLocator)
    {
        var provider = CreateProvider(providerType, offerLocator, textLocator, priceLocator);

        Assert.Null(provider.ValidateLocators());
    }

    [Theory]
    [InlineData(EOfferProviderType.Api, "")]
    [InlineData(EOfferProviderType.Api, ".")]
    [InlineData(EOfferProviderType.Html, " ")]
    public void ValidateLocators_EmptyOfferLocator_ReturnsError(EOfferProviderType providerType, string offerLocator)
    {
        var provider = CreateProvider(providerType, offerLocator, "name", "price");

        Assert.NotNull(provider.ValidateLocators());
    }

    [Theory]
    [InlineData(EOfferProviderType.Api, "a > > b", "name")]
    [InlineData(EOfferProviderType.Api, "menu >", "name")]
    [InlineData(EOfferProviderType.Html, "#menu", "> .name")]
    public void ValidateLocators_EmptySegment_ReturnsError(
        EOfferProviderType providerType, string offerLocator, string textLocator)
    {
        var provider = CreateProvider(providerType, offerLocator, textLocator, "price");

        Assert.NotNull(provider.ValidateLocators());
    }

    [Theory]
    [InlineData("div.menu li")]
    [InlineData("regex:<li>(.*?)</li>")]
    [InlineData("#1menu")]
    [InlineData("li:nth-child(2)")]
    [InlineData("[data-day=monday]")]
    [InlineData("$.foods.menu[*]")]
    public void ValidateLocators_InvalidHtmlSegment_ReturnsError(string offerLocator)
    {
        var provider = CreateProvider(EOfferProviderType.Html, offerLocator, ".name", ".price");

        Assert.NotNull(provider.ValidateLocators());
    }

    [Fact]
    public void ValidateLocators_InvalidHtmlPriceLocator_ReturnsError()
    {
        var provider = CreateProvider(EOfferProviderType.Html, ".menu-item", ".name", "span.price");

        Assert.Contains(nameof(OfferProvider.OfferPriceLocator), provider.ValidateLocators());
    }

    [Fact]
    public void ValidateLocators_Manual_SkipsValidation()
    {
        var provider = CreateProvider(EOfferProviderType.Manual, "", "regex:x", "> >");

        Assert.Null(provider.ValidateLocators());
    }

    [Theory]
    [InlineData(null, new string[0])]
    [InlineData("", new string[0])]
    [InlineData(" . ", new string[0])]
    [InlineData("menu", new[] { "menu" })]
    [InlineData(" foods >restaurants>  menu ", new[] { "foods", "restaurants", "menu" })]
    public void SplitLocator_SplitsAndTrimsSegments(string? locator, string[] expected)
    {
        Assert.Equal(expected, OfferProvider.SplitLocator(locator));
    }

    internal static OfferProvider CreateProvider(
        EOfferProviderType providerType, string offerLocator, string textLocator, string priceLocator)
    {
        return new OfferProvider
        {
            Id = Guid.NewGuid(),
            Name = "Provider",
            ProviderType = providerType,
            OfferLocator = offerLocator,
            OfferTextLocator = textLocator,
            OfferPriceLocator = priceLocator
        };
    }
}
