# favourites Specification

## Purpose
TBD - created by syncing change add-favourites. Update Purpose after archive.
## Requirements
### Requirement: Typed favourites API layer

The application SHALL provide `src/api/favourites.ts` routing through the shared bearer fetch wrapper, with a `Favourite` type matching `FavouriteDto` (id, concurrencyToken, restaurantId, rating, note). It SHALL expose `getFavourites()`, `createFavourite(input)`, and `updateFavourite(id, input, concurrencyToken)`; update SHALL send the `If-Match` header. There is no dedicated upsert endpoint.

#### Scenario: List favourites

- **WHEN** `getFavourites()` is called
- **THEN** it issues a bearer-authorized `GET /api/v1/favourites` and resolves to an array of `Favourite`

#### Scenario: Create and update

- **WHEN** `createFavourite` or `updateFavourite` is called
- **THEN** it POSTs to `/api/v1/favourites` or PUTs to `/api/v1/favourites/{id}` with the favourite's concurrency token as `If-Match` on update

### Requirement: Favourites store with create-or-update upsert

The application SHALL provide a Pinia `favourites` store keyed by `restaurantId -> Favourite`, fetched once on dashboard load. It SHALL expose `favouriteFor(restaurantId)` and an `upsert(restaurantId, rating, note)` action that creates a new favourite when none exists for the restaurant, or updates the existing one (sending its concurrency token as `If-Match`), then updates the map from the response.

#### Scenario: Fetched once

- **WHEN** favourites are loaded and already cached
- **THEN** the store does not issue another list request

#### Scenario: Upsert creates when absent

- **WHEN** `upsert` is called for a restaurant with no existing favourite
- **THEN** a favourite is created and stored under that `restaurantId`

#### Scenario: Upsert updates when present

- **WHEN** `upsert` is called for a restaurant that already has a favourite
- **THEN** the existing favourite is updated with its concurrency token as `If-Match`, and the store's entry is replaced from the response

### Requirement: Rating stars control

The application SHALL provide `src/components/favourite/RatingStars.vue` rendering 5 stars, with a read-only display mode and an editable click-to-set mode selected by a prop. It SHALL render its own star glyph (the design system has no star icon). In editable mode, activating the nth star SHALL emit a rating of n.

#### Scenario: Read-only display

- **WHEN** `RatingStars` renders a rating in read-only mode
- **THEN** it shows that many filled stars and is not interactive

#### Scenario: Editable selection

- **WHEN** the control is editable and the user activates the nth star
- **THEN** it emits the rating value n

### Requirement: Favourite editor dialog

The application SHALL provide `src/components/favourite/FavouriteEditorDialog.vue` built on the ported `Dialog`, editable `RatingStars`, `Input` (note), and `Button` (save/cancel). It SHALL validate the rating as an integer in 1-5 before calling the API, mirroring the backend, and SHALL confirm a successful save or surface a save error via a toast.

#### Scenario: Save a valid favourite

- **WHEN** the user picks a rating in 1-5 and saves
- **THEN** the store upserts the favourite and a success toast is shown

#### Scenario: Client-side rating validation

- **WHEN** the rating is not an integer in 1-5
- **THEN** the save is blocked client-side without an API call

#### Scenario: Save error surfaced

- **WHEN** the upsert request fails
- **THEN** a danger toast is shown and the dialog remains open for a retry
