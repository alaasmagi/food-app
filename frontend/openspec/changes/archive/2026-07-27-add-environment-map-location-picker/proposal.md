## Why

Seeding a dining environment today means adding restaurants one at a time from the list. The backend
now stores an auto-fill origin (a point plus radius) on a `DiningEnvironment` and exposes a one-shot
proximity import. The frontend needs a way for a user to pick that point on a map, set a radius, and
trigger the import — turning "add these 20 nearby places" from twenty taps into one.

## What Changes

- `DiningEnvironment` frontend DTO type gains three optional, nullable fields carrying the saved
  auto-fill origin: `autoFillLatitude`, `autoFillLongitude`, `autoFillRadiusMeters` (camelCase, to
  match the app's existing DTO convention where the backend's `AutoFill*` fields serialize to
  camelCase JSON, as `concurrencyToken` already does).
- Environment create/update requests carry these fields through to the backend when set, and the
  environments store round-trips them alongside name/description.
- A new API function `autoFillEnvironment(id)` posts to
  `POST /api/v1/dining-environments/{id}/auto-fill` and returns the summary
  (`{ added, alreadyPresent, totalMembers }`).
- `EnvironmentEditorDialog.vue` gains an optional location section per environment:
  - A small Leaflet map reusing the restaurant map's setup (CARTO dark/light tiles matched to the
    theme, token-styled controls, the dark-tile brightness lift, isolated stacking context).
  - A search box that geocodes an address client-side via Nominatim (the OpenStreetMap search
    service) and recentres the map on a hit — no backend involvement, no API key.
  - A draggable/clickable marker that sets `autoFillLatitude`/`autoFillLongitude`; clicking the map
    or dragging the marker updates the stored point, and a "clear location" affordance removes it.
  - A radius `Input` (meters), shown only once a location is set, with a circle overlay on the map
    reflecting the current radius; an empty radius shows a "defaults to 500 m" hint.
  - Copy that makes clear both location and radius are optional and that auto-fill is unavailable
    with no location set.
- After an environment with coordinates is saved, a "Fill with nearby restaurants" `Button` appears
  that calls `autoFillEnvironment`, refreshes the environment's membership, and raises a success
  `Toast` reporting how many restaurants were added (and how many were already members).
- The same button is available on any existing environment that already has stored coordinates, so
  the import can be re-run later as the catalog grows — not only at creation time.
- Client-side validation mirrors the backend write rules to block an obviously invalid save:
  both-or-neither coordinates, radius only when a location is set, and radius within a sane positive
  range — surfacing an inline message instead of a round-trip that will 400.
- **BREAKING**: none. All new DTO fields are optional; existing environment create/update/list flows
  are unchanged when no location is set.

## Capabilities

### New Capabilities
- `environment-auto-fill`: The environment editor's optional map-based location + radius picker
  (Leaflet map, Nominatim search, draggable marker, radius circle), the client-side mirror of the
  backend's both-or-neither / radius-requires-location validation, and the "fill with nearby
  restaurants" action that triggers the backend auto-fill endpoint and refreshes membership with a
  summary toast.

### Modified Capabilities
<!-- None. The dining-environments capability's existing requirements (list, create, rename, delete,
     membership) are unchanged; the location picker and auto-fill are additive and covered by the new
     capability above. The restaurant-map capability is reused as reference, not modified. -->

## Impact

- **types**: `src/types/environment.ts` — three new nullable fields on `DiningEnvironment`.
- **api**: `src/api/environments.ts` — new `autoFillEnvironment(id)` function and a result type; the
  `EnvironmentInput` write shape carries the optional auto-fill fields.
- **stores**: `src/stores/environments.ts` — create/rename round-trip the auto-fill fields; a
  `autoFill(id)` action that calls the API and reloads membership for that environment.
- **components**: `src/components/environment/EnvironmentEditorDialog.vue` — new location section and
  fill button; a small reusable map picker (extracted so it does not bloat the dialog, reusing the
  restaurant map's tile/theme setup).
- **dependencies**: `leaflet` and `@types/leaflet` are already installed; Nominatim is a plain
  client-side `fetch`, no new dependency.
- No changes to authentication, the shared fetch wrapper, or backend contracts beyond consuming the
  already-added DTO fields and endpoint.
