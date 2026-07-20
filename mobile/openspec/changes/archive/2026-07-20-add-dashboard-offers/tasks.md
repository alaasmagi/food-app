## 1. React Query setup

- [x] 1.1 Add the `@tanstack/react-query` dependency
- [x] 1.2 Create a module-level `QueryClient` and wrap the routed tree in `QueryClientProvider` in `app/_layout.tsx` (inside `SafeAreaProvider`, around the auth provider/navigator)

## 2. Types and API layer

- [x] 2.1 Add `src/types/restaurant.ts` with the `Restaurant` and `Offer` interfaces (exact camelCase backend field names and nullability) plus a `ProblemDetails` type
- [x] 2.2 Add a `parseProblemDetails` helper that reads `title`/`detail`/`status` and a typed error class carrying them
- [x] 2.3 Add `src/api/restaurants.ts`: `getRestaurants()` (GET `/api/v1/restaurants`) and `getRestaurantOffers(id)` (GET `/api/v1/restaurants/{id}/offers`), both through `apiFetch`, parsing bare payloads on ok and throwing parsed ProblemDetails on error

## 3. React Query hooks

- [x] 3.1 Add `src/hooks/useRestaurants.ts` with query key `['restaurants']`
- [x] 3.2 Add `src/hooks/useRestaurantOffers.ts` with query key `['restaurants', id, 'offers']` and an `enabled` flag so it fetches lazily only when the card is expanded

## 4. Port design-system data-display components

- [x] 4.1 Port Card into `src/components/design-system/data-display/Card.tsx` (surfaceCard bg, 1px borderSubtle, radius.lg, no shadow, `padding` default 20, optional pressed/hoverable emphasis)
- [x] 4.2 Port Badge into `src/components/design-system/data-display/Badge.tsx` (tone union with per-tone bg/fg tokens, uppercase mono, optional leading icon colored to the tone foreground)
- [x] 4.3 Port Tag into `src/components/design-system/data-display/Tag.tsx` (full pill, `selected` accent tint, optional trailing pressable `x` calling `onRemove`)
- [x] 4.4 Add smoke tests for Card, Badge (each tone), and Tag (default/selected/removable)

## 5. Restaurant feature components

- [x] 5.1 Add `src/components/restaurant/OfferList.tsx`: owns `useRestaurantOffers(id)` (enabled when expanded), renders offer text/price rows, plus loading, "No offers today" empty, and error states
- [x] 5.2 Add `src/components/restaurant/RestaurantCard.tsx`: Card with name, city Tag, "Fast food" Badge when `isFastFood`, "No offers today" Badge when offers are known absent (`hasOffers` false or resolved-empty), an expand affordance, and the `OfferList` when expanded
- [x] 5.3 Add smoke tests for RestaurantCard (fast-food badge, no-offers badge, city tag) and OfferList (rows, loading, empty, error) with mocked hooks

## 6. Dashboard screen

- [x] 6.1 Replace `app/(tabs)/index.tsx` with the real Dashboard: a `FlatList` of `RestaurantCard`s from `useRestaurants()`, tracking expanded ids in a `Set<string>`
- [x] 6.2 Wire pull-to-refresh via `RefreshControl` to the restaurants query `refetch`/`isRefetching`
- [x] 6.3 Render Dashboard-level loading, empty, and error states

## 7. Verification

- [x] 7.1 `npx tsc --noEmit` passes and `npx jest` is green
- [ ] 7.2 Run the Dashboard on a device/simulator: list loads, a card expands to fetch and show offers, pull-to-refresh works, and "Fast food" / "No offers today" badges and the city tag render correctly
