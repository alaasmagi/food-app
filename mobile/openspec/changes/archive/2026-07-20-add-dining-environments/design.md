## Context

The mobile app already renders the shared restaurant catalog on the Dashboard (`app/(tabs)/index.tsx`, `useRestaurants()`) and on the Map (`app/(tabs)/map.tsx`, same cached data). Restaurants come from `/api/v1/restaurants` and are typed in `src/types/restaurant.ts`; the shared `apiFetch` helper attaches the bearer token and handles 401 refresh. The web frontend already ships dining environments against the same backend (`/api/v1/dining-environments`, `/api/v1/environment-restaurants`), so the backend contract, DTO shapes, and `If-Match` concurrency semantics are known and fixed. This change adds the same capability to mobile, adapted from the web's Pinia + Vue implementation to this app's React Query + Zustand + React Native stack.

Backend requires no changes. Both membership and environments are user-scoped server-side; the app does not implement ownership logic, it only calls the endpoints and surfaces failures.

## Goals / Non-Goals

**Goals:**
- Let a user create, rename, and delete personal environments, and add/remove restaurants to them.
- Filter both Dashboard and Map to a single selected environment (or "All"), consistently, using one shared selection.
- Do all filtering client-side over the already-cached catalog — no new restaurants fetch when switching environments.
- Port the `Tabs`, `Dialog`, and `Input` design-system primitives natively, lazily, only as this feature needs them.

**Non-Goals:**
- Favourites, the random-restaurant wheel, and settings (separate changes).
- Any backend or Keycloak change.
- Offline mutation queueing or optimistic UI beyond React Query's defaults.
- A restaurant-picker dialog for bulk-adding (the web's `AddRestaurantsDialog`); membership is toggled per-card here.

## Decisions

### Server state in React Query, selection in Zustand
Environments list and membership list are server data, so they live in React Query (`useEnvironments()`, `useEnvironmentRestaurants()`), matching the project rule that React Query's cache is the source of truth for server data — not a ported Pinia store. Only the selected environment id (or `null` = "All") is pure client state, so it lives in a tiny Zustand store, mirroring `authStore`. Alternative considered: hold selection in React state on each screen — rejected because Dashboard and Map must share one selection so switching on one is reflected on the other.

### Membership as a first-class join row, looked up via a derived map
`EnvironmentRestaurant` is a first-class resource keyed by its own id, and removal needs the join row's id + concurrency token. Rather than a bespoke store shape, the membership query returns all `EnvironmentRestaurant` rows; a small selector/helper derives, for the selected environment, a `restaurantId -> { joinId, concurrencyToken }` map used both to filter the catalog and to drive each card's add/remove action. Alternative: fetch memberships per-environment on demand — rejected as more requests for no benefit; the full membership list is small and cache-friendly.

### Filtering is a pure client-side derivation
Both screens compute their displayed set as `restaurants` (already cached) narrowed by the selected environment's membership map. When selection is `null`, no narrowing is applied. This keeps the existing single restaurants fetch untouched and makes environment switching instant. The Map applies the same narrowing before its existing coordinate filter.

### Concurrency tokens round-tripped from the cache
`updateEnvironment`, `deleteEnvironment`, and `removeRestaurantFromEnvironment` send `If-Match` from the entity's `concurrencyToken` held in the React Query cache, matching the backend requirement and the web implementation. After a successful mutation the affected queries are invalidated so the refreshed token is picked up.

### In-dialog delete confirmation, no native Alert
The editor dialog handles create/rename/delete, with delete gated by an explicit confirmation step rendered inside the same `Dialog` (a two-step state within the component), never a native `Alert.alert` shortcut — matching the design-system and web behavior and the spec.

### Lazy native ports of Tabs, Dialog, Input
Each primitive is ported from its own `.d.ts` + `.prompt.md` + `.card.html` into `src/components/design-system/{navigation,feedback,forms}/`, re-expressed with `View`/`Text`/`Pressable`/`Modal`/`TextInput` and token values. `Dialog` uses React Native's `Modal`; `Tabs` is a horizontal pressable row; `Input` wraps `TextInput`. No runtime import from `alaasmagi-design-system/`.

## Risks / Trade-offs

- [Membership map stale after mutation] → Every mutation invalidates the environments/memberships queries so the derived map and card actions re-render from fresh data; concurrency tokens are re-read from the refreshed cache.
- [Stale concurrency token causes a 409 on update/delete] → Surface the failure gracefully (no crash) and let the user retry after the invalidated query refetches the current token; do not implement custom conflict resolution.
- [403 on user-scoped endpoints] → The spec requires graceful surfacing without crashing; the shared error path already turns non-ok responses into handled errors, leaving the rest of the screen usable.
- [Selected environment id references a deleted environment] → On environments list change, if the selected id is no longer present, treat selection as "All" (`null`) so filtering never points at a missing environment.
- [Two tab rows drifting between Dashboard and Map] → Both screens render the same `EnvironmentTabs` bound to the same store, so there is a single source of truth for selection; no per-screen copy of the selection logic.

## Migration Plan

Additive, no data migration. New files plus edits to `app/(tabs)/index.tsx`, `app/(tabs)/map.tsx`, and `RestaurantCard.tsx`. Rollback is removing the new files and reverting those three edits; the catalog behavior returns to the unfiltered list. Ship behind no flag — the "All" tab preserves current behavior for users with no environments.

## Open Questions

- Where exactly the editor's "new environment" and per-environment "rename/delete" entry points sit in the tab row (a trailing "+" plus long-press/edit affordance) — a presentation detail to settle against the `Tabs.card.html` reference during implementation; it does not affect the API, store, or filtering design.
