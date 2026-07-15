## 1. Cache Persistence

- [x] 1.1 Add SQLite EF Core support to DataAccess and add configuration access for the offer cache SQLite connection string.
- [x] 1.2 Add DataAccess-only OfferCacheRow with RestaurantId, BusinessDate, OffersJson, and FetchedAtUtc, with no Domain model, Base* inheritance, metadata, ownership, or concurrency fields.
- [x] 1.3 Add OfferCacheDbContext with a DbSet for OfferCacheRow, explicit table configuration, DateOnly handling, and a unique key or index that enforces one row per RestaurantId.
- [x] 1.4 Add an OfferCacheDbContext design-time factory and configure a separate migration assembly/folder and migrations history table from AppDbContext.
- [x] 1.5 Add IOfferCacheRepository to Contracts/DataAccess with GetByRestaurantIdAsync and UpsertAsync.
- [x] 1.6 Implement OfferCacheRepository in DataAccess using OfferCacheDbContext and latest-snapshot upsert behavior.

## 2. Contracts and DTO Shape

- [x] 2.1 Add a normalized daily offer DTO/model with text and nullable priceText fields for parsed and cached offer items.
- [x] 2.2 Add OfferCacheOptions with a configurable TTL that defaults to 1 hour when not configured.
- [x] 2.3 Add IOfferFetchService to Contracts/Application with GetDailyOffersAsync(Guid restaurantId).
- [x] 2.4 Add IOfferProviderFetcher and IOfferProviderFetcherResolver to Contracts/External, keyed by EOfferProviderType.
- [x] 2.5 Define controlled error paths for missing restaurants, missing referenced providers, unsupported provider types, fetch failures, and parse failures using the existing IMethodResponse/ErrorDefaults pattern.

## 3. External Provider Fetching

- [x] 3.1 Add the selected HTML parser dependency to External and implement HtmlOfferProviderFetcher using Restaurant.OffersResourceUrl plus OfferProvider locator fields.
- [x] 3.2 Add the selected JSONPath-capable JSON parser dependency to External and implement ApiOfferProviderFetcher using Restaurant.OffersResourceUrl plus OfferProvider locator fields.
- [x] 3.3 Implement OfferProviderFetcherResolver to return Html and Api fetchers and treat Manual as non-fetchable.
- [x] 3.4 Ensure fetchers trim and normalize parsed text/price values and return an empty collection when no offers are parsed.

## 4. OfferFetchService

- [x] 4.1 Implement OfferFetchService in Application using IRestaurantRepository, IOfferProviderRepository, IOfferCacheRepository, IOfferProviderFetcherResolver, OfferCacheOptions, and JSON serialization.
- [x] 4.2 Compute today's BusinessDate from server UTC date with no timezone conversion and use the freshness rule BusinessDate == today and FetchedAtUtc + TTL > now.
- [x] 4.3 Return cached OffersJson immediately for fresh rows without invoking external fetchers.
- [x] 4.4 For missing or stale rows with Html or Api providers, fetch, normalize to an array of text/priceText items, serialize to OffersJson, upsert the cache row, and return the new OffersJson.
- [x] 4.5 For restaurants with null OfferProviderId or Manual provider type, return existing cached OffersJson or [] without attempting an external fetch.
- [x] 4.6 Preserve standard IMethodResponse handling for not-found, unsupported provider, fetch, and parse failures.

## 5. Web and DI Wiring

- [x] 5.1 Register OfferCacheDbContext, IOfferCacheRepository, OfferCacheOptions, IOfferFetchService, provider fetchers, resolver, HttpClient dependencies, and parser services in Web/Configuration/ServiceConfiguration.cs.
- [x] 5.2 Add GET /api/v1/restaurants/{restaurantId}/offers to RestaurantsController or a nested offers controller and route it through IOfferFetchService only.
- [x] 5.3 Map OfferFetchService errors to HTTP responses consistently with existing controller error handling.
- [x] 5.4 Ensure the offers endpoint is authenticated by the existing fallback policy and does not require admin authorization.

## 6. Migrations and Configuration

- [x] 6.1 Add appsettings entries and RequiredConfiguration support for the offer cache SQLite connection string and optional TTL.
- [x] 6.2 Generate an OfferCacheDbContext SQLite migration in a separate OfferCache migration folder.
- [x] 6.3 Inspect the generated migration to verify only the offer cache table/history are affected and AppDbContext migrations are unchanged.

## 7. Verification

- [x] 7.1 Build the solution and fix compile or nullable-reference warnings introduced by this change.
- [x] 7.2 Verify a fresh same-day cache row returns cached OffersJson and does not call a provider fetcher.
- [x] 7.3 Verify a same-day row with expired TTL triggers provider fetch and overwrites the same RestaurantId row.
- [x] 7.4 Verify a previous-day row is stale even when still inside the TTL window.
- [x] 7.5 Verify null OfferProviderId and Manual provider type return cached OffersJson or [] without external fetch.
- [x] 7.6 Verify Html and Api provider paths use Restaurant.OffersResourceUrl and locator fields and cache normalized text/priceText JSON.
- [x] 7.7 Verify GET /api/v1/restaurants/{restaurantId}/offers returns not-found for missing restaurants and does not access the cache repository directly from the controller.
