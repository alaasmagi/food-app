## Context

The backend stores an auto-fill origin on each `DiningEnvironment` (`AutoFillLatitude`,
`AutoFillLongitude`, `AutoFillRadiusMeters`, all nullable) and exposes
`POST /api/v1/dining-environments/{id}/auto-fill`, an owner-scoped, additive proximity import that
adds every restaurant within the radius (default 500 m) as an `EnvironmentRestaurant` membership and
returns `{ added, alreadyPresent, totalMembers }`. The web frontend already ships the picker + fill
UI against this contract. This change brings the mobile app to parity.

On mobile the relevant pieces already exist: `DiningEnvironment` and `EnvironmentRestaurant` types
(`src/types/environment.ts`), the environments API module (`src/api/environments.ts`) with the
shared `apiFetch` wrapper and `parseProblemDetails` error path, React Query hooks
(`src/hooks/useEnvironments.ts`, `useEnvironmentRestaurants.ts`, `useEnvironmentMutations.ts`), the
`EnvironmentEditorDialog.tsx` create/rename/delete dialog, and a dark-styled `react-native-maps`
`MapView` in `src/components/restaurant/RestaurantMap.tsx` (with `mapStyle.ts` providing
`darkMapStyle` and `regionForCoordinates`). `react-native-maps@1.20.1` is already a dependency and
exports `Marker` and `Circle`. Toasts are raised via the app-level `ToastProvider` / `useToast()`.

## Goals / Non-Goals

**Goals:**
- Add the three nullable auto-fill fields to the mobile `DiningEnvironment` type and round-trip them
  on create/update.
- Add `autoFillEnvironment(id)` to the API module and a mutation hook that invalidates membership.
- Add an optional map-based location + radius section to the environment editor, and a "fill with
  nearby restaurants" action with a summary toast, matching the web behavior with native mechanics.
- Mirror the backend's write validation client-side to avoid predictable 400s.

**Non-Goals:**
- Per-restaurant distance display and live/continuous re-fill (out of scope, as on web).
- Any backend change — the DTO fields and endpoint already exist.
- Server-side geocoding — coordinates are client-supplied; the optional place search is a plain
  Nominatim `fetch`.
- A light-mode variant of the picker map — the app is dark-mode-first.

## Decisions

- **Extract `EnvironmentLocationPicker.tsx` rather than inline the map in the dialog.** The dialog is
  already a two-step (edit / confirm-delete) stateful component; folding a map, marker, circle,
  radius input, and search box into it would make it unwieldy. A dedicated component takes a
  controlled value `{ latitude, longitude, radiusMeters }` plus `onChange`, keeping the dialog thin.
  *Alternative considered:* inline section — rejected for size and testability.
- **Reuse `RestaurantMap`'s dark styling verbatim** (`userInterfaceStyle="dark"` + `customMapStyle`
  on Android via `darkMapStyle`) instead of a second styling path, so the picker matches the app's
  map aesthetic and tile-load gaps stay dark.
- **Marker placement via map `onPress` and `Marker` `draggable`/`onDragEnd`.** These are the native
  analog of the web's click-to-place + drag. A "clear location" button nulls all three fields (radius
  cannot outlive its coordinates). *Alternative considered:* a device-GPS "use my location" button —
  deferred; it would pull in a location permission the app deliberately avoids (see restaurant-map).
- **Radius as a plain numeric `Input`, shown only once a location is set**, with a `Circle` overlay
  centred on the marker previewing 500 m when the field is empty and the entered value otherwise. An
  empty radius shows a "defaults to 500 m" hint, matching the backend's effective-radius rule.
- **Validation mirrored in a small pure helper** (both-or-neither coordinates; radius only with a
  location; radius an integer within 1..50000). The helper returns an inline message and blocks save
  on violation. The backend remains the source of truth; this only avoids obvious round-trips.
- **`autoFillEnvironment` returns `DiningEnvironmentAutoFillResult` (`{ added, alreadyPresent,
  totalMembers }`)** and throws parsed ProblemDetails on non-ok, exactly like the other calls. The
  `useAutoFillEnvironment` hook invalidates `environmentRestaurantsQueryKey` on success so the tabs
  and per-card membership re-render from fresh server data. Coordinates are also round-tripped
  through `createEnvironment`/`updateEnvironment` by extending `EnvironmentInput`.
- **The fill button is gated on stored coordinates on the persisted environment**, so it appears both
  right after saving a located environment and when reopening an existing one that already has an
  origin — enabling re-runs. A pending guard blocks double submits.
- **Optional place search via Nominatim** as a plain `fetch` (not `apiFetch`, no bearer token); on
  empty result or failure it shows a non-blocking message and leaves the marker/view unchanged. It is
  strictly additive to the tap/drag flow.

## Risks / Trade-offs

- [Native map inside a Dialog may not lay out correctly at first paint] → give the map an explicit
  height and container, following `RestaurantMap`; test the picker in isolation with mocked
  `react-native-maps` (as `RestaurantMap.test.tsx` already does).
- [Client validation could drift from backend rules] → keep the mirror minimal (the three documented
  rules) and rely on the backend's 400 as the real gate; surface its ProblemDetails message.
- [Nominatim has usage limits and no SLA] → search is optional and non-blocking; tap/drag is the
  primary path, and a failed search never breaks the save flow.
- [Auto-fill returning `added: 0` could read as a failure] → distinct toast copy for the zero case
  ("no new restaurants added"), matching web.

## Migration Plan

Purely additive. No data migration, no backend change. New fields are nullable and default to null;
existing create/rename/delete/list flows are unchanged when no location is set. Rollback is removing
the location section and the API/hook additions.

## Open Questions

- None blocking. Whether to later add a device-GPS "use my location" shortcut is deferred pending a
  decision on introducing a location permission.
