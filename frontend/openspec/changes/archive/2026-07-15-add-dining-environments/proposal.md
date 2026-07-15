## Why

Users need to organize the shared restaurant catalog into their own groupings ("Work", "Home") and view the dashboard filtered to just one of them, instead of always seeing the full catalog. This adds dining-environment management and environment-scoped filtering, layered onto the existing dashboard without a new route.

## What Changes

- Port three design-system primitives into `src/` from their `.d.ts` + `.prompt.md` + `.card.html` (+ `.jsx` for structure only), interaction/open-close states as CSS/Vue transitions:
  - `Tabs` -> `src/components/design-system/navigation/Tabs.vue` (underline tabs, `v-model` selection)
  - `Dialog` -> `src/components/design-system/feedback/Dialog.vue` (overlay, title, body, footer slots, `open` + `@close`)
  - `Input` -> `src/components/design-system/forms/Input.vue` (label, placeholder, icon, hint/error, `size`, `multiline`/`rows`) - **this was assumed already ported in the request but is not; it is included here** and covers both the name (single-line) and description (multiline) fields.
- Add `src/types/environment.ts`: `DiningEnvironment` (id, name, description, concurrencyToken) matching `DiningEnvironmentDto`, and `EnvironmentRestaurant` (id, environmentId, restaurantId, concurrencyToken) matching `EnvironmentRestaurantDto`.
- Add `src/api/environments.ts`: `getEnvironments()`, `createEnvironment()`, `updateEnvironment()` (If-Match from `concurrencyToken`), `deleteEnvironment()` (If-Match), plus membership calls against the `environment-restaurants` resource: `addRestaurantToEnvironment(environmentId, restaurantId)` (POST, returns the join row) and `removeRestaurantFromEnvironment(joinId, concurrencyToken)` (DELETE by join-row id, If-Match). A `getEnvironmentRestaurants()` list call loads the user's membership rows.
- Add `src/stores/environments.ts` (Pinia): the user's environments list; the currently selected environment (or null meaning "all restaurants"); and per-environment membership modeled as `restaurantId -> { joinId, concurrencyToken }` so a restaurant can be removed by targeting its join row with If-Match.
- Add `src/components/environment/EnvironmentTabs.vue` (ported `Tabs`): one tab per environment plus a fixed "All" tab; selecting a tab sets the store's selected environment and filters the dashboard list client-side against the already-loaded catalog, with no extra restaurant fetch.
- Add `src/components/environment/EnvironmentEditorDialog.vue` (ported `Dialog` + `Input`): create, rename, and delete an environment; delete requires a confirmation step inside the same dialog, not a browser `confirm()`.
- Modify `src/components/restaurant/RestaurantCard.vue`: add an "Add to environment" / "Remove from environment" action, shown only when a specific environment tab (not "All") is selected.
- Modify `src/views/DashboardView.vue`: render `EnvironmentTabs` above the restaurant list, filter the list by the selected environment, and add a "Manage environments" entry point that opens `EnvironmentEditorDialog`.
- No new route: this lives inside `DashboardView`. Handle a 403 from any environment call gracefully (server already scopes environments to the current user; no client-side ownership logic).

## Capabilities

### New Capabilities
- `dining-environments`: managing a user's dining environments (create/rename/delete), managing restaurant membership within an environment, and selecting an environment to filter the dashboard. Covers the typed API layer, the environments Pinia store, `EnvironmentTabs`, and `EnvironmentEditorDialog`.

### Modified Capabilities
- `design-system-foundation`: ADD the `Tabs`, `Dialog`, and `Input` primitives.
- `restaurant-offers`: MODIFY "Dashboard lists the restaurant catalog" (now renders environment tabs and can filter the list by the selected environment) and "Restaurant card" (adds the environment membership action shown only under a specific environment).

## Impact

- **New source areas**: `src/components/design-system/navigation/`, `src/components/design-system/feedback/`, `src/components/design-system/forms/Input.vue`, `src/components/environment/`, `src/api/environments.ts`, `src/stores/environments.ts`, `src/types/environment.ts`. `RestaurantCard.vue` and `DashboardView.vue` are modified.
- **Backend contract**: `/api/v1/dining-environments` (GET/POST/PUT/DELETE, If-Match on PUT/DELETE) and `/api/v1/environment-restaurants` (GET list, POST create `{ environmentId, restaurantId }`, DELETE `{joinId}` with If-Match). All bearer-authorized and user-scoped server-side.
- **Correction to the request**: there is no nested `add/removeRestaurantToEnvironment(environmentId, restaurantId)` route. Membership is a first-class `environment-restaurants` resource; removal targets the join row's own id with its concurrency token, so the store must retain each membership's `joinId`/`concurrencyToken`.
- **Concurrency**: `If-Match` is required on environment update/delete and membership delete; tokens are round-tripped from the store, not discarded after read.
- **No new dependencies.**
- **Assumption (stated for apply)**: environment switching is tabs on the existing dashboard, not a separate route per environment.

## Out of Scope

- Favourites, the wheel, admin restaurant management, notification settings.
