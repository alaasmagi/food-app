## Why

Users can mark a wheel public but have no way to hand it to someone: there is no shareable link and no page a logged-out visitor can open. This change adds a copy-link affordance for public wheels and a public shared-wheel view that renders the wheel without requiring authentication.

## What Changes

- Add `src/api/publicWheels.ts` with `getPublicWheel(id)` calling `GET /api/v1/public/wheels/{id}`. This call bypasses the authenticated `apiFetch` wrapper (no `Authorization` header, no token-refresh retry), mirroring the existing raw-`fetch` pattern in `account.ts`, so it works for a logged-out visitor. It returns a public wheel DTO (`id`, `name`, `restaurantNames`) and reports "not found" distinctly for a 404.
- Add `src/views/SharedWheelView.vue` on a new public route `/w/:id`. It shows the wheel's name and the existing `WheelSpinner` (fed `restaurantNames`). On 404 it shows a simple "This wheel isn't available" message rather than a generic error page.
- Mark the `/w/:id` route public so the auth navigation guard skips it. The router already gates on a `meta.public` flag (only `/login` uses it today); the shared route sets `meta: { public: true }`, which also renders it chrome-free (App.vue omits `AppShell` for public routes) while keeping `ToastHost` mounted.
- Add a reusable share-link behaviour (a small composable) that builds the link from the running origin (`window.location.origin + '/w/' + id`), copies it to the clipboard via `navigator.clipboard`, and pushes a "Link copied" success toast. There is no existing clipboard helper, and this behaviour is used in two places, so it is factored into one composable.
- `src/components/wheel/WheelEditorDialog.vue`: when a saved wheel has `isPublic` on, show a "Copy share link" `Button` next to the public `Switch`, wired to the share-link behaviour. (A brand-new unsaved wheel has no id yet, so the button appears only once the wheel exists.)
- `src/views/WheelView.vue`: each wheel `Card` whose `isPublic` is true shows a small share action (the same copy-link behaviour) so users can copy a link without reopening the editor.
- Add a `link` icon to `src/components/design-system/Icon.vue` (the current `IconName` set has no link/share/copy glyph) for the share affordances.

## Capabilities

### New Capabilities
- `wheel-sharing`: public shared-wheel access — an unauthenticated public wheel API call, a public `/w/:id` view that renders the wheel for logged-out visitors with a friendly not-found state, and a reusable copy-share-link behaviour.

### Modified Capabilities
- `user-wheel`: the wheel editor dialog gains a "Copy share link" action for saved public wheels, and the wheel view gains a per-card share action for public wheels, both reusing the share-link behaviour.

## Impact

- Dependencies: none added. Uses the browser Clipboard API.
- Code: new `src/api/publicWheels.ts`, `src/views/SharedWheelView.vue`, a share-link composable (e.g. `src/composables/useShareWheelLink.ts`); a new public DTO type (`PublicWheel`); a route added to `src/router/index.ts`; edits to `WheelEditorDialog.vue` and `WheelView.vue`; a `link` icon added to `Icon.vue`.
- Data model: no backend or DTO change; consumes the existing public wheel endpoint and the `isPublic` field already on `UserWheel`.
- Tests: new tests for the public API call (bypasses auth, 404 handling), the shared view (renders spinner, not-found state), the public route being guard-exempt, and the share-link behaviour; updated wheel editor/view tests for the share actions.
