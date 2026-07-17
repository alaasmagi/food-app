## Context

The `restaurants` store already loads the full catalog once and caches it; each `Restaurant` carries `latitude` / `longitude` (lowercase, `number`) mirroring the backend `RestaurantDto`. The dashboard renders the catalog as a list of `RestaurantCard`s. The list deliberately shows the full catalog under every environment tab, because it doubles as the membership-management UI: "Add to environment" lives on non-member cards, so filtering the list would make adding restaurants unreachable (this is asserted by existing `DashboardView` tests). This change adds a spatial view of the same catalog behind a toggle; the map honours the selected environment by narrowing to its members, while the list's full-catalog behaviour is left intact.

The design system is a local, in-repo set of ported Vue primitives (no external package). A `Tabs` primitive is already ported at `src/components/design-system/navigation/Tabs.vue` and is used by `EnvironmentTabs`. Package manager is npm. Tests are Vitest + Vue Test Utils in a jsdom environment.

## Goals / Non-Goals

**Goals:**
- Render the currently-visible restaurant set on a Leaflet map, one marker per restaurant that has both coordinates set.
- Reuse the already-loaded store data; the map issues no fetch of its own.
- Marker popup shows the restaurant name and a "See offers" action whose behaviour matches `RestaurantCard`'s (lazy per-restaurant offers fetch via the shared store, revealing the same `OfferList`).
- A List/Map toggle on the dashboard; the list keeps showing the full catalog (membership management), while the map narrows to the selected environment's members. Under "All" both show the same set.
- Dark-themed map tiles and chrome that fit the dark-mode-first aesthetic.

**Non-Goals:**
- Geolocation / "restaurants near me", routing/directions, marker clustering (out of scope at current scale).
- A separate `/map` route (the map lives inside the dashboard behind a toggle).
- A light-mode map theme.
- Any backend or DTO change.

## Decisions

### Leaflet with CARTO dark raster tiles
Use `leaflet` (raster tiles, no API key, lightweight, matches the proposal) over MapLibre GL (vector, heavier, needs a style JSON) or a keyed provider. Tiles come from CARTO `dark_all` (`https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png`), which is free, keyless, and dark by default — so it does not clash with the app. Stadia dark was rejected because it requires an account/API key. Attribution for OpenStreetMap and CARTO is preserved as Leaflet requires.

### An environment-filter composable feeds the map
Add `src/composables/useEnvironmentFilteredRestaurants.ts` returning a `computed<Restaurant[]>` derived from the `restaurants` store list and the `environments` store selection: under "All" (`selectedEnvironmentId === null`) it returns the full list; under a specific environment it returns members only, reusing the environments store's existing membership data (`membershipByEnv`) with no extra fetch. `DashboardView` passes this filtered array to `RestaurantMap`, while the list continues to render the store's full `list`. The map is a pure viewer with no add/remove workflow, so narrowing it to members is unambiguous; the list cannot be narrowed without breaking "Add to environment" (see Context). Keeping the filter in a composable rather than inline makes it unit-testable without mounting the view. Alternatives considered: (a) filter both views from one set — rejected, it makes "Add to environment" unreachable; (b) filter neither — rejected, the environment tab would then have no effect on the map.

### Coordinate gating is a plain computed, testable without Leaflet
`RestaurantMap` derives its markers from a `computed` that keeps only restaurants where both `latitude` and `longitude` are present and finite. Restaurants missing coordinates are silently excluded (no error, no placeholder). Keeping this as a pure computed lets tests assert the gating without driving Leaflet's DOM, which jsdom cannot lay out. Alternative: gate inside the imperative marker loop — rejected as untestable in jsdom.

### Popup reuses the store's lazy offers, rendered via a Vue Teleport
Leaflet popups are plain DOM outside Vue's tree. To keep the "See offers" behaviour identical to `RestaurantCard` (call `store.loadOffers(id)` once, then reveal `OfferList`), the marker binds a popup whose content element is a Teleport target: a small Vue-controlled popup body renders the name plus a "See offers" `Button` that calls the same `restaurants` store methods and mounts the same `OfferList` component. Because it goes through the shared store, offers already fetched from a card are served from cache and vice versa. Alternatives: (a) build popup HTML imperatively and hand-wire the button — rejected, it duplicates offer-rendering logic the store/`OfferList` already own; (b) drop the popup and drive a side detail panel from a reactive `selectedRestaurantId` — viable, but the proposal specifically asks for an in-marker popup.

### List/Map toggle uses the ported `Tabs` primitive
Reuse `src/components/design-system/navigation/Tabs.vue` (two tabs, `list` / `map`) for visual consistency with `EnvironmentTabs`, bound to a local `view` ref in `DashboardView`. The map is rendered with `v-if="view === 'map'"` (not `v-show`) so Leaflet initialises into a laid-out, sized container; on mount the component calls `map.invalidateSize()` after `nextTick` and `fitBounds` to frame the visible markers. Labels are sentence case ("List", "Map") per content rules.

### Markers avoid Leaflet's broken default icon under bundlers
Leaflet's default marker image URLs break under Vite. Use a token-styled `L.divIcon` (a small CSS marker referencing design tokens) instead of the default PNG icon, avoiding asset-path hacks and letting the marker match the dark theme.

## Risks / Trade-offs

- [Leaflet CSS is global, not scoped] → import `leaflet/dist/leaflet.css` once (in `main.ts` alongside the token styles, or at the top of `RestaurantMap.vue`); override tile/popup/control/attribution colours with scoped rules referencing design tokens so map chrome matches the app.
- [jsdom cannot lay out or render a Leaflet map] → keep coordinate gating and environment filtering in pure computeds/composables that are unit-tested directly; for the component test, mock the `leaflet` module (or assert only that the component mounts and gates markers), rather than asserting rendered map pixels.
- [Hidden container renders a zero-size map] → mount the map with `v-if` on show and call `invalidateSize()` after `nextTick`; destroy the map in `onUnmounted` via `map.remove()` to avoid leaks when toggling back to list.
- [The existing `restaurant-offers` spec text claims the list filters by environment, which the code never did and this change keeps not doing] → the `restaurant-offers` delta corrects that requirement to describe the list's actual full-catalog behaviour plus the new map view, so the archived spec matches reality; the existing dashboard tests (full catalog stays visible) remain valid and are extended for the toggle.
- [Restaurants with 0/0 or null coordinates] → treated as "no location" and excluded from the map; they remain fully visible in the list so no restaurant becomes unreachable.

## Open Questions

- None blocking. If the catalog later grows large enough that individual markers overlap, clustering can be added as a follow-up change (explicitly out of scope here).
