## 1. Port design-system primitives

- [x] 1.1 Port `Input` (forms) into `src/components/design-system/forms/Input.tsx` from its `.d.ts` + `.prompt.md` + `.card.html`, wrapping `TextInput`, styled from `src/theme/tokens.ts` (skip if already present)
- [x] 1.2 Port `Tabs` (navigation) into `src/components/design-system/navigation/Tabs.tsx` as a horizontal pressable row, prop names matching the `.d.ts`, styled from tokens
- [x] 1.3 Port `Dialog` (feedback) into `src/components/design-system/feedback/Dialog.tsx` using React Native `Modal`, prop names matching the `.d.ts`, styled from tokens; copy any needed icon assets into the app's own assets (dark set)
- [x] 1.4 Add a smoke test per ported primitive verifying each variant/size renders (`src/components/design-system/__tests__/`)
- [x] 1.5 Verify no source imports from `alaasmagi-design-system/`

## 2. Types and API layer

- [x] 2.1 Add `src/types/environment.ts` with `DiningEnvironment` and `EnvironmentRestaurant` matching the backend Web DTOs (camelCase, `concurrencyToken`, nullable `description`)
- [x] 2.2 Add `src/api/environments.ts` with `getEnvironments`, `createEnvironment`, `updateEnvironment`, `deleteEnvironment`, `getEnvironmentRestaurants`, `addRestaurantToEnvironment`, `removeRestaurantFromEnvironment`, all through `apiFetch`, sending `If-Match` on update and both deletes, unwrapping errors via the shared error handling
- [x] 2.3 Add an api-layer test mocking `apiFetch` that asserts endpoints, methods, bodies, and `If-Match` headers

## 3. React Query hooks and selection store

- [x] 3.1 Add `src/hooks/useEnvironments.ts` (query) with a stable query key
- [x] 3.2 Add `src/hooks/useEnvironmentRestaurants.ts` (query) plus a selector/helper deriving, for a given environment id, a `restaurantId -> { joinId, concurrencyToken }` membership map
- [x] 3.3 Add mutation hooks for create, update, delete, add-membership, remove-membership, each invalidating the affected environments/memberships query keys on success
- [x] 3.4 Add `src/stores/environmentStore.ts` (Zustand) holding the selected environment id (`null` = "All") and a setter; reset selection to `null` when the selected id is no longer in the environments list (reconciled in `useEnvironmentFilteredRestaurants`)
- [x] 3.5 Add hook/store tests mocking the api layer (invalidations fire; membership map derivation; selection reset on missing id)

## 4. Environment tabs and editor dialog

- [x] 4.1 Add `src/components/environment/EnvironmentTabs.tsx` on the ported `Tabs`: fixed "All" tab plus one per environment, wired to the selection store, with an affordance to open the editor dialog
- [x] 4.2 Add `src/components/environment/EnvironmentEditorDialog.tsx` on the ported `Dialog` + `Input`: create, rename, and delete, with an in-dialog delete confirmation step (no native `Alert`/`confirm`); update/delete send `If-Match` from the concurrency token
- [x] 4.3 Add component tests: All + per-environment tabs render and select; create/rename call the right mutations; delete requires the in-dialog confirmation step before the delete mutation

## 5. Restaurant card membership action

- [x] 5.1 Add an "Add to / Remove from environment" action to `RestaurantCard`, shown only when a specific environment (not "All") is selected, reflecting current membership from the derived map
- [x] 5.2 Wire the action to the add mutation (not a member) and the remove mutation (a member, using the join row id + concurrency token)
- [x] 5.3 Add tests: action hidden on "All"; shows "Add" when not a member and "Remove" when a member; each triggers the correct mutation

## 6. Wire filtering into Dashboard and Map

- [x] 6.1 Render `EnvironmentTabs` above the list in `app/(tabs)/index.tsx` and filter the displayed restaurants client-side by the selected environment's membership map (full catalog when "All"), with an empty-environment empty state
- [x] 6.2 Render `EnvironmentTabs` in `app/(tabs)/map.tsx` and narrow `RestaurantMap`'s restaurant set by the same selection before the existing coordinate filter, issuing no extra restaurants fetch
- [x] 6.3 Add/extend screen tests: Dashboard and Map filter by selection without refetching restaurants; switching on one screen is reflected on the other via the shared store

## 7. Verify

- [x] 7.1 Run the test suite and TypeScript strict typecheck; fix failures
- [x] 7.2 Run `openspec validate add-dining-environments` and confirm it passes
