## Context

The dashboard currently shows the full shared restaurant catalog (from the `restaurant-offers` change). This change lets a user group restaurants into their own dining environments and filter the dashboard to one of them. The backend already exposes user-scoped CRUD for environments and a first-class membership resource; the frontend adds the UI, the store, and the typed API layer, plus three more design-system primitives.

Prior changes established the shared bearer fetch wrapper, the Pinia + router wiring, and the `Icon`/`Button`/`Card`/`Badge`/`Tag` primitives. `Input`, `Tabs`, and `Dialog` are not yet ported.

Relevant backend endpoints (both bearer-authorized, user-scoped server-side):
- `/api/v1/dining-environments`: `GET` (list), `POST` (create), `PUT/{id}` (update, `If-Match`), `DELETE/{id}` (`If-Match`). `DiningEnvironmentDto` = `{ id, concurrencyToken, name, description? }`.
- `/api/v1/environment-restaurants`: `GET` (list all the user's links), `POST` (create `{ environmentId, restaurantId }`, returns the join row), `DELETE/{id}` (`If-Match`). `EnvironmentRestaurantDto` = `{ id, concurrencyToken, environmentId, restaurantId }`.

## Goals / Non-Goals

**Goals:**
- Port `Tabs`, `Dialog`, `Input` into `src/` from their four source files, transitions as CSS/Vue `<Transition>`.
- Type environment + membership DTOs; add the API layer with correct `If-Match` handling.
- Add the environments store (list, selected environment, membership map) and wire tabs + editor dialog + per-card membership action into the existing dashboard.

**Non-Goals:**
- A dedicated route per environment (kept as tabs on the dashboard - see assumption).
- Favourites, the wheel, admin restaurant management, notification settings.
- Client-side ownership checks (the server scopes to the current user).
- Optimistic concurrency conflict resolution UI beyond surfacing an error.

## Decisions

**Membership is keyed by the join row, not by (environmentId, restaurantId) - correcting the request.** The backend has no nested `add/remove(environmentId, restaurantId)` route. Add = `POST /environment-restaurants { environmentId, restaurantId }` returning a join row with its own `id` + `concurrencyToken`; remove = `DELETE /environment-restaurants/{joinId}` with `If-Match`. So the store models each environment's membership as `Map<restaurantId, { joinId, concurrencyToken }>`, populated from `getEnvironmentRestaurants()` on load and updated from each add response. Rationale: removal and any future membership update need the join row's identity and token; a plain `Set<restaurantId>` cannot delete correctly.

**`Input` must be ported here - the request assumed it already existed.** Only `Icon/Button/Card/Badge/Tag` are ported. The editor dialog needs a text field for the name and a multiline field for the description, both covered by the design system's single `Input` (`multiline`/`rows`). Rationale: keep the port lazy but honest - the change that first needs `Input` ports it.

**Filtering is client-side against the already-loaded catalog.** Selecting an environment tab sets `selectedEnvironmentId` in the store; the dashboard computes the visible list by intersecting the loaded catalog with that environment's membership map. No restaurant refetch. Rationale: the catalog is already cached from `restaurant-offers`; membership is small and local, so filtering is instant and offline-of-network.

**Selected environment lives in the environments store, read by the dashboard and cards.** `selectedEnvironmentId: string | null` (null = "All"). `RestaurantCard` reads it to decide whether to show the membership action and whether the restaurant is a member. Rationale: one source of truth shared by tabs, dashboard, and cards; avoids prop-drilling selection through the list.

**Delete confirmation is a two-step state inside the dialog.** `EnvironmentEditorDialog` holds a local `confirmingDelete` flag; the first delete click reveals an in-dialog confirm/cancel, the second performs `deleteEnvironment`. Rationale: the design system provides `Dialog` for exactly this; a native `confirm()` breaks the dark-theme visual system and the content rules.

**Alternatives considered:**
- *A route per environment (`/env/:id`)* - deferred (the stated assumption); tabs are simpler and need no deep-linking now. Revisit if shareable URLs are wanted.
- *Server-side filtered restaurant fetch per environment* - rejected: the catalog is already loaded; a membership intersection is cheaper and avoids N fetches.
- *Storing membership as `Set<restaurantId>`* - rejected: cannot delete the join row (needs id + token).
- *A `Textarea` primitive for the description* - unnecessary: `Input multiline` already renders a `<textarea>` per its contract.

## Risks / Trade-offs

- **Concurrency conflict on update/delete (409/428)** -> the entity's token may be stale. Mitigation: always send `If-Match` from the stored token; surface a conflict error and let the user retry after a refetch. Full conflict-merge UI is out of scope.
- **Membership list can grow with many environments** -> `getEnvironmentRestaurants()` returns all the user's links. Mitigation: acceptable at expected scale; the store indexes them into per-environment maps once on load.
- **Add/remove race on the same restaurant** -> double-clicking the membership action. Mitigation: disable the action while its request is in flight (per-restaurant pending flag), mirroring the offers-loading pattern.
- **Dialog focus/scroll and stacking** -> a modal over the dashboard. Mitigation: render within a page-root relative container per the `Dialog` contract; trap is minimal (no nested dialogs in scope).
- **`Tabs` overflow with many environments** -> a long tab row. Mitigation: allow horizontal scroll of the tab row; no truncation of labels beyond that.

## Migration Plan

Additive except for `RestaurantCard.vue` and `DashboardView.vue`, which gain environment features. Port `Tabs`/`Dialog`/`Input`; add `types/environment.ts`, `api/environments.ts`, `stores/environments.ts`; add `EnvironmentTabs.vue` + `EnvironmentEditorDialog.vue`; extend `RestaurantCard` with the membership action; extend `DashboardView` with tabs, filtering, and the manage entry point. Rollback is reverting the change; the dashboard returns to the unfiltered catalog. No backend or dependency changes.

## Open Questions

- Confirm the environment `DELETE` requires `If-Match` (the controller accepts a nullable token but likely enforces 428 when the entity requires concurrency) - send it unconditionally and confirm at apply.
- Whether "Manage environments" should also allow reordering environments - not requested; out of scope for now.
- Whether the selected environment should persist across reloads - it currently resets to "All" (in-memory only), consistent with the token's in-memory design; revisit if persistence is wanted.
