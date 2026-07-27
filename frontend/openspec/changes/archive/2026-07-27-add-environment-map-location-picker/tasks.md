## 1. Types and API layer

- [x] 1.1 Add `autoFillLatitude: number | null`, `autoFillLongitude: number | null`, and
  `autoFillRadiusMeters: number | null` to the `DiningEnvironment` interface in
  `src/types/environment.ts`, with a comment noting they carry the backend's saved auto-fill origin.
- [x] 1.2 Extend `EnvironmentInput` in `src/api/environments.ts` with the same three optional
  nullable fields, and have `createEnvironment`/`updateEnvironment` send them through in the request
  body (update already spreads `input`).
- [x] 1.3 Add `DiningEnvironmentAutoFillResult` type (`{ added: number; alreadyPresent: number;
  totalMembers: number }`) and `autoFillEnvironment(id: string)` that POSTs to
  `${ENVIRONMENTS}/${id}/auto-fill` and returns the parsed summary, throwing on a non-ok response
  like the other functions.

## 2. Environments store

- [x] 2.1 Update `createEnvironment`/`renameEnvironment` in `src/stores/environments.ts` so the
  auto-fill fields are round-tripped (rename must not drop a stored origin — pass the existing values
  through when the caller does not change them).
- [x] 2.2 Add an `autoFill(id: string)` action that calls `autoFillEnvironment`, then reloads
  membership (reset the `membershipLoaded` guard and re-run `loadMembership`, or re-fetch and rebuild
  the index) so new members are reflected, and returns the summary to the caller.
- [x] 2.3 Export the new action from the store's return object.

## 3. Location picker component

- [x] 3.1 Create `src/components/environment/EnvironmentLocationPicker.vue` with a compact Leaflet
  map, reusing the restaurant map's conventions: per-theme CARTO `TILE_URL`, `L.tileLayer` with the
  CARTO attribution/subdomains, `watch(theme, ...)` → `setUrl`, `isolation: isolate` container, and
  the dark-tile brightness lift. Call `invalidateSize({ pan: false })` after mount/`nextTick`, and
  tear down the map on unmount.
- [x] 3.2 Model the origin via `v-model` (or `modelValue` + `update:modelValue`) of
  `{ latitude: number | null; longitude: number | null; radiusMeters: number | null }`; place a
  draggable `L.marker` when coordinates exist, update the model on map click and marker `dragend`,
  and provide a "clear location" affordance that removes the marker and nulls all three fields.
- [x] 3.3 Add the radius `Input` (meters), shown only once a location is set, and an `L.circle`
  overlay centred on the marker whose radius reflects the entered value (previewing 500 when empty);
  show the "defaults to 500 m" hint when the radius input is empty.
- [x] 3.4 Add the address search box: a plain `fetch` to Nominatim (`format=json&q=...`) on explicit
  submit, recentring the map on the first result; on empty result or failure show a non-blocking
  message and leave the marker/view unchanged. Do not route this through the bearer-token `apiFetch`.

## 4. Editor dialog integration

- [x] 4.1 Wire `EnvironmentLocationPicker` into `EnvironmentEditorDialog.vue` as an optional location
  section per environment (and in the create form), seeded from the environment's stored origin, with
  copy stating location and radius are optional and auto-fill is unavailable without a location.
- [x] 4.2 On save (create/rename), include the picker's origin and enforce the client-side validation
  mirror before sending: both-or-neither coordinates, radius only with a location, radius a positive
  integer within the backend range (1..50000); surface an inline message and block on violation.
- [x] 4.3 Show a "Fill with nearby restaurants" `Button` for any saved environment that has stored
  coordinates (immediately after saving a located environment and on existing ones on open). On
  click, call the store's `autoFill`, then push a success `Toast` reporting the number added (and a
  distinct "no new restaurants added" message when `added` is 0). Guard against double submits while
  a fill is in flight.

## 5. Tests

- [x] 5.1 Store test: `createEnvironment`/`renameEnvironment` round-trip the auto-fill fields, and
  `autoFill` calls the API and reloads membership from the refreshed rows.
- [x] 5.2 API test: `autoFillEnvironment` posts to the correct path and returns the parsed summary;
  a non-ok response throws.
- [x] 5.3 Picker test: emits the origin on map click and on clear; the radius input and circle are
  hidden until a location is set; the empty-radius hint appears when a location is set with no radius.
- [x] 5.4 Dialog test: the fill button is shown only when coordinates are present, and clicking it
  triggers `autoFill` and a toast with the reported count.

## 6. Verify

- [x] 6.1 Run the type check, unit tests, and lint; confirm existing environment flows (list/rename/
  delete/create with no location) still pass unchanged. (type-check clean; new tests pass; existing
  environment/tabs/settings tests unchanged and green. No lint script is configured in package.json.
  The only failing tests are 3 pre-existing `RestaurantMap.test.ts` cases, unrelated to this change.)
