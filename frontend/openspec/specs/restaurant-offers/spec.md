# restaurant-offers Specification

## Purpose
TBD - created by archiving change add-restaurant-offers-dashboard. Update Purpose after archive.
## Requirements
### Requirement: Typed restaurant and offer API layer

The application SHALL provide `src/api/restaurants.ts` with `getRestaurants()` calling `GET /api/v1/restaurants` and `getRestaurantOffers(id)` calling `GET /api/v1/restaurants/{id}/offers`, both routed through the shared bearer fetch wrapper. Request/response types SHALL be hand-written interfaces matching the backend Web DTOs: `Restaurant` mirrors `RestaurantDto`, and the offers response is a bare array of `DailyOffer` (`{ offerText: string; offerPrice: string | null }`).

#### Scenario: Fetch the catalog

- **WHEN** `getRestaurants()` is called
- **THEN** it issues a bearer-authorized `GET /api/v1/restaurants` through the shared wrapper and resolves to an array of `Restaurant`

#### Scenario: Fetch one restaurant's offers

- **WHEN** `getRestaurantOffers(id)` is called
- **THEN** it issues a bearer-authorized `GET /api/v1/restaurants/{id}/offers` and resolves to an array of `DailyOffer`

#### Scenario: Offers response is a bare array

- **WHEN** the offers endpoint returns its JSON body
- **THEN** it is parsed as an array of `{ offerText, offerPrice }`, with `offerPrice` allowed to be null, and no `businessDate` field is expected

### Requirement: In-memory catalog and lazy per-restaurant offers cache

The application SHALL provide a Pinia `restaurants` store holding the restaurant list fetched once and cached in memory, and a per-restaurant offers cache keyed by restaurant id (`{ offers, loading, error, loaded }`). Offers SHALL be fetched lazily per restaurant, never for all restaurants at once.

#### Scenario: Catalog fetched once

- **WHEN** the restaurant list is requested and already cached
- **THEN** the store returns the cached list without issuing another catalog request

#### Scenario: Offers fetched lazily per restaurant

- **WHEN** a single restaurant's offers are requested
- **THEN** only that restaurant's offers endpoint is called, and the result is cached under its id

#### Scenario: Cached offers are not refetched

- **WHEN** a restaurant's offers have already loaded and are requested again
- **THEN** the store serves the cached offers without a new request

#### Scenario: Loading and error are tracked per restaurant

- **WHEN** a restaurant's offers fetch is in flight or fails
- **THEN** that restaurant's cache entry reflects `loading` true during the request and records an `error` on failure, without affecting other restaurants' entries

### Requirement: Restaurant card

The application SHALL provide `src/components/restaurant/RestaurantCard.vue` composed from the `Card`, `Badge`, and `Tag` primitives. It SHALL show the restaurant name, offer time text, parking info, and opening info; a city `Tag`; a "Fast food" `Badge` when `isFastFood`; a "No offers today" `Badge` when `hasOffers` is false or the fetched offers list is empty; and a "See offers" `Button` that triggers the lazy offers fetch. When a specific dining environment (not "All") is selected, the card SHALL also show an "Add to environment" or "Remove from environment" action reflecting the restaurant's membership in that environment. When a favourite exists for the restaurant the card SHALL show a read-only `RatingStars`, and it SHALL show a "Rate" or "Edit rating" action that opens the favourite editor dialog.

#### Scenario: Renders restaurant details

- **WHEN** a `RestaurantCard` renders for a restaurant
- **THEN** it shows the name, offer time text, parking info, opening info, and a city tag

#### Scenario: Fast food badge

- **WHEN** the restaurant's `isFastFood` is true
- **THEN** a "Fast food" badge is shown

#### Scenario: No offers badge

- **WHEN** the restaurant's `hasOffers` is false, or its fetched offers list is empty
- **THEN** a "No offers today" badge is shown

#### Scenario: See offers triggers the lazy fetch

- **WHEN** the user activates the "See offers" button
- **THEN** the store fetches that restaurant's offers (once) and the card reveals its offer list

#### Scenario: Membership action only under a specific environment

- **WHEN** a specific environment (not "All") is selected
- **THEN** the card shows an "Add to environment" action when the restaurant is not a member, or "Remove from environment" when it is; under "All" no such action is shown

#### Scenario: Toggling membership

- **WHEN** the user activates the add or remove action
- **THEN** the environments store adds or removes the restaurant's membership in the selected environment and the action label updates accordingly

#### Scenario: Shows rating when a favourite exists

- **WHEN** a favourite exists for the restaurant
- **THEN** the card shows a read-only `RatingStars` for the favourite's rating, and the action reads "Edit rating"; when no favourite exists the action reads "Rate"

#### Scenario: Opening the favourite editor

- **WHEN** the user activates the "Rate" or "Edit rating" action
- **THEN** the favourite editor dialog opens for that restaurant

### Requirement: Offer list

The application SHALL provide `src/components/restaurant/OfferList.vue` that renders the fetched `offerText` / `offerPrice` pairs for one restaurant. It SHALL show a loading state while the fetch is in flight and an empty state ("No offers available") - not an error - when the source genuinely has no offers today.

#### Scenario: Renders offer lines

- **WHEN** offers have loaded for a restaurant
- **THEN** each offer's text and price are rendered as a pair

#### Scenario: Loading state

- **WHEN** the offers fetch is in flight
- **THEN** a loading indication is shown instead of the list

#### Scenario: Empty state, not an error

- **WHEN** the fetch succeeds but returns no offers
- **THEN** an "No offers available" empty state is shown rather than an error

### Requirement: Dashboard lists the restaurant catalog

The dashboard SHALL present the restaurants from the shared catalog in two switchable views, a "List" view and a "Map" view, selected by a List/Map toggle. Both views SHALL draw from the already-loaded catalog with no extra restaurant fetch. The List view SHALL render restaurants via `RestaurantCard`, each independently expandable to show its `OfferList`, and SHALL show the full catalog under every environment tab, because it doubles as the membership-management UI (the "Add to environment" action lives on non-member cards). The Map view SHALL render restaurants via `RestaurantMap` and SHALL honour the selected environment: under "All" it shows every restaurant, and under a specific environment it shows only that environment's members, filtered client-side against the already-loaded catalog. The dashboard SHALL render `EnvironmentTabs` above the views and a "Manage environments" entry point that opens the environment editor. All UI copy SHALL follow the design system content rules (sentence case, no exclamation points, no em-dashes, digits not spelled numbers).

#### Scenario: Lists all restaurants under "All"

- **WHEN** an authenticated user opens the dashboard with "All" selected and the List view active
- **THEN** the store loads the catalog and a `RestaurantCard` is rendered for each restaurant

#### Scenario: List keeps the full catalog under a specific environment

- **WHEN** the user selects a specific environment tab with the List view active
- **THEN** every restaurant stays visible so member and non-member cards both expose their membership actions, without fetching restaurants again

#### Scenario: Toggle switches between list and map

- **WHEN** the user activates the List/Map toggle
- **THEN** the dashboard shows the List view or the Map view of the same already-loaded catalog, without issuing a new restaurant fetch

#### Scenario: Map honours the selected environment

- **WHEN** the user selects a specific environment tab with the Map view active
- **THEN** the map shows only that environment's member restaurants; selecting "All" shows every restaurant, in both cases from the already-loaded catalog

#### Scenario: Independent expansion

- **WHEN** the user expands one restaurant's offers in the List view
- **THEN** only that restaurant's offers load and expand, leaving other cards unchanged

#### Scenario: Copy follows content rules

- **WHEN** the dashboard and its cards render text
- **THEN** the copy is sentence case with no exclamation points, em-dashes, or emoji, and numbers are digits
