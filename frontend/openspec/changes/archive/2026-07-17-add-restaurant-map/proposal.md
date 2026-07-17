## Why

Every restaurant already carries `latitude` / `longitude` from the backend, but the frontend never renders it, so users cannot see where restaurants are. A map view lets users browse the same catalog spatially, filtered to whichever environment they have selected, using data the restaurants store has already loaded.

## What Changes

- Add the Leaflet map library (`leaflet` plus its stylesheet, and `@types/leaflet`) as a project dependency.
- Add `src/components/restaurant/RestaurantMap.vue`: a Leaflet map rendering one marker per restaurant that has both `latitude` and `longitude` set. Restaurants missing either coordinate are silently omitted from the map (no error). A marker's popup shows the restaurant name and a "See offers" action with the same lazy-offers behaviour the `RestaurantCard` uses.
- Style the map for the app's dark-mode-first aesthetic: use a dark raster tile provider (CARTO `dark_all`) instead of default light OpenStreetMap tiles, and align map chrome (popups, controls, attribution) with the design tokens.
- Add a "List" / "Map" view toggle to `src/views/DashboardView.vue`. Both views draw from the same already-loaded catalog; the map issues no fetch of its own and reuses the `restaurants` store.
- Apply the selected `EnvironmentTabs` value to the **map** view: under "All" every located restaurant is shown; under a specific environment the map shows only that environment's members (client-side, against the already-loaded catalog, no extra fetch). The **list** view intentionally continues to show the full catalog under every tab, because it doubles as the membership-management UI ("Add to environment" lives on non-member cards, so filtering the list would make adding restaurants unreachable). Under "All" the two views therefore show the same set; under a specific environment the map narrows to members while the list stays full.

## Capabilities

### New Capabilities
- `restaurant-map`: a Leaflet-based map view of the restaurant catalog, with coordinate-gated markers, a name + "See offers" popup, dark-themed tiles, and a dashboard List/Map toggle that reuses the store's loaded data.

### Modified Capabilities
- `restaurant-offers`: the "Dashboard lists the restaurant catalog" requirement gains a List/Map view toggle; the list view continues to show the full catalog (it doubles as the membership-management UI), while the new map view honours the selected environment by showing only that environment's members.

## Impact

- Dependencies: adds `leaflet` (runtime) and `@types/leaflet` (dev); adds one CSS import.
- Code: new `src/components/restaurant/RestaurantMap.vue`; new environment-filter composable (e.g. `src/composables/useEnvironmentFilteredRestaurants.ts`) feeding the map set; changes to `src/views/DashboardView.vue` (view toggle; list keeps the full catalog, map receives the environment-filtered set). Reuses the already-ported design-system `Tabs` for the toggle.
- Data model: no backend or DTO changes; consumes the existing `Restaurant.latitude` / `Restaurant.longitude` fields.
- Tests: new `RestaurantMap` component tests; updated `DashboardView` tests for the toggle and shared filtering.
