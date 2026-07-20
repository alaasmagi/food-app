## Why

Restaurants carry `latitude`/`longitude`, but the mobile app has no way to see them spatially — the Map tab is still a placeholder. A map view lets users find lunch by location, complementing the Dashboard's list.

## What Changes

- Add `react-native-maps`.
- Add `src/components/restaurant/RestaurantMap.tsx`: a dark-styled map rendering one marker per restaurant that has both `latitude` and `longitude`; restaurants missing either coordinate are silently omitted. Pressing a marker shows a callout with the restaurant name and a "See offers" action.
- The "See offers" action reuses the existing offers-fetch behavior (the `OfferList` component and `useRestaurantOffers` hook / React Query cache) — no new data path.
- Use a dark map style matching the design system's dark-mode aesthetic.
- Replace `app/(tabs)/map.tsx` (placeholder → real): the Map tab renders `RestaurantMap` over the same `useRestaurants()` data the Dashboard uses, so the React Query cache is shared and no extra fetch occurs.
- No location permission requested — showing markers needs none; a permission prompt is deferred to a future "near me" feature.

Out of scope: geolocation / "near me", directions, marker clustering, and environment filtering (the map shows the full shared catalog until environments exist, at which point a later change will filter it).

## Capabilities

### New Capabilities
- `restaurant-map`: the Map tab experience — a dark map, coordinate-filtered markers, marker callouts with the restaurant name and a "See offers" action that opens that restaurant's offers (reusing `OfferList`), sharing the Dashboard's restaurants query.

### Modified Capabilities
<!-- None. The Map tab already exists in app-shell's tab navigator; no existing requirement changes. restaurant-data and restaurant-dashboard are reused as-is. -->

## Impact

- New dependency: `react-native-maps` (+ its Expo config plugin).
- New code: `src/components/restaurant/RestaurantMap.tsx`; replaces `app/(tabs)/map.tsx`.
- Reuses existing `useRestaurants()`, `useRestaurantOffers()`, and `OfferList` — no backend change.
- External/config prerequisite: Android's Google Maps requires a Maps API key in app config; iOS uses Apple Maps (no key). Documented in design.md.
