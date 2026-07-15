## Why

Users want a saved, named picker over a frozen list of restaurant names, with a spin interaction to pick one at random. This adds `UserWheel` management (create/edit/delete) and a bespoke spinning-wheel visual, on a new `/wheel` route.

## What Changes

- Port two design-system form primitives into `src/components/design-system/forms/` from their `.d.ts` + `.prompt.md` + `.card.html` (+ `.jsx` for structure): `Switch` and `Checkbox`, both a `v-model` boolean + `label` + `disabled`, interaction states as scoped CSS.
- Add `src/types/wheel.ts`: a `UserWheel` interface matching `UserWheelDto` (id, concurrencyToken, name, restaurantNames `string[]`, isPublic).
- Add `src/api/wheels.ts` against `/api/v1/user-wheels`: `getWheels()`, `createWheel(name, restaurantNames, isPublic)`, `updateWheel(id, input, concurrencyToken)` (If-Match), `deleteWheel(id, concurrencyToken)` (If-Match).
- Add `src/stores/wheels.ts` (Pinia): the user's saved wheels list with load-once caching and create/update/delete keeping the list in sync.
- Add `src/components/wheel/WheelEditorDialog.vue`: `Dialog` + `Input` (name) + a searchable `Checkbox` list over the already-loaded restaurant catalog + a `Switch` for `isPublic`. The wheel stores `restaurantNames` (a frozen snapshot of the checked restaurants' `name` values), not restaurant ids, per the backend's rule.
- Add `src/components/wheel/WheelSpinner.vue`: a bespoke SVG spinning-wheel (not a design-system primitive), one segment per name, styled only with `var(--...)` tokens (no hardcoded colors), with a `spin()` that animates to a randomly chosen name via CSS transition and emits the result.
- Add `src/views/WheelView.vue` on a new guarded `/wheel` route: a list of saved wheels (a `Card` per wheel with "Spin", "Edit", "Delete" actions); selecting one shows its `WheelSpinner`; "New wheel" opens `WheelEditorDialog`.
- Router: register the `/wheel` route (behind the existing guard) and add a primary nav entry in the app shell header (Dashboard, Wheel).

**Assumption to confirm before apply**: the spin's random selection happens entirely client-side (`Math.random()` over the frozen `restaurantNames`); no backend endpoint picks the result, since `UserWheel` is only data storage.

## Capabilities

### New Capabilities
- `user-wheel`: managing a user's saved wheels (create/edit/delete over the restaurant catalog, storing a frozen name snapshot) and the bespoke spinning-wheel spin interaction on the `/wheel` view.

### Modified Capabilities
- `design-system-foundation`: ADD the `Switch` and `Checkbox` primitives.
- `app-shell`: MODIFY "Minimal app shell layout" - the header now also renders primary navigation (Dashboard, Wheel), and a guarded `/wheel` route is added alongside the dashboard.

## Impact

- **New source areas**: `src/types/wheel.ts`, `src/api/wheels.ts`, `src/stores/wheels.ts`, `src/components/wheel/`, `src/components/design-system/forms/Switch.vue` + `Checkbox.vue`, `src/views/WheelView.vue`. The router and the app-shell header are modified.
- **Backend contract**: `/api/v1/user-wheels` (GET list, POST create, PUT/{id} update with `If-Match`, DELETE/{id} with `If-Match`), bearer-authorized and user-scoped server-side. `RestaurantNames` is a `List<string>` of frozen names.
- **Reuses** the already-loaded restaurant catalog (from `restaurant-offers`) to build the checkbox list; no separate restaurant fetch.
- **No new dependencies.**

## Out of Scope

- The public/shareable link for `isPublic == true` wheels (needs its own backend authorization design, per the backend UserWheel change's own out-of-scope note). `isPublic` is only a saved toggle here, not a working share feature.
