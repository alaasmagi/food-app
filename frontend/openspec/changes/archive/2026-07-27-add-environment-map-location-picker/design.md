## Context

The backend change `add-dining-environment-auto-fill` (in the backend repo) added three nullable
auto-fill fields to `DiningEnvironment` (`AutoFillLatitude`, `AutoFillLongitude`,
`AutoFillRadiusMeters`), write-path validation for them, and an owner-scoped endpoint
`POST /api/v1/dining-environments/{id}/auto-fill` returning `{ Added, AlreadyPresent, TotalMembers }`.
The endpoint reads the stored origin, computes haversine distance to every restaurant with both
coordinates, and additively adds in-range restaurants as `EnvironmentRestaurant` memberships (never
removing, never duplicating). The 500 m default is applied at run time, not persisted.

On the frontend, environments are managed in `EnvironmentEditorDialog.vue` (list, rename, delete,
create), backed by the `environments` Pinia store and the `api/environments.ts` module. The store
holds the `DiningEnvironment` list and a per-environment membership index. `RestaurantMap.vue`
already integrates Leaflet with the app: CARTO dark/light basemaps keyed to `useTheme`, token-styled
controls/popups/attribution, a dark-tile brightness lift, and an isolated stacking context so the
map does not paint over modals. `leaflet` and `@types/leaflet` are installed. A `Toast` component and
`toasts` store exist for transient success/error messages.

Constraints:
- Vue 3 `<script setup lang="ts">`, Pinia, strict TS. Components stay thin; logic lives in the store
  or a composable. All backend calls go through `api/`.
- The frontend mirrors, never re-implements, backend business rules. Client validation is a
  UX guard, not the source of truth.
- Design-system copy rules apply (sentence case, no em-dashes, digits for numerals, no emoji).
- The `alaasmagi-design-system/` folder must never be imported from `src/`.

## Goals / Non-Goals

**Goals:**
- Add the three nullable auto-fill fields to the `DiningEnvironment` type and carry them through the
  environment write path and store.
- Add `autoFillEnvironment(id)` to the API layer and an `autoFill(id)` store action that reloads the
  affected environment's membership.
- Give the editor an optional per-environment location section: a Leaflet map reusing the restaurant
  map's tile/theme setup, a Nominatim search box, a draggable/clickable marker, a radius input, and a
  radius circle overlay.
- Mirror the backend's both-or-neither / radius-requires-location / radius-range validation client
  side to block an obviously invalid save.
- Show a "Fill with nearby restaurants" button for any environment with stored coordinates (at
  creation and later), reporting the result via a toast.

**Non-Goals:**
- Showing distance-from-center per restaurant, or any live/scheduled re-fill.
- Reverse geocoding coordinates back to an address, or displaying an address label.
- Removing out-of-radius members (the backend import is additive; the UI mirrors that).
- A light-mode toggle or any new design-system component beyond what the map section needs.

## Decisions

### camelCase field names on the frontend DTO
The backend properties are `AutoFillLatitude`/`AutoFillLongitude`/`AutoFillRadiusMeters`, but the app
serializes DTOs to camelCase (the existing type already uses `concurrencyToken`, `environmentId`).
The frontend fields are therefore `autoFillLatitude`, `autoFillLongitude`, `autoFillRadiusMeters`.
*Alternative considered:* PascalCase to match C# literally — rejected because it breaks the app's DTO
convention and would not match the actual JSON on the wire.

### Extract a small `EnvironmentLocationPicker.vue` rather than inline the map in the dialog
The map, search, marker, radius, and circle logic is substantial and self-contained. Putting it in a
focused component (`components/environment/EnvironmentLocationPicker.vue`) that emits/`v-model`s the
`{ latitude, longitude, radiusMeters }` origin keeps `EnvironmentEditorDialog.vue` readable and keeps
Leaflet lifecycle (mount/unmount, `invalidateSize` when the dialog opens) in one place.
*Alternative considered:* inline everything in the dialog — rejected; the dialog already manages
list/rename/delete/create state and would become unwieldy, and the picker is independently testable.

### Reuse the restaurant map's tile/theme setup by copying its Leaflet conventions, not by importing
`RestaurantMap.vue` is purpose-built for restaurant markers/viewport fetching and is not a reusable
map shell. The picker copies the same conventions — `TILE_URL` per theme, `L.tileLayer` with the
CARTO attribution/subdomains, `watch(theme, ...)` to `setUrl`, `invalidateSize({ pan: false })` after
the container is laid out, and the `isolation: isolate` + dark-tile brightness lift CSS — sized
smaller (a compact canvas, not 480px). The shared, unscoped Leaflet chrome CSS is already global via
`RestaurantMap.vue`; the picker adds only what is specific to it (marker, circle).
*Alternative considered:* generalize `RestaurantMap.vue` into a base map both use — rejected as a
larger refactor than this change warrants; the viewport-fetch machinery does not belong in a picker.

### Marker and circle as Leaflet layers driven by component state
A single `L.marker(..., { draggable: true })` holds the point; `map.on('click', ...)` and the
marker's `dragend` write back to the model. An `L.circle` centred on the marker reflects the radius
(effective radius = entered value or 500 for the overlay preview). Setting/clearing the location adds
or removes both layers. This keeps Leaflet as the view and the component state as the source of truth.

### Client-side geocoding via Nominatim `fetch`, kept out of the shared API wrapper
Address search calls `https://nominatim.openstreetmap.org/search?format=json&q=...` directly with
`fetch` — it is a third-party service, not our backend, so it must not go through the bearer-token
`apiFetch` wrapper (which would attach our JWT to an external host). It lives in the picker (or a tiny
`geocode.ts` helper) and is best-effort: a failure or empty result shows a message and changes
nothing. A short debounce and a descriptive `User-Agent`-free plain GET keep it simple; results are
not cached.
*Alternative considered:* route geocoding through the backend — rejected; the backend does no
geocoding by design (the client owns the map) and adding a proxy is out of scope.

### Client validation mirrors, and defers to, the backend
The editor enforces both-or-neither coordinates, radius-only-with-location, and radius is a positive
integer within the backend's accepted range (1..50000 m), surfacing an inline message. This is a UX
guard to avoid a guaranteed 400; the backend remains authoritative and its error is still surfaced
via the shared wrapper's toast if a request slips through. A null/empty radius is sent as null (the
backend applies the 500 m default at run time).

### `autoFill` store action reloads only the affected environment's membership
The store's membership index is loaded once and cached. After auto-fill, the action re-fetches
memberships (via the existing `getEnvironmentRestaurants` list) and rebuilds the index so the newly
added members are reflected wherever membership is shown, then returns the summary so the caller can
toast the count.
*Alternative considered:* trust the returned `totalMembers` and skip the reload — rejected because
the app needs the actual join rows (id + token) to render/toggle membership, which the summary does
not include.

## Risks / Trade-offs

- [Nominatim usage policy / rate limits for client-side search] → Best-effort only, debounced, no
  autocomplete-on-every-keystroke; search runs on explicit submit. The feature degrades gracefully
  (map still usable by clicking) if Nominatim throttles or fails.
- [External `fetch` to Nominatim over the app's CSP/network] → It is a plain public GET with no
  credentials; if a deployment CSP blocks it, only search is affected, not the core click-to-place
  flow. Documented as a known dependency of the search sub-feature.
- [Leaflet in a dialog that mounts hidden] → Same issue the restaurant map already solves: call
  `invalidateSize({ pan: false })` after the dialog is visible and the container is laid out
  (`nextTick`), and tear the map down on unmount to avoid leaks across open/close cycles.
- [Radius circle preview vs stored null] → The overlay previews the effective radius (500 when empty)
  so the user sees what auto-fill will use, but the saved value stays null — matching the backend's
  "null means unset, default applied at run time" rule. The empty-radius hint makes this explicit.
- [Coordinate axis/range mistakes] → Client range checks (-90..90 / -180..180 are implied by picking
  on the map) plus the backend's own validation catch impossible values; a valid-but-swapped point is
  the user's responsibility, same as on the backend.

## Migration Plan

1. Add the three nullable fields to `src/types/environment.ts` and extend `EnvironmentInput` (and the
   store's create/rename paths) to carry them.
2. Add `autoFillEnvironment(id)` + result type to `src/api/environments.ts` and an `autoFill(id)`
   action to the environments store that reloads membership and returns the summary.
3. Add `EnvironmentLocationPicker.vue` (map + search + marker + radius + circle) and wire it into
   `EnvironmentEditorDialog.vue` with the fill button and validation.
4. Tests: store round-trips the auto-fill fields and `autoFill` reloads membership; api function hits
   the right path; picker emits the origin on click/drag/clear and shows the radius only with a
   location. No new design-system component is introduced, so no new smoke tests are required beyond
   the picker's own.
5. Fully backward compatible and client-only: environments with no origin behave exactly as before;
   nothing to roll back on the backend. Reverting the frontend commit restores prior behavior.

## Open Questions

- None blocking. If Nominatim's usage policy becomes a problem in production, swap the search
  provider or add a lightweight backend geocoding proxy later without changing the picker's contract
  (it already treats geocoding as an isolated, best-effort helper).
