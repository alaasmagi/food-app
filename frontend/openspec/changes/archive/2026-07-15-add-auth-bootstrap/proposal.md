## Why

Nothing else in this frontend can call the backend API without a working auth flow: every later feature (offers, environments, favourites, the wheel) needs a bearer token attached to its requests. This change bootstraps authentication end to end and stands up the minimal app shell that proves the flow works, so subsequent feature changes have a foundation to build on.

## What Changes

- Port the first two design-system primitives into `src/` from `alaasmagi-design-system/`:
  - `Icon` -> `src/components/design-system/Icon.vue`, preserving the `IconName` union type and the 24x24 stroke-icon rendering approach
  - `Button` -> `src/components/design-system/forms/Button.vue`, following its `.d.ts` prop contract and `.prompt.md` variants, with hover/press/focus re-implemented as scoped CSS (not JS handlers)
- Copy the design system's `styles.css` and `tokens/*.css` verbatim into `src/assets/tokens/`, imported once from `main.ts`
- Add a Pinia `auth` store (`src/stores/auth.ts`): in-memory `token`, `currentUser`, `isAuthenticated`, `hasRole(role)`, `login()`, `logout()`, `fetchToken()`
- Add `src/api/account.ts` with `fetchToken()` calling `GET /api/v1/account/token` with `credentials: "include"`
- Add `src/api/client.ts`, the shared fetch wrapper: attaches `Authorization: Bearer <token>` on every call except the token-exchange call, and on a 401 attempts one silent `fetchToken()` retry before surfacing an error
- Add `src/router/` (Vue Router) with a navigation guard that silently fetches a token when the store is empty and redirects (full-page `window.location.href`) to the backend login flow when unauthenticated
- Add `src/views/LoginView.vue` (shown when unauthenticated, one "Log in" Button) and `src/views/DashboardView.vue` (empty placeholder behind the guard)
- Add a minimal app-shell layout (header with app name + logout button using the ported Button and Icon), dark theme only, following the design system's content/copy rules
- Wire up Pinia and Vue Router in `main.ts`, replacing the Vite starter `App.vue`/`HelloWorld.vue` scaffolding
- Add `pinia` and `vue-router` as dependencies

## Capabilities

### New Capabilities
- `design-system-foundation`: token stylesheets imported once at startup, plus the ported `Icon` and `Button` Vue primitives that later features compose. Establishes the porting contract (copy into `src/`, never reference `alaasmagi-design-system/` at runtime).
- `frontend-auth`: backend-brokered authentication - token exchange via `GET /api/v1/account/token`, in-memory Pinia auth store, the shared bearer-attaching fetch wrapper with 401 silent-refresh, and the full-page login/logout navigation flow.
- `app-shell`: Vue Router setup, the authentication navigation guard, the login and placeholder dashboard views, and the minimal dark-theme layout that proves the auth flow works end to end.

### Modified Capabilities
<!-- None - this is the first change in a greenfield frontend; openspec/specs/ is empty. -->

## Impact

- **New source areas**: `src/api/`, `src/stores/`, `src/router/`, `src/views/`, `src/components/design-system/`, `src/assets/tokens/`, and a shell layout component.
- **Removed scaffolding**: the Vite starter `App.vue`, `HelloWorld.vue`, and `style.css` are replaced by the shell + token imports.
- **Dependencies**: adds `pinia` and `vue-router`. No Keycloak client library.
- **Backend contract**: depends on `GET /api/v1/account/token` returning `{ accessToken, expiresAtUtc }` and the backend `account/login` + `account/logout` full-page flows under `api.<domain>`.
- **Configuration**: needs the backend base URL / parent domain available to the app (env var), so the login/logout/token URLs can be constructed.
- **Design system**: first physical port of `Icon`, `Button`, and the token CSS into `src/`; sets the pattern for lazy porting in all later changes.
