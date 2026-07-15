## Why

Daily restaurant offers should be loaded only when a user asks for them, but dashboard views must not scrape or query the same external restaurant source on every request. A short-lived cache keeps lazy fetching responsive while avoiding scheduled offer ingestion.

## What Changes

- Add a SQLite-backed offer cache using a dedicated OfferCacheDbContext, separate connection string, and separate EF migration history from AppDbContext.
- Add a DataAccess-only OfferCacheRow with RestaurantId, BusinessDate, OffersJson, and FetchedAtUtc, with one latest snapshot row per restaurant.
- Add a lightweight IOfferCacheRepository with GetByRestaurantIdAsync and UpsertAsync instead of the base repository stack.
- Add OfferFetchService.GetDailyOffersAsync(restaurantId) to orchestrate restaurant/provider lookup, cache freshness checks, provider fetching, normalization, cache upsert, and response generation.
- Add configurable offer cache TTL with a default of 1 hour and freshness logic that requires both today's UTC BusinessDate and an unexpired FetchedAtUtc + TTL window.
- Add Html and Api provider fetch strategies under External behind IOfferProviderFetcher and a provider-type resolver keyed by OfferProvider.ProviderType.
- Add GET /api/v1/restaurants/{restaurantId}/offers, calling OfferFetchService rather than accessing cache or repositories directly.
- For restaurants without an OfferProviderId, return any existing cached offers and make no external fetch attempt.

## Capabilities

### New Capabilities

- `daily-offer-fetching`: Lazy daily offer retrieval for restaurants, backed by a dedicated SQLite latest-snapshot cache and provider-type fetch strategies.

### Modified Capabilities

- None.

## Impact

- Adds DataAccess persistence for OfferCacheDbContext, OfferCacheRow, SQLite configuration, repository implementation, and OfferCacheDbContext migrations.
- Adds Contracts interfaces for the offer cache repository, OfferFetchService, provider fetchers, and provider fetcher resolver.
- Adds Application orchestration for daily offer fetching, freshness checks, manual restaurant behavior, offer normalization, and cache writes.
- Adds External Html and Api fetching/parsing strategies that use Restaurant.OffersResourceUrl with OfferProvider locator configuration.
- Adds Web API route GET /api/v1/restaurants/{restaurantId}/offers and DI registrations for the new service, repository, cache context, options, and fetch strategies.
- Does not change DiningEnvironment, EnvironmentRestaurant, Favourite, UserWheel, or daily recommendation email behavior.
