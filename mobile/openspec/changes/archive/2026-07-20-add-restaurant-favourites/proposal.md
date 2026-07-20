## Why

Users want to rate restaurants (1-5) and jot a personal note, independent of environments, and see that rating at a glance on the Dashboard. The web frontend already ships this against the same backend; this brings feature parity to mobile.

## What Changes

- Add `src/types/favourite.ts` with a `Favourite` type matching the backend Web DTO (`id`, `concurrencyToken`, `restaurantId`, `rating` 1-5, nullable `note`).
- Add `src/api/favourites.ts` with `getFavourites()`, `createFavourite(input)`, and `updateFavourite(id, input, concurrencyToken)` through the shared `apiFetch`; update sends the `If-Match` header. There is no dedicated upsert endpoint.
- Add React Query hooks: `useFavourites()` (list) with a `favouriteFor(restaurantId)` derivation, and a `useUpsertFavourite()` mutation that creates when no favourite exists for the restaurant or updates the existing one (sending its concurrency token as `If-Match`), invalidating the favourites list on success.
- Port the `Toast` design-system component (feedback) plus a lightweight toast host/provider and `useToast()` hook, wired into the app root, since Toast is transient and needs a fixed-position stack. `Input` is already ported (from the environments change) and is reused for the note.
- Add `src/components/favourite/RatingStars.tsx`: 5 stars with a read-only display mode and an editable click-to-set mode. It renders its own star glyph (the design-system Icon set has no star), matching the web control; in editable mode activating the nth star selects rating n.
- Add `src/components/favourite/FavouriteEditorDialog.tsx` built on the ported `Dialog`, editable `RatingStars`, `Input` (note), and `Button`. It validates the rating as an integer in 1-5 client-side before calling the API, and confirms success or surfaces an error via a toast.
- `RestaurantCard` gains a favourite surface: a read-only `RatingStars` when a favourite exists for the restaurant, and a "Rate" / "Edit rating" action that opens the editor. This is independent of the environment membership action added previously.

Out of scope: sorting or filtering restaurants by rating, the random-restaurant wheel, and settings.

## Capabilities

### New Capabilities

- `favourites`: per-user restaurant ratings and notes — the favourites API layer and React Query hooks (list + create-or-update upsert with `If-Match`), the `RatingStars` control, the favourite editor dialog, the RestaurantCard rating display and action, and the ported `Toast` primitive with its app-level host used to confirm saves and surface errors.

### Modified Capabilities

- None. The RestaurantCard rating display and action are specified as new requirements within the `favourites` capability (mirroring how the environment membership action was introduced in `dining-environments`), so no existing capability's requirements change.

## Impact

- New files: `src/types/favourite.ts`, `src/api/favourites.ts`, favourites React Query hooks under `src/hooks/`, `src/components/favourite/RatingStars.tsx`, `src/components/favourite/FavouriteEditorDialog.tsx`, the ported `Toast` under `src/components/design-system/feedback/` plus a toast host/provider and `useToast()` hook.
- Modified files: `src/components/restaurant/RestaurantCard.tsx` (favourite display + action) and `app/_layout.tsx` (mount the toast host).
- Backend: none. Consumes the existing `/api/v1/favourites` endpoints. No new dependencies (stars draw via the already-present `react-native-svg`).
- Favourites are fetched and cached client-side; the rating display derives from the cached list, and the editor upserts through React Query with no change to how restaurants or offers are fetched.
