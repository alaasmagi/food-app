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

        try
        {
            var html = await httpClient.GetStringAsync(restaurant.OffersResourceUrl, ct);
            var parser = new HtmlParser();
            var document = await parser.ParseDocumentAsync(html, ct);
            var offers = IsRegexLocator(provider.OfferLocator)
                ? ParseRegexOffers(html, parser, provider)
                : ParseSelectorOffers(document.QuerySelectorAll(provider.OfferLocator), provider);

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

    private static IReadOnlyCollection<DailyOfferItem> ParseSelectorOffers(
        IEnumerable<IElement> offerNodes,
        OfferProvider provider)
    {
        return offerNodes
            .Select(node => new DailyOfferItem
            {
                Text = ExtractText(node, provider.OfferTextLocator),
                PriceText = ExtractOptionalText(node, provider.OfferPriceLocator)
            })
            .Where(offer => !string.IsNullOrWhiteSpace(offer.Text))
            .ToList();
    }

    private static IReadOnlyCollection<DailyOfferItem> ParseRegexOffers(
        string html,
        HtmlParser parser,
        OfferProvider provider)
    {
        var pattern = provider.OfferLocator["regex:".Length..];

        return Regex.Matches(html, pattern, RegexOptions.Singleline | RegexOptions.IgnoreCase)
            .Select(match => match.Groups.Count > 1 ? match.Groups[1].Value : match.Value)
            .Select(offerHtml =>
            {
                var document = parser.ParseDocument(offerHtml);
                var node = document.Body ?? document.DocumentElement;

                return new DailyOfferItem
                {
                    Text = ExtractText(node, provider.OfferTextLocator, offerHtml),
                    PriceText = ExtractOptionalText(node, provider.OfferPriceLocator, offerHtml)
                };
            })
            .Where(offer => !string.IsNullOrWhiteSpace(offer.Text))
            .ToList();
    }

    private static string ExtractText(IElement node, string locator)
    {
        return ExtractOptionalText(node, locator, node.InnerHtml) ?? string.Empty;
    }

    private static string ExtractText(IElement node, string locator, string regexSource)
    {
        return ExtractOptionalText(node, locator, regexSource) ?? string.Empty;
    }

    private static string? ExtractOptionalText(IElement node, string locator)
    {
        return ExtractOptionalText(node, locator, node.InnerHtml);
    }

    private static string? ExtractOptionalText(IElement node, string locator, string regexSource)
    {
        if (string.IsNullOrWhiteSpace(locator) ||
            locator.Equals(".", StringComparison.Ordinal) ||
            locator.Equals("$", StringComparison.Ordinal))
        {
            return Normalize(node.TextContent);
        }

        if (locator.StartsWith("regex:", StringComparison.OrdinalIgnoreCase))
        {
            var pattern = locator["regex:".Length..];
            var match = Regex.Match(regexSource, pattern, RegexOptions.Singleline | RegexOptions.IgnoreCase);
            if (!match.Success)
            {
                return null;
            }

            return Normalize(match.Groups.Count > 1 ? match.Groups[1].Value : match.Value);
        }

        return Normalize(node.QuerySelector(locator)?.TextContent);
    }

    private static bool IsRegexLocator(string locator)
    {
        return locator.StartsWith("regex:", StringComparison.OrdinalIgnoreCase);
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
