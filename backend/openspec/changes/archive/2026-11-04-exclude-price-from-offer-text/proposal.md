## Why

On pages where the price element sits inside the element used for the offer text (for example `<div class="offer">Kodune seljanka. <strong>3,90€</strong></div>` with OfferTextLocator `.` and OfferPriceLocator `strong`), the Html fetcher returns the price twice: once inside `text` and once as `priceText`. Clients then show "Kodune seljanka. 3,90€" next to "3,90€".

## What Changes

- The Html fetcher builds the offer text from the text element's content **excluding** the price element when the price element is inside the text element.
- When the price element is the text element itself, or is not inside it, the text is unchanged.
- **Unchanged**: locator syntax, the Api fetcher, the cache format and the API response shape.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `daily-offer-fetching`: the Html fetcher leaves a nested price out of the offer text.

## Impact

- Affected code: `External/Offers/HtmlOfferProviderFetcher.cs` and `Tests/OfferProviderFetcherTests.cs`.
- No database, env, API or client changes. Already-cached offers keep the old text until the cache row expires (TTL or next day).
