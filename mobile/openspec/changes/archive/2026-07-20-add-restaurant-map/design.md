## Context

The Dashboard (`add-dashboard-offers`) established the restaurant data layer: `useRestaurants()` returns the full shared catalog, each `Restaurant` carrying `latitude`/`longitude` (both non-null numbers on the DTO) plus `id`/`name`, and `OfferList` + `useRestaurantOffers(id)` already fetch a restaurant's offers lazily through React Query. The Map tab is still a `PlaceholderScreen`. This change renders the same restaurants spatially and reuses the offers path for a "See offers" action — no new data fetching.

Constraints: dark-mode-first (the map must not be a bright rectangle in a dark app); markers only for restaurants with coordinates; no location permission (markers need none).

## Goals / Non-Goals

**Goals:**

- A `RestaurantMap` component: dark-styled map, one marker per coordinate-bearing restaurant, marker callout with name + "See offers".
- The Map tab renders `RestaurantMap` over the shared `useRestaurants()` cache (no extra fetch).
- "See offers" reuses `OfferList` / `useRestaurantOffers` to show the restaurant's offers.

**Non-Goals:**

- Geolocation / "near me" and the location permission it would require.
- Directions, marker clustering, custom marker artwork.
- Environment filtering (deferred until environments exist; the map shows the full catalog).
- A separate restaurant-detail route — "See offers" surfaces inline, not via navigation.

## Decisions

### react-native-maps, default provider per platform

Use `react-native-maps` with its Expo config plugin. Let each platform use its default provider: **Apple Maps on iOS** (no API key, native dark support) and **Google Maps on Android** (requires an API key). This avoids forcing a Google key on iOS. **Alternative considered:** `PROVIDER_GOOGLE` on both for one consistent dark JSON style. Rejected — it requires a Google Maps API key for iOS too and pulls in Google Maps everywhere; Apple Maps' native dark mode is simpler on iOS.

### Dark styling per provider

Apple Maps (iOS) honors the map's `userInterfaceStyle="dark"` prop. Google Maps (Android) takes a `customMapStyle` JSON array — apply a dark style array whose colors approximate the design system's dark surfaces. The map container background is set to `surfaceApp` so any tile-load gap reads as dark, not white. The dark style array lives in a small `src/components/restaurant/mapStyle.ts` constant. **Alternative considered:** a full bespoke palette matched exactly to tokens. Rejected as over-scoped — a standard dark style array plus a dark container is enough for parity.

### Coordinate filtering in the component

`RestaurantMap` filters `restaurants` to those with both `latitude` and `longitude` present and finite before mapping to markers; others are silently omitted (matching the web map). Since the DTO types both as non-null numbers, the guard is defensive against `0`/`NaN`/nullish values from bad data. Marker `key`/`identifier` is the restaurant `id`. **Alternative considered:** filtering upstream in a hook. Rejected — it's a presentation concern local to the map.

### Initial region

Derive the initial region from the markers: center on their average coordinate with a delta covering their spread (a simple bounding-box fit), falling back to a sensible default region when there are no markers. Keeps the first render useful without geolocation. **Alternative considered:** hard-coded city region. Rejected — brittle if the catalog spans multiple cities.

### "See offers" reuses OfferList in a dismissible sheet

Pressing "See offers" in a marker callout sets a selected restaurant id in the Map screen's local state and renders a dismissible bottom sheet (a `Modal`/overlay panel) containing the restaurant name and `<OfferList restaurantId={id} />`. Because `OfferList` owns `useRestaurantOffers`, this reuses the exact Dashboard offers path and the shared React Query cache — a restaurant expanded on the Dashboard shows its offers here instantly. **Alternatives considered:** (a) a new restaurant-detail route — heavier, and no such route exists yet; (b) rendering offers inside the native callout — callouts can't host arbitrary interactive RN trees reliably across platforms. The sheet is the simplest reliable reuse.

### Shared query, no refetch

The Map tab calls the same `useRestaurants()` as the Dashboard; React Query returns the cached list, so switching tabs doesn't refetch. Loading/error/empty states mirror the Dashboard's (spinner / message / "no restaurants"). **Alternative considered:** a map-specific bounds query (`GET /restaurants?minLat...`). Rejected for now — the full catalog is already cached; a bounds query is a later optimization.

## Map provider prerequisite (external/config)

Not a code change to backend, but required for Android before the map renders tiles:

- Provide a **Google Maps API key** for Android via the `react-native-maps` / Expo config (`app.json` `android.config.googleMaps.apiKey` or the plugin's field). iOS on Apple Maps needs no key.
- No location permission strings are added — markers don't require location access. When a future "near me" change lands, it will add `NSLocationWhenInUseUsageDescription` / Android location permission then.

## Risks / Trade-offs

- **Android needs a Google Maps API key** → Without it, the Android map is blank. Mitigation: document the config prerequisite; iOS (Apple Maps) works with no key so development isn't blocked. Keep the key in app config, not code.
- **Callout interactivity varies by platform** → Native map callouts don't reliably host complex RN pressables. Mitigation: keep the callout minimal (name + a single "See offers" trigger) and render the actual offers in the RN `Modal` sheet, outside the native callout.
- **Dark styling differs by provider** → Apple vs Google use different mechanisms, so the two platforms won't look pixel-identical. Mitigation: `userInterfaceStyle="dark"` (iOS) + `customMapStyle` (Android) + dark container background gets both "dark enough" for the aesthetic; exact parity is a non-goal.
- **Bad/zero coordinates** → A restaurant with `0,0` or NaN would drop a marker in the ocean. Mitigation: filter to finite, non-zero-pair coordinates and omit the rest silently.
- **Testability of native map** → `react-native-maps` renders native views that don't run in Jest cleanly. Mitigation: mock `react-native-maps` in tests and assert marker-count/coordinate-filtering logic and the "See offers" wiring, not native rendering.

## Migration Plan

Additive; replaces one placeholder screen. Sequence: add `react-native-maps` + config plugin (+ Android key placeholder) → add `mapStyle.ts` → build `RestaurantMap` (filter, markers, callouts, dark style, initial region) → wire "See offers" sheet reusing `OfferList` → replace `app/(tabs)/map.tsx` → tests (mocked map). Rollback: revert the change; the Map placeholder returns.

## Open Questions

- Should tapping a marker also pan/zoom to it, or only open the callout? Assumed callout-only for now.
- When environments land, does the map filter to the selected environment or always show all? Assumed it will filter (a later change), matching the Dashboard's eventual behavior.
- Preferred fallback region when the catalog is empty or coordinate-less? Assumed a broad default; can be tuned once a primary city is known.
