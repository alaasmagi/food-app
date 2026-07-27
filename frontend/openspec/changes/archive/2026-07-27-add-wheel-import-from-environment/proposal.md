## Why

A user who already has a `DiningEnvironment` grouping the restaurants they care about still has to
re-check each one by hand when building a wheel from the same set. The data to do this in one action
is already on the client (environment membership and the restaurant catalog), so the editor can offer
a one-click import instead of repeating the selection manually.

## What Changes

- `src/components/wheel/WheelEditorDialog.vue` gains an "Import from environment" control: a `Select`
  of the user's `DiningEnvironment`s. Choosing one adds every restaurant currently in that environment
  to the wheel's checked set, by NAME (matching `UserWheel.restaurantNames`' frozen-name semantics).
- The import resolves names entirely from data already loaded client-side: the environments store's
  membership index (`membershipByEnv[envId]` → restaurant ids) mapped through the restaurants store's
  full catalog (`list`, id → name). The editor ensures those two datasets are loaded when it opens.
- Import is additive and de-duplicating: it merges into the current `selected` set rather than
  replacing it, and the `Set` guarantees a name is never added twice. Manual check/uncheck and search
  remain fully usable before and after an import.
- If a membership still references a restaurant that has since been deleted from the catalog (its id
  no longer resolves to a current restaurant), that entry is skipped silently — only names that
  resolve to a current restaurant are imported.
- A short, non-blocking confirmation reports how many restaurants were added (and, when relevant, that
  some were already selected or could not be resolved), so an import that adds nothing is not silently
  ambiguous.
- No backend change: the wheel is still saved through the existing create/update endpoint with the
  resulting `restaurantNames` array. The import is a pure client-side convenience over the existing
  manual checkbox list, which is unchanged.
- **BREAKING**: none. The control is additive; existing wheel create/edit flows work exactly as
  before when the control is not used.

## Capabilities

### New Capabilities
- `wheel-import-from-environment`: The wheel editor's "import from environment" control — a select of
  the user's dining environments that additively merges an environment's current restaurants into the
  wheel's selection by name, using client-side membership and catalog data, de-duplicating and
  skipping memberships that no longer resolve to a current restaurant.

### Modified Capabilities
<!-- None. The user-wheel capability's existing "Wheel editor dialog" requirement (manual checkbox
     list, paged search, name/public fields, save) is unchanged — the import control is additive and
     covered by the new capability above. -->

## Impact

- **components**: `src/components/wheel/WheelEditorDialog.vue` — new import control and its handler; a
  small amount of new state (the selected environment id for the control).
- **stores**: reads `useEnvironmentsStore` (`list`, `membershipByEnv`, `loadEnvironments`,
  `loadMembership`) and `useRestaurantsStore` (`list`, `loadRestaurants`). No store changes required,
  though a name-resolution helper may live in a composable if it keeps the component thin.
- **design-system**: reuses the already-ported `Select` component; no new component.
- No changes to the wheels API, backend contracts, authentication, or the frozen-name wheel model.
