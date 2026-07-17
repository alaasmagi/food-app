## 1. Public wheel API and type

- [x] 1.1 Add a `PublicWheel` interface (`id`, `name`, `restaurantNames`) to `src/types/wheel.ts`
- [x] 1.2 Add `src/api/publicWheels.ts` with `getPublicWheel(id)`: raw `fetch(\`${API_BASE_URL}/api/v1/public/wheels/${id}\`)`, no `Authorization`, no 401 retry; resolve `PublicWheel` on 200, return a not-found result on 404, reject on other non-ok
- [x] 1.3 Add a test for `getPublicWheel` covering: no auth header sent, 200 resolves the DTO, 404 reports not-found, other status rejects

## 2. Share-link behaviour

- [x] 2.1 Add `src/composables/useShareWheelLink.ts` exposing `copyShareLink(wheelId)`: build `window.location.origin + '/w/' + id`, `navigator.clipboard.writeText`, success -> "Link copied" success toast, failure -> danger toast (no throw)
- [x] 2.2 Add a test: stubs `navigator.clipboard.writeText`, asserts the copied URL and the success toast, and asserts a danger toast on rejection without throwing

## 3. Link icon

- [x] 3.1 Add a `link` entry to the `IconName` union and `PATHS` map in `src/components/design-system/Icon.vue` (port a 24x24 stroke link glyph from the design system Icon source)
- [x] 3.2 Extend the Icon smoke test to render the `link` variant without error

## 4. Public shared-wheel view and route

- [x] 4.1 Add `src/views/SharedWheelView.vue`: load via `getPublicWheel(route.params.id)`, show wheel name + `<WheelSpinner :names="restaurantNames" />`, loading state, and a "This wheel isn't available" message on not-found
- [x] 4.2 Add the route `{ path: '/w/:id', name: 'shared-wheel', component: SharedWheelView, meta: { public: true } }` to `src/router/index.ts`
- [x] 4.3 Add a guard test asserting `/w/:id` (meta.public) is allowed without a token fetch, mirroring the existing `/login` public-route test
- [x] 4.4 Add a component test for `SharedWheelView`: renders the spinner for a found wheel; renders the not-found message on 404

## 5. Share affordances in existing wheel UI

- [x] 5.1 In `src/components/wheel/WheelEditorDialog.vue`, show a "Copy share link" `Button` (icon `link`) next to the public `Switch` when `props.wheel?.id` exists and `isPublic` is true; wire it to `copyShareLink(props.wheel.id)`
- [x] 5.2 In `src/views/WheelView.vue`, show an icon-only share `Button` (`icon="link"`, ghost, sm, `aria-label="Copy share link"`) on each card when `wheel.isPublic`; wire it to `copyShareLink(wheel.id)`
- [x] 5.3 Update `src/components/wheel/wheel.test.ts` for the editor share button (shown only for a saved public wheel) and the card share action (shown only when `isPublic`), asserting the copy behaviour is invoked

## 6. Verification

- [x] 6.1 Run `npm run test` and `npm run type-check`; fix any failures
- [x] 6.2 Run `npm run build` to confirm the public route and new modules bundle
- [ ] 6.3 Manually verify in `npm run dev`: a public wheel's "Copy share link" works from both the editor and the card, and opening `/w/:id` in a logged-out context shows the wheel (and the not-found message for a bad id)
