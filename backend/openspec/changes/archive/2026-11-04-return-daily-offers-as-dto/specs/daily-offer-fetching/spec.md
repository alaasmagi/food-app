## MODIFIED Requirements

### Requirement: OfferFetchService orchestrates daily offer retrieval
The system SHALL expose OfferFetchService.GetDailyOffersAsync(restaurantId) to load restaurant data, evaluate the cache, fetch stale offers, normalize results, update the cache, and return offers as a collection of DailyOfferItem domain values.

#### Scenario: Missing restaurant
- **WHEN** GetDailyOffersAsync is called with a RestaurantId that does not exist
- **THEN** the system returns a not-found response through the standard IMethodResponse error mapping.

#### Scenario: Cached response
- **WHEN** GetDailyOffersAsync finds a fresh cache row for the RestaurantId
- **THEN** it returns the offers deserialized from the cached OffersJson without loading an external resource.

#### Scenario: Stale automated response
- **WHEN** GetDailyOffersAsync finds no fresh cache row and the restaurant references a fetchable OfferProvider
- **THEN** it fetches offers from Restaurant.OffersResourceUrl using the referenced OfferProvider configuration, normalizes the parsed offers, upserts the restaurant cache row, and returns the fetched offers.

#### Scenario: Manual restaurant with cached offers
- **WHEN** GetDailyOffersAsync finds a restaurant with no OfferProviderId and an existing cache row
- **THEN** it returns the offers from the cache row without attempting an external fetch.

#### Scenario: Manual restaurant without cached offers
- **WHEN** GetDailyOffersAsync finds a restaurant with no OfferProviderId and no cache row
- **THEN** it returns an empty offers result without attempting an external fetch.

### Requirement: Daily offers API uses OfferFetchService
The system SHALL expose GET /api/v1/restaurants/{restaurantId}/offers, handle it through OfferFetchService, and return a JSON array of DailyOfferDto items with `offerText` and nullable `offerPrice`, mapped from DailyOfferItem through a Web mapper.

#### Scenario: Get restaurant offers
- **WHEN** an authenticated caller sends GET /api/v1/restaurants/{restaurantId}/offers for an existing restaurant
- **THEN** the controller calls OfferFetchService.GetDailyOffersAsync and returns its offers as an array of `{ offerText, offerPrice }` objects.

#### Scenario: Offer without price
- **WHEN** an offer has no price
- **THEN** its `offerPrice` is `null` in the response.

#### Scenario: Missing restaurant through API
- **WHEN** an authenticated caller sends GET /api/v1/restaurants/{restaurantId}/offers for a missing restaurant
- **THEN** the API returns a not-found response through the standard IMethodResponse error mapping.

#### Scenario: Controller does not access cache directly
- **WHEN** the daily offers endpoint handles a request
- **THEN** it does not call IOfferCacheRepository or OfferCacheDbContext directly.
