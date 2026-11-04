using System.Net;
using Base.Contracts.DTO;
using Contracts.Application;
using Domain;
using External.Offers;

namespace Tests;

public class OfferProviderFetcherTests
{
    private const string Json = """
        {
          "foods": {
            "restaurants": {
              "mysushi": {
                "menu": [
                  { "name": "Salmon roll", "price": "7.50" },
                  { "name": "Miso soup", "price": null },
                  { "price": "1.00" }
                ]
              }
            }
          },
          "days": [
            { "offers": [ { "name": "Soup" } ] },
            { "offers": [ { "name": "Pasta" }, { "name": "Salad" } ] }
          ],
          "plain": [ "Pancakes", "Waffles" ]
        }
        """;

    private const string Html = """
        <html><body>
          <div id="other"><div class="menu-item"><span class="dish-name">Not this</span></div></div>
          <div id="mysushi">
            <section>
              <div class="menu-item"><span class="dish-name">Salmon roll</span><b class="price">7.50 €</b></div>
              <div class="menu-item"><span class="dish-name">Miso
                 soup</span></div>
            </section>
            <ul><li>Tea</li></ul>
          </div>
        </body></html>
        """;

    [Fact]
    public async Task Api_NestedPath_ReturnsOffersWithTextAndPrice()
    {
        var result = await FetchApi(Json, "foods > restaurants > mysushi > menu", "name", "price");

        Assert.True(result.Successful);
        Assert.Collection(result.Value!,
            offer => { Assert.Equal("Salmon roll", offer.Text); Assert.Equal("7.50", offer.PriceText); },
            offer => { Assert.Equal("Miso soup", offer.Text); Assert.Null(offer.PriceText); });
    }

    [Fact]
    public async Task Api_ArrayInTheMiddle_AppliesRemainingSegmentsToEveryItem()
    {
        var result = await FetchApi(Json, "days > offers", "name", "price");

        Assert.Equal(["Soup", "Pasta", "Salad"], result.Value!.Select(offer => offer.Text));
    }

    [Fact]
    public async Task Api_DotTextLocator_UsesOfferItself()
    {
        var result = await FetchApi(Json, "plain", ".", "price");

        Assert.Equal(["Pancakes", "Waffles"], result.Value!.Select(offer => offer.Text));
    }

    [Fact]
    public async Task Api_MissingKey_ReturnsNoOffers()
    {
        var result = await FetchApi(Json, "foods > missing > menu", "name", "price");

        Assert.True(result.Successful);
        Assert.Empty(result.Value!);
    }

    [Fact]
    public async Task Api_InvalidJson_ReturnsParseFailed()
    {
        var result = await FetchApi("not json", "menu", "name", "price");

        Assert.False(result.Successful);
        Assert.Equal(OfferFetchErrorCodes.ParseFailed, result.Error!.Code);
    }

    [Fact]
    public async Task Api_HttpFailure_ReturnsFetchFailed()
    {
        var result = await FetchApi("", "menu", "name", "price", HttpStatusCode.InternalServerError);

        Assert.False(result.Successful);
        Assert.Equal(OfferFetchErrorCodes.FetchFailed, result.Error!.Code);
    }

    [Fact]
    public async Task Api_OldJsonPathLocator_ReturnsNoOffers()
    {
        var result = await FetchApi(Json, "$.foods.restaurants.mysushi.menu[*]", "name", "price");

        Assert.True(result.Successful);
        Assert.Empty(result.Value!);
    }

    [Fact]
    public async Task Html_ClassAndIdPath_MatchesAtAnyDepthInsideParent()
    {
        var result = await FetchHtml(Html, "#mysushi > .menu-item", ".dish-name", ".price");

        Assert.True(result.Successful);
        Assert.Collection(result.Value!,
            offer => { Assert.Equal("Salmon roll", offer.Text); Assert.Equal("7.50 €", offer.PriceText); },
            offer => { Assert.Equal("Miso soup", offer.Text); Assert.Null(offer.PriceText); });
    }

    [Fact]
    public async Task Html_TagPathWithDotTextLocator_UsesElementText()
    {
        var result = await FetchHtml(Html, "#mysushi > ul > li", ".", "");

        Assert.Equal(["Tea"], result.Value!.Select(offer => offer.Text));
    }

    [Fact]
    public async Task Html_PriceNestedInOffer_IsLeftOutOfText()
    {
        const string html = """
            <div class="offer">Kodune seljanka. <strong>3,90&euro;</strong></div>
            <div class="offer">Koorene veiselihakaste.</div>
            """;

        var result = await FetchHtml(html, ".offer", ".", "strong");

        Assert.Collection(result.Value!,
            offer => { Assert.Equal("Kodune seljanka.", offer.Text); Assert.Equal("3,90€", offer.PriceText); },
            offer => { Assert.Equal("Koorene veiselihakaste.", offer.Text); Assert.Null(offer.PriceText); });
    }

    [Fact]
    public async Task Html_PriceNestedInTextElement_IsLeftOutOfText()
    {
        const string html = """<ul><li><span class="name">Soup <b>4 €</b> of the day</span></li></ul>""";

        var result = await FetchHtml(html, "li", ".name", "b");

        var offer = Assert.Single(result.Value!);
        Assert.Equal("Soup of the day", offer.Text);
        Assert.Equal("4 €", offer.PriceText);
    }

    [Fact]
    public async Task Html_PriceOutsideTextElement_KeepsFullText()
    {
        const string html = """<li><span class="name">Soup 4 €</span><b>4 €</b></li>""";

        var result = await FetchHtml(html, "li", ".name", "b");

        Assert.Equal("Soup 4 €", Assert.Single(result.Value!).Text);
    }

    [Fact]
    public async Task Html_TextAndPriceSameElement_KeepsFullText()
    {
        const string html = """<li>Soup 4 €</li>""";

        var result = await FetchHtml(html, "li", ".", ".");

        var offer = Assert.Single(result.Value!);
        Assert.Equal("Soup 4 €", offer.Text);
        Assert.Equal("Soup 4 €", offer.PriceText);
    }

    [Fact]
    public async Task Html_NoMatches_ReturnsNoOffers()
    {
        var result = await FetchHtml(Html, "#missing > .menu-item", ".dish-name", ".price");

        Assert.True(result.Successful);
        Assert.Empty(result.Value!);
    }

    [Fact]
    public async Task Html_InvalidLocator_ReturnsParseFailedWithoutFetching()
    {
        var result = await FetchHtml(Html, "regex:<li>(.*?)</li>", ".", ".");

        Assert.False(result.Successful);
        Assert.Equal(OfferFetchErrorCodes.ParseFailed, result.Error!.Code);
    }

    [Fact]
    public async Task Html_HttpFailure_ReturnsFetchFailed()
    {
        var result = await FetchHtml("", "li", ".", ".", HttpStatusCode.NotFound);

        Assert.False(result.Successful);
        Assert.Equal(OfferFetchErrorCodes.FetchFailed, result.Error!.Code);
    }

    [Fact]
    public async Task Fetch_MissingResourceUrl_ReturnsMissingOffersResourceUrl()
    {
        var fetcher = new HtmlOfferProviderFetcher(CreateClient(HttpStatusCode.OK, Html));
        var provider = OfferProviderTests.CreateProvider(EOfferProviderType.Html, "li", ".", ".");

        var result = await fetcher.FetchAsync(new Restaurant { OffersResourceUrl = null }, provider);

        Assert.Equal(OfferFetchErrorCodes.MissingOffersResourceUrl, result.Error!.Code);
    }

    private static Task<IMethodResponse<IReadOnlyCollection<DailyOfferItem>>> FetchApi(
        string content, string offerLocator, string textLocator, string priceLocator,
        HttpStatusCode statusCode = HttpStatusCode.OK)
    {
        var fetcher = new ApiOfferProviderFetcher(CreateClient(statusCode, content));
        var provider = OfferProviderTests.CreateProvider(EOfferProviderType.Api, offerLocator, textLocator, priceLocator);
        return fetcher.FetchAsync(CreateRestaurant(), provider);
    }

    private static Task<IMethodResponse<IReadOnlyCollection<DailyOfferItem>>> FetchHtml(
        string content, string offerLocator, string textLocator, string priceLocator,
        HttpStatusCode statusCode = HttpStatusCode.OK)
    {
        var fetcher = new HtmlOfferProviderFetcher(CreateClient(statusCode, content));
        var provider = OfferProviderTests.CreateProvider(EOfferProviderType.Html, offerLocator, textLocator, priceLocator);
        return fetcher.FetchAsync(CreateRestaurant(), provider);
    }

    private static HttpClient CreateClient(HttpStatusCode statusCode, string content)
    {
        return new HttpClient(new FakeHttpMessageHandler(statusCode, content));
    }

    private static Restaurant CreateRestaurant()
    {
        return new Restaurant { Id = Guid.NewGuid(), OffersResourceUrl = "https://example.com/offers" };
    }
}
