using Base.Contracts.DTO;
using Base.DTO;
using Contracts.Application;
using Contracts.External;
using Domain;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace External.Offers;

public class ApiOfferProviderFetcher(HttpClient httpClient) : IOfferProviderFetcher
{
    public EOfferProviderType ProviderType => EOfferProviderType.Api;

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
            var json = await httpClient.GetStringAsync(restaurant.OffersResourceUrl, ct);
            var root = JToken.Parse(json);
            var offerTokens = root.SelectTokens(provider.OfferLocator, errorWhenNoMatch: false);

            var offers = offerTokens
                .Select(token => new DailyOfferItem
                {
                    Text = SelectValue(token, provider.OfferTextLocator) ?? string.Empty,
                    PriceText = SelectValue(token, provider.OfferPriceLocator)
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
        catch (JsonException ex)
        {
            return MethodResponse<IReadOnlyCollection<DailyOfferItem>>.Failure(new Error(
                OfferFetchErrorCodes.ParseFailed,
                $"Offer API JSON parsing failed: {ex.Message}"));
        }
        catch (Exception ex) when (!ct.IsCancellationRequested)
        {
            return MethodResponse<IReadOnlyCollection<DailyOfferItem>>.Failure(new Error(
                OfferFetchErrorCodes.ParseFailed,
                $"Offer API locator parsing failed: {ex.Message}"));
        }
    }

    private static string? SelectValue(JToken token, string locator)
    {
        if (string.IsNullOrWhiteSpace(locator) ||
            locator.Equals(".", StringComparison.Ordinal) ||
            locator.Equals("$", StringComparison.Ordinal))
        {
            return Normalize(token);
        }

        var selected = token.SelectToken(locator, errorWhenNoMatch: false);
        return selected == null || selected.Type == JTokenType.Null
            ? null
            : Normalize(selected);
    }

    private static string? Normalize(JToken token)
    {
        var value = token.Type is JTokenType.Object or JTokenType.Array
            ? token.ToString(Formatting.None)
            : token.ToString();

        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }
}
