## 1. Port the Toast primitive and app-level host

- [x] 1.1 Port `Toast` (feedback) into `src/components/design-system/feedback/Toast.tsx` from its `.d.ts` + `.prompt.md` + `.card.html`: `title`, optional `description`, `tone` (info/success/warning/danger with the matching Icon + color), optional close, styled from `src/theme/tokens.ts`
- [x] 1.2 Add a toast host/provider (`src/components/design-system/feedback/ToastProvider.tsx` or a `src/stores`/`src/hooks` pairing) that renders a fixed bottom, safe-area-aware stack and auto-dismisses each toast, plus a `useToast()` hook exposing `push({ title, description?, tone })`
- [x] 1.3 Mount the toast host at the app root in `app/_layout.tsx` (inside `SafeAreaProvider`, alongside the existing providers)
- [x] 1.4 Add smoke tests: Toast renders per tone; `useToast()` push renders a toast in the host and it can be dismissed
- [x] 1.5 Verify no source imports from `alaasmagi-design-system/`

## 2. Types and API layer

- [x] 2.1 Add `src/types/favourite.ts` with a `Favourite` interface matching the backend Web DTO (`id`, `concurrencyToken`, `restaurantId`, `rating`, nullable `note`)
- [x] 2.2 Add `src/api/favourites.ts` with `getFavourites()`, `createFavourite(input)`, `updateFavourite(id, input, concurrencyToken)` through `apiFetch`, sending `If-Match` on update, unwrapping errors via the shared error handling
- [x] 2.3 Add an api-layer test mocking `apiFetch` that asserts endpoints, methods, bodies, and the `If-Match` header on update

## 3. Favourites hooks

- [x] 3.1 Add `src/hooks/useFavourites.ts` (query) with a stable query key and a `favouriteFor(restaurantId)` derivation (memoized `restaurantId -> Favourite` map)
- [x] 3.2 Add `src/hooks/useUpsertFavourite.ts`: a mutation that creates when no favourite exists for the restaurant or updates the existing one (its concurrency token as `If-Match`), invalidating the favourites query on success
- [x] 3.3 Add hook tests mocking the api layer: upsert creates when absent, updates with `If-Match` when present, and invalidates the favourites query

## 4. RatingStars and the editor dialog

- [x] 4.1 Add `src/components/favourite/RatingStars.tsx`: 5 stars via a self-drawn `react-native-svg` star (filled vs outline), read-only mode (non-interactive) and editable press-to-set mode reporting rating n
- [x] 4.2 Add `src/components/favourite/FavouriteEditorDialog.tsx` on the ported `Dialog` + editable `RatingStars` + `Input` (note) + `Button`: seed fields from the existing favourite on open, validate rating as an integer 1-5 before the API call, upsert via `useUpsertFavourite()`, and toast success/error (dialog stays open on error)
- [x] 4.3 Add component tests: RatingStars read-only vs editable (nth star reports n); editor blocks save on invalid rating, upserts on valid, and pushes success/error toasts

## 5. Restaurant card favourite surface

- [x] 5.1 Add to `RestaurantCard` a read-only `RatingStars` shown when the restaurant has a favourite, plus a "Rate" / "Edit rating" action (label depends on whether a favourite exists) that opens the `FavouriteEditorDialog`, independent of the environment membership action
- [x] 5.2 Wire the card to `favouriteFor(restaurant.id)` (passed as a prop or read via the hook) so the rating display and action label reflect the cached favourite
- [x] 5.3 Add/extend RestaurantCard tests: read-only stars + "Edit rating" when favourited; "Rate" and no stars when not; action opens the editor

## 6. Verify

- [x] 6.1 Run the test suite and TypeScript strict typecheck; fix failures
- [x] 6.2 Run `openspec validate add-restaurant-favourites` and confirm it passes
