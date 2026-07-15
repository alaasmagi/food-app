## Why

Users want to rate and note a restaurant, independent of which environment(s) it appears in. This adds per-user favourites (a 1-5 rating plus an optional note) surfaced on each restaurant card, with save feedback via a toast.

## What Changes

- Add `src/types/favourite.ts`: a `Favourite` interface matching `FavouriteDto` (id, concurrencyToken, restaurantId, rating, note).
- Add `src/api/favourites.ts`: `getFavourites()` -> `GET /api/v1/favourites`, `createFavourite(input)` -> `POST`, `updateFavourite(id, input, concurrencyToken)` -> `PUT` with `If-Match`. There is no dedicated upsert endpoint; the store's upsert decides create-vs-update by looking up the restaurant's existing favourite.
- Add `src/stores/favourites.ts` (Pinia): a `Map`/record of `restaurantId -> Favourite`, fetched once on dashboard load, with an `upsert(restaurantId, rating, note)` action that POSTs a new favourite or PUTs the existing one (If-Match from its concurrency token) and updates the map from the response.
- Add `src/components/favourite/RatingStars.vue`: a small feature-specific component (the design system has no rating control) rendering 5 stars, with a read-only display mode and an editable click-to-set mode via a prop.
- Add `src/components/favourite/FavouriteEditorDialog.vue`: ported `Dialog` + `RatingStars` (editable) + `Input` (note) + `Button` (save/cancel), opened from `RestaurantCard`.
- Port the `Toast` primitive into `src/components/design-system/feedback/Toast.vue`, and add a small app-level toast service (a `toasts` store + a fixed-position `ToastHost` mounted at the app root) so any view can confirm a successful save or surface a save error.
- Modify `src/components/restaurant/RestaurantCard.vue`: show `RatingStars` (read-only) when a favourite exists, and add a "Rate" / "Edit rating" action that opens `FavouriteEditorDialog`.
- Validate the rating client-side (integer 1-5) before the API call, mirroring the backend `[Range(1,5)]`, to avoid an obviously-invalid round trip.

**Correction to the request**: `RatingStars` cannot use the ported `Icon` component for stars - there is no `star` glyph in the design system's icon set or the ported `IconName` union. `RatingStars` renders its own inline star SVG instead (it is a feature component, and the design system has no star).

## Capabilities

### New Capabilities
- `favourites`: per-user restaurant favourites - the typed API layer, the `restaurantId -> Favourite` store with create-or-update upsert, the `RatingStars` control, and the `FavouriteEditorDialog`.

### Modified Capabilities
- `design-system-foundation`: ADD the `Toast` primitive (notification card, 4 tones).
- `app-shell`: ADD a global toast host - a fixed-position stack mounted at the app root, fed by a toast store, so any view can enqueue transient notifications.
- `restaurant-offers`: MODIFY "Restaurant card" - it now also shows a read-only `RatingStars` when a favourite exists and a "Rate" / "Edit rating" action opening the favourite editor.

## Impact

- **New source areas**: `src/types/favourite.ts`, `src/api/favourites.ts`, `src/stores/favourites.ts`, `src/stores/toasts.ts`, `src/components/favourite/`, `src/components/design-system/feedback/Toast.vue`, a `ToastHost` at the app root. `RestaurantCard.vue` and the app root are modified.
- **Backend contract**: `/api/v1/favourites` (GET list, POST create, PUT/{id} update with `If-Match`), bearer-authorized and user-scoped server-side. `Rating` is `[Range(1,5)]`, `Note` is nullable (max 1024).
- **Concurrency**: updating an existing favourite round-trips its `If-Match` token from the store.
- **Design system**: first port of `Toast`; its tone icons (info / check-circle / alert-triangle / alert-circle) are already in the ported `IconName` union.
- **No new dependencies.**

## Out of Scope

- Sorting or filtering the dashboard by rating, the wheel, notification settings.
