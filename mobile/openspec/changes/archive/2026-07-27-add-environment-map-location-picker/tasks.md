## 1. Types and API layer

- [x] 1.1 Add `autoFillLatitude: number | null`, `autoFillLongitude: number | null`, and
  `autoFillRadiusMeters: number | null` to the `DiningEnvironment` interface in
  `src/types/environment.ts`, with a comment noting they carry the backend's saved auto-fill origin
  (camelCase, like `concurrencyToken`).
- [x] 1.2 Extend `EnvironmentInput` in `src/api/environments.ts` with the same three optional
  nullable fields, and confirm `createEnvironment`/`updateEnvironment` send them through (update
  already spreads `input`).
- [x] 1.3 Add a `DiningEnvironmentAutoFillResult` type (`{ added: number; alreadyPresent: number;
  totalMembers: number }`) and `autoFillEnvironment(id: string)` that POSTs to
  `${ENVIRONMENTS}/${id}/auto-fill` via `apiFetch`, unwraps the summary, and throws parsed
  ProblemDetails on a non-ok response like the other functions.

## 2. Mutation hook

- [x] 2.1 Add `useAutoFillEnvironment` to `src/hooks/useEnvironmentMutations.ts` wrapping
  `autoFillEnvironment`, invalidating `environmentRestaurantsQueryKey` on success so membership
  re-renders; return the summary to the caller.
- [x] 2.2 Confirm `useCreateEnvironment`/`useUpdateEnvironment` pass the extended `EnvironmentInput`
  through unchanged (no signature change needed since they forward the input object).

## 3. Location picker component

- [x] 3.1 Create `src/components/environment/EnvironmentLocationPicker.tsx` with a controlled value
  `{ latitude: number | null; longitude: number | null; radiusMeters: number | null }` and an
  `onChange` callback. Render a dark-styled `MapView` (reuse `userInterfaceStyle="dark"` +
  `customMapStyle` from `RestaurantMap`/`mapStyle.ts`) with an explicit height inside a container.
- [x] 3.2 Place a draggable `Marker` when coordinates exist; update the value on map `onPress` and
  marker `onDragEnd`, and add a "clear location" affordance that removes the marker and nulls all
  three fields.
- [x] 3.3 Add the radius `Input` (meters), shown only once a location is set, and a `Circle` overlay
  centred on the marker whose radius reflects the entered value (previewing 500 when empty); show a
  "defaults to 500 m" hint when the radius input is empty.
- [x] 3.4 Add the optional address search box: a plain `fetch` to Nominatim
  (`format=json&q=...`) on explicit submit, recentring the map on the first result; on empty result
  or failure show a non-blocking message and leave the marker/view unchanged. Do not route this
  through `apiFetch`.

## 4. Editor dialog integration

- [x] 4.1 Wire `EnvironmentLocationPicker` into `EnvironmentEditorDialog.tsx` as an optional location
  section (create and edit), seeded from the environment's stored origin, with copy stating location
  and radius are optional and auto-fill is unavailable without a location.
- [x] 4.2 Add a pure validation helper mirroring the backend write rules (both-or-neither
  coordinates, radius only with a location, radius a positive integer within 1..50000); on save,
  block with an inline message on violation and otherwise include the picker's origin in the input.
- [x] 4.3 Show a "Fill with nearby restaurants" `Button` for any saved environment that has stored
  coordinates (immediately after saving a located environment and on existing ones on open). On
  press, call `useAutoFillEnvironment`, and on success raise a `useToast()` success toast reporting
  the number added (distinct "no new restaurants added" message when `added` is 0). Guard against
  double submits while a fill is in flight.

## 5. Tests

- [x] 5.1 API test (`src/api/__tests__/environments.test.ts`): `autoFillEnvironment` posts to the
  correct path and returns the parsed summary; a non-ok response throws.
- [x] 5.2 Hook test: `useAutoFillEnvironment` calls the API and invalidates the membership query.
- [x] 5.3 Picker test (mock `react-native-maps` as `RestaurantMap.test.tsx` does): emits the origin
  on map press and on clear; the radius input and circle are hidden until a location is set; the
  empty-radius hint appears when a location is set with no radius.
- [x] 5.4 Dialog test: the fill button is shown only when coordinates are present, clicking it
  triggers auto-fill and a toast with the reported count, and the validation mirror blocks an
  invalid save.

## 6. Verify

- [x] 6.1 Run the type check and unit tests; confirm existing environment flows (list/rename/delete/
  create with no location) still pass unchanged, and that new tests pass.
