# daily-offer-fetching Specification

## Purpose
TBD - created by archiving change add-offer-fetch-service. Update Purpose after archive.
## Requirements
### Requirement: Daily offers are fetched lazily
The system SHALL fetch daily restaurant offers only when `GetDailyOffersAsync`, the daily offers API endpoint, or the scheduled daily recommendation notification assembly requests current offers.

#### Scenario: User requests offers
- **WHEN** an authenticated caller requests daily offers for a restaurant
- **THEN** the system evaluates the cache and fetches from an external provider only if the restaurant cache row is missing or stale.

#### Scenario: Scheduled recommendation requests current offers
- **WHEN** the scheduled daily recommendation notification flow needs current offers for an opted-in user's fetchable restaurant
- **THEN** the system may evaluate the cache and fetch from an external provider only if that restaurant cache row is missing or stale.

#### Scenario: No standalone scheduled prefetch
- **WHEN** the application starts or runs background services outside the daily recommendation notification flow
- **THEN** the system does not proactively fetch daily offers for restaurants on a schedule.

### Requirement: Offer cache uses a dedicated SQLite context
The system SHALL store daily offer cache rows in a dedicated SQLite OfferCacheDbContext separate from AppDbContext.

#### Scenario: Separate database context
- **WHEN** the offer cache is configured
- **THEN** OfferCacheDbContext uses its own SQLite connection and does not use the PostgreSQL AppDbContext connection.

#### Scenario: Separate migration history
- **WHEN** EF Core migrations are generated for the offer cache
- **THEN** the migrations and migration history are separate from AppDbContext migrations and history.

#### Scenario: Cache row is not a domain entity
- **WHEN** OfferCacheRow is implemented
- **THEN** it exists only in DataAccess and has no Domain model, Base* inheritance, ownership fields, metadata fields, or concurrency token.

### Requirement: Offer cache stores one latest snapshot per restaurant
The system SHALL keep at most one OfferCacheRow for each RestaurantId.

#### Scenario: Insert cache row
- **WHEN** fetched offers are cached for a restaurant with no existing cache row
- **THEN** the system inserts one row containing RestaurantId, BusinessDate, OffersJson, and FetchedAtUtc.

#### Scenario: Update cache row
- **WHEN** fetched offers are cached for a restaurant that already has a cache row
- **THEN** the system updates that existing row instead of inserting a historical row.

### Requirement: Offer cache repository is lightweight
The system SHALL access offer cache rows through an IOfferCacheRepository with GetByRestaurantIdAsync and UpsertAsync operations.

#### Scenario: Read cache row by restaurant
- **WHEN** OfferFetchService checks the cache for a restaurant
- **THEN** it calls IOfferCacheRepository.GetByRestaurantIdAsync with the RestaurantId.

#### Scenario: Upsert cache row
- **WHEN** OfferFetchService stores fetched offers
- **THEN** it calls IOfferCacheRepository.UpsertAsync and does not use IBaseRepository behavior for the cache row.

### Requirement: Cache freshness accounts for UTC calendar day and TTL
The system SHALL consider a cache row fresh only when row.BusinessDate equals today's UTC BusinessDate and row.FetchedAtUtc plus the configured TTL is later than the current UTC time.

#### Scenario: Fresh row
- **WHEN** a cache row has today's UTC BusinessDate and FetchedAtUtc plus TTL is later than now
- **THEN** OfferFetchService returns the cached OffersJson without invoking a provider fetcher.

#### Scenario: TTL expired
- **WHEN** a cache row has today's UTC BusinessDate but FetchedAtUtc plus TTL is not later than now
- **THEN** OfferFetchService treats the row as stale and attempts a provider fetch if the restaurant has a fetchable provider.

#### Scenario: Calendar day rolled over
- **WHEN** a cache row's BusinessDate is not today's UTC BusinessDate
- **THEN** OfferFetchService treats the row as stale even if FetchedAtUtc plus TTL is later than now.

#### Scenario: Default TTL
- **WHEN** no offer cache TTL is configured
- **THEN** the system uses a default TTL of 1 hour.

#### Scenario: Business date calculation
- **WHEN** OfferFetchService creates or evaluates a cache row
- **THEN** it computes BusinessDate from the server UTC calendar date without timezone conversion.

### Requirement: OfferFetchService orchestrates daily offer retrieval
The system SHALL expose OfferFetchService.GetDailyOffersAsync(restaurantId) to load restaurant data, evaluate the cache, fetch stale offers, normalize results, update the cache, and return offers.

#### Scenario: Missing restaurant
- **WHEN** GetDailyOffersAsync is called with a RestaurantId that does not exist
- **THEN** the system returns a not-found response through the standard IMethodResponse error mapping.

#### Scenario: Cached response
- **WHEN** GetDailyOffersAsync finds a fresh cache row for the RestaurantId
- **THEN** it returns the cached OffersJson without loading an external resource.

#### Scenario: Stale automated response
- **WHEN** GetDailyOffersAsync finds no fresh cache row and the restaurant references a fetchable OfferProvider
- **THEN** it fetches offers from Restaurant.OffersResourceUrl using the referenced OfferProvider configuration, normalizes the parsed offers, upserts the restaurant cache row, and returns the updated OffersJson.

#### Scenario: Manual restaurant with cached offers
- **WHEN** GetDailyOffersAsync finds a restaurant with no OfferProviderId and an existing cache row
- **THEN** it returns the cached OffersJson without attempting an external fetch.

#### Scenario: Manual restaurant without cached offers
- **WHEN** GetDailyOffersAsync finds a restaurant with no OfferProviderId and no cache row
- **THEN** it returns an empty offers result without attempting an external fetch.

### Requirement: Provider fetchers are resolved by provider type
The system SHALL resolve provider fetch strategies by OfferProvider.ProviderType and keep provider-specific fetching under External.

#### Scenario: HTML provider
- **WHEN** a stale or missing cache row belongs to a restaurant whose OfferProvider.ProviderType is Html
- **THEN** OfferFetchService uses the Html provider fetcher with Restaurant.OffersResourceUrl and the provider's locator fields.

#### Scenario: API provider
- **WHEN** a stale or missing cache row belongs to a restaurant whose OfferProvider.ProviderType is Api
- **THEN** OfferFetchService uses the Api provider fetcher with Restaurant.OffersResourceUrl and the provider's locator fields.

#### Scenario: Manual provider type
- **WHEN** a restaurant references an OfferProvider whose ProviderType is Manual
- **THEN** OfferFetchService does not invoke an external fetcher and returns any existing cached offers.

#### Scenario: Unsupported provider type
- **WHEN** no provider fetcher can handle the referenced OfferProvider.ProviderType
- **THEN** the system returns a controlled failure through the standard IMethodResponse error mapping.

### Requirement: Parsed offers are normalized before caching
The system SHALL normalize provider-specific parsed offers into a JSON array of offer items with `text` and nullable `priceText` fields before serializing them into OffersJson.

#### Scenario: Normalize HTML offers
- **WHEN** the Html fetcher parses offers from an HTML resource
- **THEN** the service stores and returns a normalized JSON array of `text` and `priceText` items rather than provider-specific HTML.

#### Scenario: Normalize API offers
- **WHEN** the Api fetcher parses offers from a JSON API resource
- **THEN** the service stores and returns a normalized JSON array of `text` and `priceText` items rather than provider-specific source JSON.

#### Scenario: Empty normalized result
- **WHEN** no offers are available for a manual restaurant or a provider returns no parsed offers
- **THEN** the service stores or returns `[]` as the OffersJson value.

### Requirement: Daily offers API uses OfferFetchService
The system SHALL expose GET /api/v1/restaurants/{restaurantId}/offers and handle it through OfferFetchService.

#### Scenario: Get restaurant offers
- **WHEN** an authenticated caller sends GET /api/v1/restaurants/{restaurantId}/offers for an existing restaurant
- **THEN** the controller calls OfferFetchService.GetDailyOffersAsync and returns its offers response.

#### Scenario: Missing restaurant through API
- **WHEN** an authenticated caller sends GET /api/v1/restaurants/{restaurantId}/offers for a missing restaurant
- **THEN** the API returns a not-found response through the standard IMethodResponse error mapping.

#### Scenario: Controller does not access cache directly
- **WHEN** the daily offers endpoint handles a request
- **THEN** it does not call IOfferCacheRepository or OfferCacheDbContext directly.

