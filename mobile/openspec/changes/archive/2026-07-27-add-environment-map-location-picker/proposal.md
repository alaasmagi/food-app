## Why

Seeding a dining environment on mobile today means adding restaurants one at a time from the list.
The backend already stores an auto-fill origin (a point plus optional radius) on a
`DiningEnvironment` and exposes a one-shot proximity import, and the web frontend already consumes
it. Mobile needs parity: let a user pick that point on a map, set a radius, and trigger the import,
turning "add these 20 nearby places" from twenty taps into one.

## What Changes

- The `DiningEnvironment` type gains three optional, nullable fields carrying the saved auto-fill
  origin: `autoFillLatitude`, `autoFillLongitude`, `autoFillRadiusMeters` (camelCase, matching the
  app's DTO convention where the backend's `AutoFill*` fields serialize to camelCase JSON, as
  `concurrencyToken` already does).
- Environment create/update requests carry these fields through to the backend when set; renaming an
  environment must not drop a stored origin.
- A new API function `autoFillEnvironment(id)` posts to `POST /api/v1/dining-environments/{id}/auto-fill`
  and returns the summary (`{ added, alreadyPresent, totalMembers }`), plus a React Query mutation
  hook that invalidates the membership query on success.
- `EnvironmentEditorDialog.tsx` gains an optional location section per environment, built on
  `react-native-maps`:
  - A compact `MapView` reusing the restaurant map's dark styling, with a draggable `Marker` that
    sets `autoFillLatitude`/`autoFillLongitude`; tapping the map or dragging the marker updates the
    point, and a "clear location" affordance removes it and nulls all three fields.
  - An optional place-search box that geocodes an address client-side via Nominatim (a plain
    `fetch`, no key, not routed through the bearer-token `apiFetch`) and recentres the map on a hit.
  - A radius `Input` (meters), shown only once a location is set, with a `Circle` overlay reflecting
    the entered value; an empty radius shows a "defaults to 500 m" hint.
  - Copy stating that both location and radius are optional and that auto-fill is unavailable with
    no location set.
- After an environment with coordinates is saved, a "Fill with nearby restaurants" `Button` calls
  the auto-fill hook, the membership query is refetched, and a success `Toast` reports how many
  restaurants were added (with a distinct "no new restaurants added" message when `added` is 0). The
  same button is available on any existing environment that already has stored coordinates, so the
  import can be re-run later as the catalog grows.
- Client-side validation mirrors the backend write rules to block an obviously invalid save:
  both-or-neither coordinates, radius only when a location is set, and radius a positive integer
  within 1..50000; an inline message is surfaced instead of a round-trip that will 400.
- **BREAKING**: none. All new fields are optional; existing environment create/rename/delete/list
  flows are unchanged when no location is set.

## Capabilities

### New Capabilities
- `environment-auto-fill`: The environment editor's optional map-based location + radius picker
  (react-native-maps `MapView` with a draggable marker, optional Nominatim place search, and a
  radius `Circle` overlay), the client-side mirror of the backend's both-or-neither /
  radius-requires-location validation, and the "fill with nearby restaurants" action that triggers
  the backend auto-fill endpoint and refetches membership with a summary toast.

### Modified Capabilities
<!-- None. The dining-environments capability's existing requirements (list, create, rename, delete,
     membership) are unchanged; the location picker and auto-fill are additive and covered by the new
     capability above. The restaurant-map capability is reused as reference, not modified. -->

## Impact

- **types**: `src/types/environment.ts` — three new nullable fields on `DiningEnvironment`.
- **api**: `src/api/environments.ts` — new `autoFillEnvironment(id)` function and result type; the
  `EnvironmentInput` write shape carries the optional auto-fill fields.
- **hooks**: `src/hooks/useEnvironmentMutations.ts` — create/update round-trip the auto-fill fields;
  a `useAutoFillEnvironment` mutation hook that calls the API and invalidates the membership query.
- **components**: `src/components/environment/EnvironmentEditorDialog.tsx` — new location section and
  fill button; a small reusable `EnvironmentLocationPicker.tsx` (extracted so it does not bloat the
  dialog, reusing the restaurant map's dark styling).
- **dependencies**: `react-native-maps` is already installed (`Circle` and `Marker` come from it);
  Nominatim is a plain client-side `fetch`, no new dependency.
- No changes to authentication, the shared `apiFetch` wrapper, or backend contracts beyond consuming
  the already-added DTO fields and endpoint.
