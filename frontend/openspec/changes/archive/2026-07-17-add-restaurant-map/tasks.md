## 1. Dependency and styles

- [x] 1.1 Add `leaflet` (runtime) and `@types/leaflet` (dev) via npm and verify `package-lock.json` updates
- [x] 1.2 Import `leaflet/dist/leaflet.css` once (in `main.ts` alongside the token styles)

## 2. Environment filter for the map

- [x] 2.1 Add `src/composables/useEnvironmentFilteredRestaurants.ts` returning a `computed<Restaurant[]>`: full list under "All" (`selectedEnvironmentId === null`), members-only under a specific environment (reusing the environments store's `membershipByEnv`, no extra fetch)
- [x] 2.2 Add a unit test for the composable covering the "All" case and the specific-environment members-only case

## 3. Restaurant map component

- [x] 3.1 Create `src/components/restaurant/RestaurantMap.vue` accepting the restaurant set as a prop and issuing no fetch of its own
- [x] 3.2 Derive a `computed` of markerable restaurants (both `latitude` and `longitude` finite); silently exclude the rest
- [x] 3.3 Initialise a Leaflet map on mount with CARTO `dark_all` tiles and OpenStreetMap/CARTO attribution; call `invalidateSize()` after `nextTick` and `fitBounds` to the markers; remove the map on unmount
- [x] 3.4 Render one token-styled `L.divIcon` marker per markerable restaurant (avoid Leaflet's default PNG icon)
- [x] 3.5 Bind a click popup showing the restaurant name and a "See offers" action; render the popup body via a Vue Teleport so it reuses the `restaurants` store's `loadOffers`/`offersFor` and the existing `OfferList`
- [x] 3.6 Style map chrome (tiles, popup, controls, attribution) with design tokens to match the dark theme
- [x] 3.7 Add a component test: mounts, gates markers by coordinates, and does not fetch restaurants (mock the `leaflet` module as needed for jsdom)

## 4. Dashboard List/Map toggle

- [x] 4.1 In `src/views/DashboardView.vue`, keep the list bound to the full catalog (`visibleRestaurants`) and add a separate `mapRestaurants` from the environment-filter composable for the map
- [x] 4.2 Add a `view` ref and a List/Map toggle using the ported `Tabs` primitive (sentence-case labels "List" and "Map")
- [x] 4.3 Render the List view (existing `RestaurantCard` loop over the full catalog) under `view === 'list'` and `RestaurantMap` (passed the environment-filtered set) under `view === 'map'` with `v-if`
- [x] 4.4 Verify the list stays full under every tab and the map narrows to members under a specific environment, with no extra restaurant fetch

## 5. Tests and verification

- [x] 5.1 Update `src/views/DashboardView.test.ts` for the toggle (existing full-catalog list assertions stay valid; add coverage that the map view honours the environment filter)
- [x] 5.2 Run `npm run test` and `npm run type-check`; fix any failures
- [ ] 5.3 Manually verify in `npm run dev`: markers appear only for located restaurants, popup "See offers" reveals offers, the list stays full under every tab, and the map narrows to members under a specific environment (requires the running backend + login; left for a manual pass)
