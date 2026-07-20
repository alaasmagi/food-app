## Why

With auth and the app shell in place, the Dashboard is still a placeholder. The core value of FoodRoulette is seeing today's lunch offers across the shared restaurant catalog, so this change replaces the placeholder with the real Dashboard and stands up the server-data layer (React Query + typed API modules) that every later feature builds on.

## What Changes

- Set up TanStack React Query (add the dependency and wrap the app in a `QueryClientProvider`) as the server-state layer — the first change to fetch backend data.
- Add `src/types/restaurant.ts` with hand-written TypeScript interfaces matching the backend Restaurant and offer Web DTOs (the API returns bare payloads on success and RFC 7807 ProblemDetails on error — no `IMethodResponse<T>` wrapper on the wire).
- Add `src/api/restaurants.ts` (typed request functions through the shared `apiFetch` helper) plus React Query hooks `useRestaurants()` and `useRestaurantOffers(id)`, with offers fetched lazily per restaurant to mirror the backend's lazy-fetch design.
- Port the Card, Badge, and Tag design-system components into `src/components/design-system/data-display/`.
- Add feature components `src/components/restaurant/RestaurantCard.tsx` (Card + a Badge for "Fast food" / "No offers today" + a Tag for the city) and `src/components/restaurant/OfferList.tsx` (offer text/price rows with loading and empty states).
- Replace `app/(tabs)/index.tsx` with the real Dashboard: a scrollable list of RestaurantCards, each expandable to lazily fetch and show its OfferList, with pull-to-refresh.
- Show the full shared restaurant catalog (no environment filtering yet).

Out of scope: map, environments, favourites, wheel, settings.

## Capabilities

### New Capabilities
- `restaurant-data`: the typed restaurant/offer DTOs, ProblemDetails error parsing, the `restaurants` API module, and the `useRestaurants()` / `useRestaurantOffers(id)` React Query hooks (offers fetched lazily per restaurant). Reused by later map/favourites/wheel changes.
- `restaurant-dashboard`: the Dashboard screen experience — a refreshable, scrollable list of restaurant cards, each expandable to reveal that restaurant's offers, with the "Fast food" / "No offers today" badges and city tag, and loading/empty/error states.

### Modified Capabilities
- `design-system-foundation`: adds the ported Card, Badge, and Tag components (new requirements; the existing Icon and Button requirements are unchanged).
- `app-shell`: the Dashboard screen requirement changes from an empty placeholder to the real restaurant/offers Dashboard.

## Impact

- New dependency: `@tanstack/react-query`; new provider wrapping the app in `app/_layout.tsx`.
- New code: `src/types/restaurant.ts`, `src/api/restaurants.ts`, `src/hooks/` (React Query hooks), `src/components/design-system/data-display/` (Card, Badge, Tag), `src/components/restaurant/` (RestaurantCard, OfferList).
- Replaces `app/(tabs)/index.tsx` (placeholder → real Dashboard).
- Consumes existing backend endpoints only (restaurant list + per-restaurant offers); no backend change.
- Depends on the `authentication` capability's `apiFetch` helper for bearer-authenticated requests.
