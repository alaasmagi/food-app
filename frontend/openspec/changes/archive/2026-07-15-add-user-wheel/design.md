## Context

This is the last feature in the backend's sequence: a saved, named `UserWheel` - a frozen list of restaurant names plus an `isPublic` flag - and a spin interaction to pick one at random. Prior changes established the bearer wrapper, the ported primitives (`Icon/Button/Card/Badge/Tag/Tabs/Dialog/Input/Toast`), the toast service, and the restaurant catalog store. This change ports `Switch` and `Checkbox`, adds the wheel API/store, a builder dialog, a bespoke spinner, and a new `/wheel` route with header navigation.

Backend (bearer-authorized, user-scoped): `/api/v1/user-wheels` with `GET` (list), `POST` (create), `PUT/{id}` (update, `If-Match`), `DELETE/{id}` (`If-Match`). `UserWheelDto` = `{ id, concurrencyToken, name (required), restaurantNames (List<string>), isPublic }`. `restaurantNames` is a frozen snapshot of names, not restaurant ids.

## Goals / Non-Goals

**Goals:**
- Port `Switch` and `Checkbox` into `src/`, CSS-only states.
- Type the wheel DTO; add the API layer and a load-once store with create/update/delete.
- Build the editor dialog (name, searchable checkbox catalog, public switch) that saves a frozen name snapshot, and a bespoke token-styled spinner that picks a name client-side.
- Add the `/wheel` route and header navigation.

**Non-Goals:**
- The public/shareable link for `isPublic` wheels (needs backend authorization design; only the toggle is saved).
- Server-side spin/selection, weighting, or spin history.
- Editing a wheel's names as free text (names come from checking catalog restaurants).

## Decisions

**Spin selection is client-side over the frozen names - confirming the stated assumption.** `UserWheel` is pure storage; there is no spin endpoint. `WheelSpinner.spin()` picks an index with `Math.random()` over `restaurantNames`, animates the wheel to that segment, and emits the name. Rationale: matches the backend's data-only design; a round trip would add latency for a purely presentational random pick. (`Math.random` is fine in app code.)

**`restaurantNames` is a frozen snapshot of names, not ids.** The editor's checkbox list is built from the already-loaded catalog, but what is saved is each checked restaurant's `name` string. Rationale: the backend rule is explicit - the wheel must not break when a restaurant is renamed or removed; storing names freezes the wheel's contents at creation time. The spinner consumes names directly and never resolves them back to catalog entries.

**The spinner animates by rotating the wheel to a target angle, not by re-picking during animation.** `spin()` chooses the winning index first, computes the final rotation (several full turns + the angle that lands the chosen segment under the pointer), sets it as a CSS `transform` with a transition, and emits on `transitionend`. Rationale: the result is decided up front (deterministic, testable), and the animation is pure CSS - no per-frame JS. Testing can call `spin()` and assert the emitted name without waiting on the real transition.

**Editor builds names from a Set of checked ids, resolved to names on save.** The dialog tracks checked restaurant ids (stable keys) in a reactive Set and maps them to names when saving; the search `Input` filters the visible catalog rows only. Rationale: ids are stable for checkbox keys and toggle state; names are produced only at save time, keeping the snapshot semantics explicit.

**Header navigation uses `RouterLink`, active state from the router.** The shell header gains Dashboard and Wheel links; the wheel route is guarded like the dashboard. Rationale: standard Vue Router navigation; the existing guard already protects any non-public route, so `/wheel` needs no special handling.

**Alternatives considered:**
- *Storing restaurant ids and resolving names at spin time* - rejected: violates the frozen-snapshot rule; a removed/renamed restaurant would corrupt the wheel.
- *Canvas spinner* - rejected in favor of SVG: SVG segments are easier to style with `var(--token)` colors, are crisp at any size, and are inspectable/testable in jsdom.
- *A dedicated route per wheel* - unnecessary; the `/wheel` view lists wheels and shows the selected one's spinner inline.
- *Re-fetching restaurants in the editor* - rejected: the catalog is already loaded by `restaurant-offers`; reuse it.

## Risks / Trade-offs

- **Empty or single-name wheel** -> a spin over 0 or 1 names is degenerate. Mitigation: require at least 2 checked restaurants to save a wheel (client-side), and disable spin when a wheel has fewer than 2 names; surface it as a hint, not a crash.
- **Many segments crowd the wheel** -> long catalogs make labels unreadable. Mitigation: render segment labels with truncation/rotation; acceptable for now, revisit if wheels routinely hold dozens of names.
- **Concurrency conflict on update/delete (409/428)** -> stale token. Mitigation: send `If-Match` from the stored token; surface a toast on conflict. Full merge is out of scope.
- **Color assignment across segments** -> need distinct, on-brand segment colors from tokens only. Mitigation: cycle a small fixed palette of accent/status/neutral tokens by segment index; no hardcoded hex.
- **Catalog not loaded when the editor opens** -> the checkbox list would be empty. Mitigation: ensure the wheel view/editor triggers the restaurants store's `loadRestaurants()` (load-once) before building the list.

## Migration Plan

Additive: no existing behavior changes except the shell header (gains nav) and the router (gains `/wheel`). Port `Switch`/`Checkbox`; add `types/wheel.ts`, `api/wheels.ts`, `stores/wheels.ts`; add `WheelEditorDialog.vue`, `WheelSpinner.vue`, `WheelView.vue`; register the route and header nav. Rollback is reverting the change; the app returns to dashboard-only. No backend or dependency changes.

## Open Questions

- Minimum names to allow a spin - proposed 2; confirm at apply.
- Whether "Delete" should confirm in-dialog like the environment editor - proposed a lightweight confirm on the wheel card; confirm at apply.
- Segment color palette selection - proposed cycling accent/status/neutral tokens by index; adjust if a specific palette is wanted.
