# restaurant-data Specification

## Purpose

Typed access to the backend Web restaurant and offer data: hand-written DTO models, a fetch-based API module with RFC 7807 error handling, and React Query hooks that make the cache the source of truth with lazy per-restaurant offers. (Purpose is brief - refine as the capability grows.)

## Requirements

### Requirement: Typed restaurant and offer models

The app SHALL define hand-written TypeScript interfaces in `src/types/restaurant.ts` matching the backend Web DTOs (camelCase): a `Restaurant` with `id`, `concurrencyToken`, `name`, `city`, `latitude`, `longitude`, `offerTimeText`, `parkingInfo`, `openingInfo`, `hasOffers`, `isFastFood` (all non-null) and `offersResourceUrl`, `offerProviderId` (nullable); and an `Offer` with `offerText` (non-null) and `offerPrice` (string | null, a display string).

#### Scenario: Restaurant shape matches the API

- **WHEN** the app deserializes a restaurant from `GET /api/v1/restaurants`
- **THEN** the object conforms to the `Restaurant` interface with the exact backend field names and nullability

#### Scenario: Offer price is treated as a display string

- **WHEN** an `Offer` has an `offerPrice` such as "4.90 EUR" or `null`
- **THEN** the app renders it verbatim as text and never parses it as a number

### Requirement: Restaurant API module

The app SHALL provide `src/api/restaurants.ts` with typed functions that call `GET /api/v1/restaurants` (returning `Restaurant[]`) and `GET /api/v1/restaurants/{id}/offers` (returning `Offer[]`) through the shared authenticated `apiFetch` helper. Components SHALL NOT call fetch directly.

#### Scenario: List restaurants

- **WHEN** the restaurants function is called
- **THEN** it requests `GET /api/v1/restaurants` with the bearer token via `apiFetch` and resolves to a `Restaurant[]`

#### Scenario: Fetch a restaurant's offers

- **WHEN** the offers function is called with a restaurant id
- **THEN** it requests `GET /api/v1/restaurants/{id}/offers` via `apiFetch` and resolves to an `Offer[]`

### Requirement: ProblemDetails error handling

The API module SHALL treat a successful response body as the bare payload and, on a non-ok response, SHALL parse the RFC 7807 ProblemDetails body (`title`, `detail`, `status`) and throw a typed error carrying those fields. There is no `IMethodResponse<T>` wrapper on the wire.

#### Scenario: Success returns the bare payload

- **WHEN** the backend responds ok
- **THEN** the module parses the body directly as the typed DTO or array with no envelope unwrapping

#### Scenario: Error surfaces ProblemDetails

- **WHEN** the backend responds with a non-ok status and a ProblemDetails body
- **THEN** the module throws an error exposing `title`, `detail`, and `status` for the caller to surface

### Requirement: React Query data hooks

The app SHALL expose React Query hooks `useRestaurants()` and `useRestaurantOffers(id)` wrapping the API module, with React Query's cache as the source of truth for server data. `useRestaurantOffers(id)` SHALL fetch lazily and be disabled until explicitly enabled, mirroring the backend's per-restaurant lazy offers design.

#### Scenario: Restaurants query caches the list

- **WHEN** `useRestaurants()` is used by more than one component
- **THEN** the list is fetched once, cached under a stable query key, and shared without duplicate requests

#### Scenario: Offers query is lazy

- **WHEN** `useRestaurantOffers(id)` is mounted but not yet enabled
- **THEN** no request to `/{id}/offers` is made until the hook is enabled

#### Scenario: Offers query fetches on enable

- **WHEN** `useRestaurantOffers(id)` becomes enabled
- **THEN** it fetches that restaurant's offers and caches them under a per-id query key
