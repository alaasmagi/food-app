## 1. Design-system primitives

- [x] 1.1 Port `Switch` to `src/components/design-system/forms/Switch.vue` from its `.d.ts` + `.prompt.md` + `.card.html` (+ `.jsx`): `label`, `disabled`, `v-model` boolean; accent track when on, thumb, and disabled states as scoped CSS using only `var(--token-name)`
- [x] 1.2 Port `Checkbox` to `src/components/design-system/forms/Checkbox.vue`: `label`, `disabled`, `v-model` boolean; accent-filled checked state + hover/disabled as scoped CSS
- [x] 1.3 Add smoke tests (Vitest + Vue Test Utils): each of `Switch`/`Checkbox` toggles via `v-model` on activation and respects `disabled`; checked/on state renders

## 2. Types and API layer

- [x] 2.1 Add `src/types/wheel.ts`: `UserWheel` (id, concurrencyToken, name, restaurantNames `string[]`, isPublic) matching `UserWheelDto`
- [x] 2.2 Add `src/api/wheels.ts` through the shared `apiFetch` against `/api/v1/user-wheels`: `getWheels()`, `createWheel(name, restaurantNames, isPublic)` (POST), `updateWheel(id, input, concurrencyToken)` (PUT, If-Match), `deleteWheel(id, concurrencyToken)` (DELETE, If-Match)

## 3. Wheels store

- [x] 3.1 Add `src/stores/wheels.ts` (Pinia): `list: UserWheel[]` loaded once (`loadWheels()`), and `createWheel`/`updateWheel`/`deleteWheel` actions keeping the list in sync (If-Match from the stored token on update/delete)

## 4. Wheel components

- [x] 4.1 Add `src/components/wheel/WheelEditorDialog.vue` (`Dialog` + `Input` name + searchable `Checkbox` list over the loaded catalog + `Switch` for isPublic): track checked restaurant ids, filter rows by a search `Input`, and on save resolve checked ids to their `name` values (frozen snapshot) and call the store's create/update; require at least 2 checked restaurants to save; surface errors via a toast
- [x] 4.2 Add `src/components/wheel/WheelSpinner.vue`: bespoke SVG wheel, one segment per name, colors cycled from `var(--token-name)` values only (no hardcoded colors); `spin()` picks a random index client-side, rotates via a CSS transform/transition to land that segment under the pointer, and emits the chosen name on `transitionend`; disable spin when fewer than 2 names

## 5. View and routing

- [x] 5.1 Add `src/views/WheelView.vue` on `/wheel`: load wheels and the restaurant catalog on mount; render a `Card` per wheel with "Spin", "Edit", "Delete" actions; selecting a wheel shows its `WheelSpinner`; "New wheel" opens `WheelEditorDialog`; sentence-case copy, no exclamation points/em-dashes/emoji, digits not spelled numbers
- [x] 5.2 Register the guarded `/wheel` route in `src/router/index.ts` and add primary nav links (Dashboard, Wheel) to the shell header in `src/components/layout/AppShell.vue` using `RouterLink`

## 6. Tests

- [x] 6.1 Add store tests: `loadWheels` fetches once; `createWheel`/`updateWheel`/`deleteWheel` keep the list in sync and send If-Match on update/delete
- [x] 6.2 Add component tests: `WheelEditorDialog` blocks save under 2 checks and saves the checked restaurants' names (not ids) with the isPublic switch; `WheelSpinner` renders one segment per name and `spin()` emits a name from the list; `WheelView` lists wheels and opens the editor on "New wheel"

## 7. Verification

- [x] 7.1 Run `vue-tsc`/`vite build` and the Vitest suite; confirm type-check, build, and all tests pass
- [x] 7.2 Grep `src/` for any import/`@import`/relative path into `alaasmagi-design-system/` and confirm there are none; confirm `WheelSpinner` uses only `var(--...)` colors (no hardcoded hex/rgb)
