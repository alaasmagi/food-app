## Context

Restaurant and OfferProvider reference data already provide the shared restaurant fields, optional OfferProviderId, full Restaurant.OffersResourceUrl, provider type, and locator configuration needed for automated offer lookup. The missing piece is a lazy offer-fetching workflow that avoids scheduled scraping and avoids re-fetching the same restaurant on every dashboard request.

The offer cache is intentionally separate from domain data. AppDbContext remains PostgreSQL-backed and owns shared reference data, while OfferCacheDbContext will be SQLite-backed and will store disposable, TTL-bound latest snapshots only.

## Goals / Non-Goals

**Goals:**

- Add OfferCacheDbContext using SQLite with a separate connection and separate migration history from AppDbContext.
- Store one latest OfferCacheRow per RestaurantId with RestaurantId, BusinessDate, OffersJson, and FetchedAtUtc only.
- Add IOfferCacheRepository with GetByRestaurantIdAsync and UpsertAsync, without IBaseRepository, Base* inheritance, ownership scoping, metadata, or concurrency.
- Add OfferFetchService.GetDailyOffersAsync(restaurantId) as the orchestration layer used by the Web API.
- Implement cache freshness as same UTC business date and unexpired configurable TTL, defaulting to 1 hour.
- Add Html and Api provider fetch strategies under External behind a resolver keyed by OfferProvider.ProviderType.
- Expose GET /api/v1/restaurants/{restaurantId}/offers for authenticated callers.

**Non-Goals:**

- No DiningEnvironment, EnvironmentRestaurant, Favourite, UserWheel, or daily recommendation email changes.
- No scheduled offer fetching or background refresh process.
- No Redis usage for daily offers.
- No historical offer snapshots.
- No manual menu maintenance UI or admin workflow.

## Decisions

- Use a dedicated SQLite OfferCacheDbContext rather than Redis or AppDbContext. SQLite gives the cache a durable local table and EF migrations while keeping disposable offer snapshots out of PostgreSQL domain data. Alternative considered: Redis, but Redis is reserved for other app caching and would not satisfy the requested SQLite cache requirement.
- Key OfferCacheRow by RestaurantId and update the same row on every fetch. The cache is latest-snapshot data, so BusinessDate is part of freshness metadata, not row identity. Alternative considered: key by RestaurantId and BusinessDate for history, but that would retain old menus and conflict with the one-row-per-restaurant rule.
- Keep OfferCacheRow as a DataAccess-only EF model with no Domain model, Base* inheritance, ownership fields, metadata, or concurrency token. The row is not user-owned business data and has no soft-delete or optimistic concurrency contract. Alternative considered: model it through the standard vertical slice, but that would add ownership/concurrency concepts that the cache does not need.
- Inject an options object for cache TTL with a 1 hour default. OfferFetchService will compute now from server UTC time, derive BusinessDate from the UTC calendar date, and consider a row fresh only when row.BusinessDate equals today's BusinessDate and row.FetchedAtUtc + TTL is greater than now. Alternative considered: TTL-only freshness, but that can serve yesterday's menu shortly after midnight.
- Keep OfferFetchService in Application and provider-specific HTTP/parsing code in External. The service owns orchestration and IMethodResponse handling; External owns network and parsing details behind IOfferProviderFetcher and a resolver. Alternative considered: fetch directly in the controller, but that would bypass the use-case layer and make the API depend on low-level parsing concerns.
- Resolve only Html and Api to external fetchers. Restaurants with null OfferProviderId are treated as manual/no-provider restaurants and return any existing cache without attempting a fetch. If a referenced provider is Manual, it should follow the same no-fetch path unless a later manual-maintenance feature defines different behavior. Alternative considered: add a Manual fetch strategy, but there is no external source to fetch for manual restaurants.
- Normalize parsed offers before caching, then serialize a JSON array of offer items with `text` and nullable `priceText` fields into OffersJson. This keeps cache responses stable across Html and Api providers while matching the request to return OffersJson directly. Alternative considered: return an envelope with cache metadata, but the endpoint only needs to expose the current offers.
- Add focused parsing dependencies only where needed in External. Html parsing should use an HTML parser with CSS selector support, and Api parsing should use a JSONPath-capable parser compatible with System.Text.Json. Alternative considered: ad hoc string parsing, but that would be fragile and hard to validate.

## Risks / Trade-offs

- External source markup or API response shape changes -> Fetchers return controlled failures through OfferFetchService instead of corrupting the cache with partial data.
- Multiple requests for the same stale restaurant can fetch concurrently -> Upsert keeps one final row per restaurant; if duplicate external calls become a problem, add a per-restaurant lock later.
- SQLite DateOnly mapping can vary by provider/version -> Configure the BusinessDate column explicitly and verify generated migrations.
- Parser packages add dependencies to External -> Keep the contracts small and isolate package-specific code behind fetchers.
- Cached OffersJson shape becomes part of the API contract -> Keep the normalized item shape minimal (`text`, `priceText`) and keep source-specific fields out of the response.

## Migration Plan

- Add Microsoft.EntityFrameworkCore.Sqlite to DataAccess and configure OfferCacheDbContext with its own connection string.
- Add a design-time OfferCacheDbContext factory and generate migrations under a separate OfferCache migration folder with a separate migrations history table.
- Deploy the app with the new SQLite cache database path/connection configured before the offers endpoint is used.
- Roll back by removing the offers endpoint/service registrations and dropping or ignoring the SQLite cache database; no PostgreSQL domain rollback is required for the cache.

## Open Questions

- None.
