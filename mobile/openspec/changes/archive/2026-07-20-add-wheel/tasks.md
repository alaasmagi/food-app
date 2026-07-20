## 1. Port Switch and Checkbox primitives

- [x] 1.1 Port `Switch` (forms) into `src/components/design-system/forms/Switch.tsx`: a Pressable row with a track + thumb positioned by `checked`, props `checked`/`defaultChecked`/`onChange(checked)`/`disabled`/`label`, styled from tokens
- [x] 1.2 Port `Checkbox` (forms) into `src/components/design-system/forms/Checkbox.tsx`: a Pressable box rendering the ported `Icon` check when checked, same prop shape, styled from tokens
- [x] 1.3 Add smoke tests per primitive: renders, reports the new value via `onChange` (checked/unchecked), respects `disabled`
- [x] 1.4 Verify no source imports from `alaasmagi-design-system/`

## 2. Types and API layers

- [x] 2.1 Add `src/types/wheel.ts` with `UserWheel` (`id`, `concurrencyToken`, `name`, `restaurantNames`, `isPublic`) and minimal `PublicWheel` (`name`, `restaurantNames`)
- [x] 2.2 Add `src/api/wheels.ts` with `getWheels`, `createWheel`, `updateWheel`, `deleteWheel` through `apiFetch` against `/api/v1/user-wheels`, sending `If-Match` on update and delete, unwrapping errors
- [x] 2.3 Add `src/api/publicWheels.ts` with `getPublicWheel(id)` on `publicFetch` (no bearer, no refresh): `PublicWheel` on 200, `null` on 404, reject otherwise
- [x] 2.4 Add api-layer tests: wheels endpoints/methods/bodies/`If-Match`; public wheel omits Authorization, returns null on 404, rejects on other errors

## 3. Hooks and share-link behaviour

- [x] 3.1 Add `src/hooks/useWheels.ts` (query) with a stable query key
- [x] 3.2 Add wheel mutation hooks (create/update/delete) invalidating the wheels query on success; update/delete pass `If-Match` from the wheel's token
- [x] 3.3 Add a public-wheel query hook wrapping `getPublicWheel(id)` for the shared route (enabled by id; handles the null not-found result)
- [x] 3.4 Add `webAppBaseUrl` to `src/config/env.ts` (from `app.json` extra, with a fallback) and `src/hooks/useShareWheelLink.ts` building `<webAppBaseUrl>/w/<id>`, copying via `expo-clipboard`, toasting success/danger without throwing (add the `expo-clipboard` dependency)
- [x] 3.5 Add hook tests mocking the api/clipboard: wheel mutations invalidate the query; `copyShareLink` writes the link and toasts success, toasts danger on failure

## 4. WheelSpinner

- [x] 4.1 Add `src/components/wheel/WheelSpinner.tsx`: `react-native-svg` segments (one per name, token-cycled palette) in an `Animated`-rotated rotor with a static pointer/hub overlay; `spin()` picks a random name client-side, animates, and reports the result via a callback; disabled under 2 names with a hint
- [x] 4.2 Add tests: renders a segment per name; spin is disabled with < 2 names; spinning reports one of the wheel's names (mock the random source or assert the reported value is a member of `names`)

## 5. WheelEditorDialog

- [x] 5.1 Add `src/components/wheel/WheelEditorDialog.tsx` on `Dialog` + `Input` (name) + searchable `Checkbox` list over cached `useRestaurants()` (no extra fetch) + `isPublic` `Switch`; seed fields from the edited wheel; collect checked restaurants' `name` values into `restaurantNames`
- [x] 5.2 Save via the create/update mutations (update sends `If-Match`); show a "Copy share link" action only when editing a saved wheel whose `isPublic` is on (via `useShareWheelLink`)
- [x] 5.3 Add tests: search filters the checkbox list; saving builds `restaurantNames` from checked names + `isPublic`; share action shown only for a saved public wheel and hidden for an unsaved one

## 6. Wheel tab screen

- [x] 6.1 Replace `app/(tabs)/wheel.tsx` with a list of saved wheels (a `Card` per wheel with Spin/Edit/Delete, plus a Share action when `isPublic`), a "New wheel" action opening the editor, and selecting a wheel shows its `WheelSpinner`; Delete sends `If-Match`
- [x] 6.2 Add screen tests: lists wheels with actions; New wheel opens the editor; selecting a wheel shows the spinner; public wheels show a Share action and non-public wheels do not

## 7. Public shared-wheel route and auth-gate exemption

- [x] 7.1 Add `app/w/[id].tsx`: load the wheel via the public-wheel query, show its name + `WheelSpinner`; on not-found show "This wheel isn't available"; render outside the tab shell
- [x] 7.2 Exempt `w/[id]` from the auth gate in `app/_layout.tsx` (skip redirect when `segments[0] === 'w'`)
- [x] 7.3 Add tests: shared route shows name + spinner for a found wheel and the not-available message on 404; the gate does not redirect on the `w` segment when unauthenticated

## 8. Verify

- [x] 8.1 Run the test suite and TypeScript strict typecheck; fix failures
- [x] 8.2 Run `openspec validate add-wheel` and confirm it passes
