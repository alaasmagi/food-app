## 1. Design-system primitives

- [x] 1.1 Port `Input` to `src/components/design-system/forms/Input.vue` from its `.d.ts` + `.prompt.md` + `.card.html` (+ `.jsx`): `label`, `placeholder`, `icon` (ported `Icon`), `hint`, `error` (overrides `hint`), `disabled`, `size` ("sm" | "md"), `multiline`/`rows` (renders `<textarea>`), `type`; `v-model` (`modelValue` + `update:modelValue`); focus/error/disabled states as scoped CSS using only `var(--token-name)`
- [x] 1.2 Port `Tabs` to `src/components/design-system/navigation/Tabs.vue`: `tabs: { value, label }[]`, `v-model` selection, active underline indicator + hover as scoped CSS
- [x] 1.3 Port `Dialog` to `src/components/design-system/feedback/Dialog.vue`: `open` prop, `close` emit, `title` prop, default body slot, `footer` slot, `width` prop; overlay + open/close transition via Vue `<Transition>`/CSS; renders nothing when closed
- [x] 1.4 Add smoke tests (Vitest + Vue Test Utils): `Input` emits `update:modelValue` on typing and renders a `<textarea>` when `multiline`; `Tabs` emits `update:modelValue` on tab activation; `Dialog` renders slots when `open` and nothing when closed, emits `close`

## 2. Types and API layer

- [x] 2.1 Add `src/types/environment.ts`: `DiningEnvironment` (id, concurrencyToken, name, description `string | null`) matching `DiningEnvironmentDto`; `EnvironmentRestaurant` (id, concurrencyToken, environmentId, restaurantId) matching `EnvironmentRestaurantDto`
- [x] 2.2 Add `src/api/environments.ts` through the shared `apiFetch`: `getEnvironments()`, `createEnvironment(input)`, `updateEnvironment(id, input, concurrencyToken)` (If-Match), `deleteEnvironment(id, concurrencyToken)` (If-Match), `getEnvironmentRestaurants()`, `addRestaurantToEnvironment(environmentId, restaurantId)` (POST `/environment-restaurants`, returns the join row), `removeRestaurantFromEnvironment(joinId, concurrencyToken)` (DELETE `/environment-restaurants/{joinId}`, If-Match)

## 3. Environments store

- [x] 3.1 Add `src/stores/environments.ts` (Pinia): `list: DiningEnvironment[]`, `selectedEnvironmentId: string | null` (null = "all"), and `membershipByEnv: Record<envId, Record<restaurantId, { joinId, concurrencyToken }>>`; `loadEnvironments()` and `loadMembership()` (from `getEnvironmentRestaurants()`), `selectEnvironment(id | null)`, `isMember(restaurantId)` against the selected environment
- [x] 3.2 Add store mutations wired to the API: `createEnvironment`/`renameEnvironment`/`deleteEnvironment` (keeping `list` in sync, If-Match from stored token) and `addRestaurant(restaurantId)`/`removeRestaurant(restaurantId)` for the selected environment (update `membershipByEnv` from the created join row / after delete; per-restaurant pending guard to avoid double submits)

## 4. Environment components

- [x] 4.1 Add `src/components/environment/EnvironmentTabs.vue` (ported `Tabs`): a fixed "All" tab plus one per environment; bound to the store's `selectedEnvironmentId` via `v-model`; horizontal scroll when the row overflows
- [x] 4.2 Add `src/components/environment/EnvironmentEditorDialog.vue` (ported `Dialog` + `Input`): create, rename, and delete an environment; delete uses a two-step in-dialog confirmation (`confirmingDelete` flag), never a browser `confirm()`; surfaces a 403/409 error inline

## 5. Dashboard integration

- [x] 5.1 Modify `src/components/restaurant/RestaurantCard.vue`: when a specific environment (not "All") is selected, show an "Add to environment" or "Remove from environment" `Button` reflecting `isMember`, calling the store's `addRestaurant`/`removeRestaurant`; hidden under "All"
- [x] 5.2 Modify `src/views/DashboardView.vue`: load environments + membership on mount; render `EnvironmentTabs` above the list; filter the loaded catalog by the selected environment's membership client-side (no restaurant refetch); add a "Manage environments" entry point opening `EnvironmentEditorDialog`

## 6. Tests

- [x] 6.1 Add store tests: `loadMembership` indexes join rows into per-environment maps; `isMember` reflects the selected environment; `addRestaurant` records `{ joinId, concurrencyToken }` from the response and `removeRestaurant` deletes it by join id with If-Match; update/delete send If-Match
- [x] 6.2 Add component tests: `EnvironmentTabs` selects an environment via `v-model`; `EnvironmentEditorDialog` requires the in-dialog confirm before delete; `RestaurantCard` shows the membership action only under a specific environment and toggles it

## 7. Verification

- [x] 7.1 Run `vue-tsc`/`vite build` and the Vitest suite; confirm type-check, build, and all tests pass
- [x] 7.2 Grep `src/` for any import/`@import`/relative path into `alaasmagi-design-system/` and confirm there are none
