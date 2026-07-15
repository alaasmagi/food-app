## 1. Toast primitive and service

- [x] 1.1 Port `Toast` to `src/components/design-system/feedback/Toast.vue` from its `.d.ts` + `.prompt.md` + `.card.html` (+ `.jsx`): `title`, `description?`, `tone` ("info" | "success" | "warning" | "danger"), `close` emit; per-tone ported `Icon` glyph (info / check-circle / alert-triangle / alert-circle); scoped CSS only
- [x] 1.2 Add `src/stores/toasts.ts` (Pinia): active toasts list, `push({ title, description?, tone })` returning an id with per-toast auto-dismiss (setTimeout), and `dismiss(id)`
- [x] 1.3 Add `src/components/notifications/ToastHost.vue`: a fixed-position bottom-right stack rendering the store's active toasts via `Toast`, wired to `dismiss` on each toast's `close`; mount it once at the app root in `App.vue` with a stacking context above `Dialog`
- [x] 1.4 Add smoke tests: `Toast` renders each tone with its icon and emits `close`; the `toasts` store `push`/`dismiss` add and remove entries

## 2. Types and API layer

- [x] 2.1 Add `src/types/favourite.ts`: `Favourite` (id, concurrencyToken, restaurantId, rating `number`, note `string | null`) matching `FavouriteDto`
- [x] 2.2 Add `src/api/favourites.ts` through the shared `apiFetch`: `getFavourites()` -> `GET /api/v1/favourites`, `createFavourite(input)` -> `POST`, `updateFavourite(id, input, concurrencyToken)` -> `PUT` with `If-Match`

## 3. Favourites store

- [x] 3.1 Add `src/stores/favourites.ts` (Pinia): `byRestaurantId: Record<string, Favourite>`, `loadFavourites()` (fetched once), `favouriteFor(restaurantId)`, and an `upsert(restaurantId, rating, note)` action that PUTs the existing favourite (If-Match) or POSTs a new one, then stores the response by `restaurantId`; per-restaurant pending guard

## 4. Favourite components

- [x] 4.1 Add `src/components/favourite/RatingStars.vue`: 5 stars drawn as inline star `<svg>` (no Icon dependency), read-only display mode and editable mode via a prop; editable stars are focusable `<button>`s that emit the rating (1-5) on activation
- [x] 4.2 Add `src/components/favourite/FavouriteEditorDialog.vue` (ported `Dialog` + editable `RatingStars` + `Input` note + `Button` save/cancel): validates the rating as an integer 1-5 before calling `favourites.upsert`; on success shows a success toast and closes; on failure shows a danger toast and stays open

## 5. Card integration

- [x] 5.1 Modify `src/components/restaurant/RestaurantCard.vue`: read `favourites.favouriteFor(restaurant.id)`; show read-only `RatingStars` when a favourite exists; add a "Rate" (no favourite) / "Edit rating" (favourite exists) `Button` that opens `FavouriteEditorDialog` for the restaurant
- [x] 5.2 Load favourites on dashboard mount: call `favourites.loadFavourites()` in `DashboardView.vue` alongside the existing loads

## 6. Tests

- [x] 6.1 Add store tests: `loadFavourites` indexes by `restaurantId` and fetches once; `upsert` POSTs when absent and PUTs with `If-Match` when present, updating the map from the response
- [x] 6.2 Add component tests: `RatingStars` displays N filled stars read-only and emits the chosen rating when editable; `FavouriteEditorDialog` blocks save on an invalid rating and calls `upsert` + a success toast on a valid save; `RestaurantCard` shows read-only stars and the correct "Rate"/"Edit rating" label

## 7. Verification

- [x] 7.1 Run `vue-tsc`/`vite build` and the Vitest suite; confirm type-check, build, and all tests pass
- [x] 7.2 Grep `src/` for any import/`@import`/relative path into `alaasmagi-design-system/` and confirm there are none
