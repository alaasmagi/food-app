using System.Text.RegularExpressions;
using AngleSharp.Dom;
using AngleSharp.Html.Parser;
using Base.Contracts.DTO;
using Base.DTO;
using Contracts.Application;
using Contracts.External;
using Domain;

namespace External.Offers;

public class HtmlOfferProviderFetcher(HttpClient httpClient) : IOfferProviderFetcher
{
    public EOfferProviderType ProviderType => EOfferProviderType.Html;

    public async Task<IMethodResponse<IReadOnlyCollection<DailyOfferItem>>> FetchAsync(
        Restaurant restaurant,
        OfferProvider provider,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(restaurant.OffersResourceUrl))
        {
            return MethodResponse<IReadOnlyCollection<DailyOfferItem>>.Failure(new Error(
                OfferFetchErrorCodes.MissingOffersResourceUrl,
                "Restaurant does not have an offers resource URL."));
        }

        var locatorError = provider.ValidateLocators();
        if (locatorError != null)
        {
            return MethodResponse<IReadOnlyCollection<DailyOfferItem>>.Failure(new Error(
                OfferFetchErrorCodes.ParseFailed,
                locatorError));
        }

        try
        {
            var html = await httpClient.GetStringAsync(restaurant.OffersResourceUrl, ct);
            var parser = new HtmlParser();
            var document = await parser.ParseDocumentAsync(html, ct);
            var offers = document.QuerySelectorAll(ToSelector(provider.OfferLocator))
                .Select(node => new DailyOfferItem
                {
                    Text = ExtractText(node, provider.OfferTextLocator) ?? string.Empty,
                    PriceText = ExtractText(node, provider.OfferPriceLocator)
                })
                .Where(offer => !string.IsNullOrWhiteSpace(offer.Text))
                .ToList();

            return MethodResponse<IReadOnlyCollection<DailyOfferItem>>.Success(offers);
        }
        catch (HttpRequestException ex)
        {
            return MethodResponse<IReadOnlyCollection<DailyOfferItem>>.Failure(new Error(
                OfferFetchErrorCodes.FetchFailed,
                $"Offer resource request failed: {ex.Message}"));
        }
        catch (TaskCanceledException ex) when (!ct.IsCancellationRequested)
        {
            return MethodResponse<IReadOnlyCollection<DailyOfferItem>>.Failure(new Error(
                OfferFetchErrorCodes.FetchFailed,
                $"Offer resource request timed out: {ex.Message}"));
        }
        catch (Exception ex) when (!ct.IsCancellationRequested)
        {
            return MethodResponse<IReadOnlyCollection<DailyOfferItem>>.Failure(new Error(
                OfferFetchErrorCodes.ParseFailed,
                $"Offer HTML parsing failed: {ex.Message}"));
        }
    }

    private static string? ExtractText(IElement node, string locator)
    {
        var element = OfferProvider.SplitLocator(locator).Count == 0
            ? node
            : node.QuerySelector(ToSelector(locator));

        return Normalize(element?.TextContent);
    }

    // Segments are validated as .class, #id or tag, so joining them gives a descendant CSS selector.
    private static string ToSelector(string locator)
    {
        return string.Join(' ', OfferProvider.SplitLocator(locator));
    }

    private static string? Normalize(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        return Regex.Replace(value.Trim(), "\\s+", " ");
    }
}
