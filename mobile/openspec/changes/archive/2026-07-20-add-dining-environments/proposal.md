## Why

The shared restaurant catalog is one long list for everyone. Users want to organize it into their own personal groupings ("dining environments") and narrow the Dashboard and Map to a single grouping, mirroring the capability the web frontend already ships against the same backend.

## What Changes

- Port two design-system primitives lazily for this feature: `Tabs` (navigation) and `Dialog` (feedback). The `Input` primitive (forms) is ported now if not already present, for the editor dialog.
- Add `src/types/environment.ts` with `DiningEnvironment` and `EnvironmentRestaurant` types matching the backend Web DTOs (camelCase, including `concurrencyToken`).
- Add `src/api/environments.ts` with `getEnvironments`, `createEnvironment`, `updateEnvironment`, `deleteEnvironment`, `getEnvironmentRestaurants`, `addRestaurantToEnvironment(environmentId, restaurantId)`, and `removeRestaurantFromEnvironment(joinId, concurrencyToken)`, all through the shared `apiFetch`. Update and both delete calls send the `If-Match` header from the entity's concurrency token.
- Add React Query hooks wrapping the api layer: `useEnvironments()` (list) and `useEnvironmentRestaurants()` (membership list) queries, plus create / update / delete / add-membership / remove-membership mutations that invalidate the relevant query keys.
- Add a minimal Zustand store for the selected environment id (or `null` meaning "All") — pure client state, not server data.
- Add `src/components/environment/EnvironmentTabs.tsx` (built on `Tabs`): a fixed "All" tab followed by one tab per environment. Selecting a tab sets the store's selected environment and drives client-side filtering of the already-loaded catalog on both Dashboard and Map — no additional restaurants fetch.
- Add `src/components/environment/EnvironmentEditorDialog.tsx` (built on `Dialog` + `Input`): create, rename, and delete an environment, with an in-dialog delete confirmation step (never a native `Alert`/`confirm`-style shortcut that bypasses the dialog).
- Add an "Add to / Remove from environment" action to `RestaurantCard`, shown only when a specific environment (not "All") is selected; it toggles membership via the add/remove mutations using the join row's id and concurrency token.
- Wire `EnvironmentTabs` into both `app/(tabs)/index.tsx` (Dashboard) and `app/(tabs)/map.tsx` (Map) so both surfaces filter to the same selected environment consistently.

Out of scope: favourites, the random-restaurant wheel, and settings.

## Capabilities

### New Capabilities

- `dining-environments`: user-owned groupings of restaurants — the environment API layer and React Query hooks, the selected-environment client store, the environment tabs and editor dialog, restaurant membership add/remove, and the design-system `Tabs`/`Dialog`/`Input` primitives this feature requires.

### Modified Capabilities

- `restaurant-dashboard`: the Dashboard's restaurant list changes from "the full shared catalog, without environment filtering" to a list filtered by the currently selected environment (with "All" showing the full catalog), and gains the environment tab row and the per-card membership action.
- `restaurant-map`: the Map's markers change from "every restaurant with valid coordinates" to only those restaurants in the currently selected environment (with "All" showing every coordinate-bearing restaurant), driven by the same selected-environment state, still reusing the shared cache with no extra restaurants fetch.

## Impact

- New files: `src/types/environment.ts`, `src/api/environments.ts`, environment React Query hooks under `src/hooks/`, a selected-environment Zustand store under `src/stores/`, `src/components/environment/EnvironmentTabs.tsx`, `src/components/environment/EnvironmentEditorDialog.tsx`, and ported `Tabs`/`Dialog`/`Input` design-system components under `src/components/design-system/`.
- Modified files: `app/(tabs)/index.tsx`, `app/(tabs)/map.tsx`, and `src/components/restaurant/RestaurantCard.tsx`.
- Backend: none. Consumes the existing `/api/v1/dining-environments` and `/api/v1/environment-restaurants` endpoints. No new dependencies.
- Client-side filtering only: environment membership narrows the already-cached restaurant set; it does not change how restaurants or offers are fetched.
