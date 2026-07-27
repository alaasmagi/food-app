## Context

`WheelEditorDialog.vue` builds a `UserWheel`, whose `restaurantNames` is a frozen snapshot of
restaurant NAMES (not ids) per the backend rule. The editor tracks selection in a `reactive<Set<string>>`
of names, pre-filled from an edited wheel, and offers a paged, name-searchable picker
(`useRestaurantSearch`) so it never loads the whole catalog into the picker. Save sends `[...selected]`
as `restaurantNames` through the existing create/update endpoint.

Two client-side datasets already exist that make an environment import possible without a backend call:
- `useEnvironmentsStore`: `list` (the user's environments: id + name), `membershipByEnv[envId]`
  (`restaurantId -> MembershipRef`), and cached loaders `loadEnvironments()` / `loadMembership()`.
- `useRestaurantsStore`: `list` (the full catalog, `Restaurant[]` with `id` and `name`), loaded once
  via `loadRestaurants()` and explicitly intended for "surfaces that need every restaurant" including
  the wheel.

Environment membership is keyed by restaurant id, but the wheel needs names — so the import must map
ids → names through the catalog. The `Select` design-system component is already ported
(`options: SelectOption[]`, `v-model<string>`).

## Goals / Non-Goals

**Goals:**
- Add an "Import from environment" `Select` to the wheel editor that merges an environment's current
  restaurants into the wheel's `selected` name set.
- Resolve membership restaurant ids to names via the catalog; import only ids that still resolve.
- Keep the import additive and de-duplicating; leave the manual list and search untouched.
- Report the number added with a non-blocking toast, distinguishing "added N" from "nothing new".

**Non-Goals:**
- Live-linking a wheel to an environment. The wheel stays a frozen snapshot; a later change to the
  environment does not propagate to a saved wheel.
- Any backend endpoint or change to the wheels API / frozen-name model.
- Replacing or reworking the manual checkbox picker or its paged search.

## Decisions

### Import by name, resolved through the full catalog
Membership is keyed by restaurant id; the wheel stores names. The import maps each membership id to a
`Restaurant` in `restaurants.list` and adds its `name`. Ids that do not resolve (deleted catalog
entries) are skipped. This keeps the import consistent with the frozen-name model and with how the
editor already tracks selection by name — no id ever leaks into the wheel.
*Alternative considered:* store ids on the wheel — rejected; it contradicts the established
`restaurantNames` frozen-name contract and would be a backend change.

### Reuse cached store loaders on open; do not add store state
On open the editor calls `environments.loadEnvironments()`, `environments.loadMembership()`, and
`restaurants.loadRestaurants()` — each a no-op if already loaded. No new store action is needed; the
import is a pure read over existing state. A small `importFromEnvironment(envId)` handler in the
component (or a thin composable if it keeps the component tidy) does the id→name resolution and set
merge.
*Alternative considered:* a dedicated store action — rejected as unnecessary; there is no shared state
to mutate beyond the component's local `selected` set, and the read is trivial.

### Additive merge into the existing `selected` Set
The handler iterates the chosen environment's membership, resolves names, and `selected.add(name)`s
each. The `Set` innately de-duplicates, so importing over an existing selection or importing twice is
safe. Counting "newly added" is done by checking `selected.has(name)` before adding (or comparing set
size before/after) so the toast can distinguish real additions from no-ops.
*Alternative considered:* replace the selection on import — rejected; the proposal requires additive
merge so a user can combine environments and manual picks.

### The Select is an action trigger, not bound wheel state
The chosen environment id is transient UI state used only to run one import; it is not persisted on the
wheel and is reset so the same environment can be imported again if desired. This matches the
frozen-snapshot intent: the wheel records names, never which environment they came from.

### Feedback via the existing toast store
Consistent with the editor's existing save toasts, the import pushes a success toast reporting the
count ("Added N restaurants" / "Added 1 restaurant" / "No new restaurants added"). Copy follows the
design-system rules (sentence case, digits, no em-dash, no emoji).

## Risks / Trade-offs

- [Catalog not loaded when import runs] → The editor awaits `restaurants.loadRestaurants()` on open;
  the import handler resolves against `restaurants.list`, and if the catalog is somehow empty the
  import simply resolves nothing and reports "no new restaurants added" rather than erroring.
- [Membership references a deleted restaurant] → Handled by design: unresolved ids are skipped, and
  the toast can note when nothing resolved so the outcome is never silently empty.
- [Name collisions across restaurants] → The wheel model is name-based by design; two catalog entries
  sharing a name already collapse to one wheel entry today. The import inherits this existing behavior
  rather than introducing a new concern.
- [Large environment vs paged picker] → The import writes names directly into `selected`; it does not
  depend on those restaurants being on the current picker page, so a large environment imports fully
  even though the picker only shows one page. The "N selected" count reflects the merged set.

## Migration Plan

1. Add the import `Select` and its handler to `WheelEditorDialog.vue`; wire the three cached loaders
   into the existing on-open flow.
2. Implement id→name resolution against `restaurants.list`, additive merge into `selected`, and the
   count-aware toast.
3. Tests: importing merges names into the selection, de-duplicates, skips unresolved ids, and the
   toast reports the correct count; existing wheel editor tests (manual selection, save, share)
   continue to pass unchanged.
4. Client-only and additive; nothing to roll back on the backend. Reverting the component change
   restores the prior editor exactly.

## Open Questions

- None blocking. If, later, users want the wheel to track its source environment, that is a separate
  (backend-touching) change explicitly out of scope here.
