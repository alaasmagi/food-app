## 1. Data loading on open

- [x] 1.1 In `WheelEditorDialog.vue`, import `useEnvironmentsStore` and `useRestaurantsStore`; on the
  existing open watcher, call `environments.loadEnvironments()`, `environments.loadMembership()`, and
  `restaurants.loadRestaurants()` (each cached/no-op if already loaded) so the import has data.

## 2. Import control

- [x] 2.1 Add an "Import from environment" `Select` above the restaurant picker, its options built
  from `environments.list` (`{ value: id, label: name }`); track the chosen id in a local ref used
  only to trigger an import (not persisted on the wheel).
- [x] 2.2 When no environments exist, render the control in a state that conveys there is nothing to
  import (disabled with an explanatory hint) rather than an empty actionable select.

## 3. Import handler

- [x] 3.1 Implement `importFromEnvironment(envId)`: read `environments.membershipByEnv[envId]` for the
  restaurant ids, resolve each id to a `Restaurant` in `restaurants.list`, and collect the names of
  those that resolve (skip ids with no current catalog match).
- [x] 3.2 Merge the resolved names additively into the existing `selected` Set, counting how many were
  newly added (not already selected); reset the Select's chosen id afterward so the same environment
  can be imported again.
- [x] 3.3 Push a toast reporting the outcome: "Added N restaurants" / "Added 1 restaurant" when one or
  more were added, or "No new restaurants added" when nothing resolved or all were already selected.

## 4. Tests

- [x] 4.1 Import merges an environment's restaurant names into the selection additively and updates
  the "N selected" count.
- [x] 4.2 Import de-duplicates against already-selected names and preserves prior manual selections.
- [x] 4.3 Import skips membership ids that do not resolve to a current restaurant, importing the rest.
- [x] 4.4 The result toast reports the correct count, including the "no new restaurants added" case.

## 5. Verify

- [x] 5.1 Run the type check and unit tests; confirm the existing wheel editor flows (manual
  selection, paged search, save, share) still pass unchanged.
