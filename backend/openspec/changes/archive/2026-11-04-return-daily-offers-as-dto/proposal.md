## Why

The web and mobile clients read each offer as `{ offerText, offerPrice }`, but `GET /api/v1/restaurants/{restaurantId}/offers` returns the raw cached JSON `{ text, priceText }`. The clients render empty offer rows. The endpoint also passes a raw JSON string through Web instead of returning a `...Dto`, and `OfferFetchService` returns a string instead of domain values, both against the layering rules in AGENTS.md.

## What Changes

- **BREAKING (API shape)**: The daily offers endpoint returns a JSON array of `DailyOfferDto` items with `offerText` and nullable `offerPrice`, matching what both clients already expect.
- `DailyOfferItem` moves from `Contracts/External` to `Domain` so Application and Web can use it as a domain value.
- `IOfferFetchService.GetDailyOffersAsync` returns `IMethodResponse<IReadOnlyCollection<DailyOfferItem>>` instead of a JSON string.
- New `DTO/Web/DailyOfferDto` and `DTO/Web/Mappers/DailyOfferDtoMapper` (`IMapper<DailyOfferDto, DailyOfferItem>`); the controller maps through it.
- **Unchanged**: the cache row still stores `OffersJson` with `text` / `priceText`; fetchers, locators, cache freshness and the recommendation email contract (`OfferLine`) are unchanged.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `daily-offer-fetching`: OfferFetchService returns offer items instead of JSON; the daily offers API returns `offerText` / `offerPrice` DTOs.

## Impact

- Affected code: `Domain/DailyOfferItem.cs` (moved), `Contracts/Application/IOfferFetchService.cs`, `Application/OfferFetchService.cs`, `Application/DailyRecommendationNotificationService.cs`, `External/Offers/*` and `Contracts/External/IOfferProviderFetcher.cs` (namespace only), `DTO/Web/DailyOfferDto.cs`, `DTO/Web/Mappers/DailyOfferDtoMapper.cs`, `Web/API/Controllers/RestaurantsController.cs`, `Web/Configuration/ServiceConfiguration.cs`, tests.
- No database, migration, env or messaging changes. Frontend and mobile need no changes.
- Removing the price from the offer text when both come from the same element is out of scope (separate change).
