## 1. Dependencies and configuration

- [x] 1.1 Add `keycloak-js` to `package.json` and install
- [x] 1.2 Rewrite `src/config.ts`: remove `loginUrl`, `logoutUrl`, `TOKEN_URL`; add `VITE_KEYCLOAK_URL`, `VITE_KEYCLOAK_REALM`, `VITE_KEYCLOAK_CLIENT_ID` (with the existing DEV missing-var guard); keep `API_BASE_URL`
- [x] 1.3 Update `.env.example` (and any `.env`/deploy notes) with the new Keycloak vars and document the required Keycloak public client (PKCE, redirect URI = app origin, Web Origins = app origin, silent-check-sso redirect URI)
- [x] 1.4 Add `public/silent-check-sso.html` (minimal page that reposts the auth result to the parent window) for silent SSO

## 2. Keycloak adapter wiring

- [x] 2.1 Create a module-level `keycloak-js` singleton (e.g. `src/auth/keycloak.ts`) exposing `initKeycloak()` (with `onLoad: 'check-sso'`, `pkceMethod: 'S256'`, `silentCheckSsoRedirectUri`), plus `login`, `logout`, `updateToken`, and current-token accessors
- [x] 2.2 In `src/main.ts`, `await initKeycloak()` before mounting the app so the callback/silent-SSO result is resolved before routing

## 3. Auth store

- [x] 3.1 Rewrite `src/stores/auth.ts` internals to source the token/expiry/roles from the Keycloak singleton via `setSession()`, keeping `decodeRoles()` (`realm_access.roles`) and the public surface (`token`, `expiresAtUtc`, `currentUser`, `roles`, `isAuthenticated`, `hasRole`, `fetchToken`, `fetchCurrentUser`, `setCurrentUser`, `login`, `logout`) unchanged
- [x] 3.2 Reimplement `login()` as `keycloak.login({ redirectUri })` (resolving `returnTo` to an in-app route) and `logout()` to clear in-memory state then `keycloak.logout({ redirectUri: /login })`
- [x] 3.3 Reimplement `fetchToken()` to refresh/acquire via `keycloak.updateToken()` (silent SSO), keeping the concurrent-call de-duplication and returning whether authenticated

## 4. API client and router

- [x] 4.1 Remove `fetchToken()` and its `credentials: "include"` request and `TokenExchangeError` from `src/api/account.ts`; keep `getCurrentUser()` and `updateNotificationPreferences()`
- [x] 4.2 Update `src/api/client.ts` 401-retry to refresh via the auth store's Keycloak-backed `fetchToken()`/`updateToken()`; confirm no request sets `credentials: "include"` or a CSRF header
- [x] 4.3 Update `src/router/index.ts` `authGuard` to trigger the silent Keycloak refresh when the store is empty, then allow/redirect based on `isAuthenticated` (no behavioral change to route table)

## 5. Tests

- [x] 5.1 Update `src/router/authGuard.test.ts` to mock the Keycloak-backed auth store instead of the cookie `fetchToken`
- [x] 5.2 Add/adjust auth store tests: silent re-establish success and failure, `login`/`logout` call the Keycloak adapter, roles decoded from the token, token never written to `localStorage`/`sessionStorage`
- [x] 5.3 Update `src/api/client` tests: bearer attached, 401 → single Keycloak refresh + retry, refresh failure surfaces error; assert no credentialed requests remain

## 6. Doctrine and verification

- [x] 6.1 Update `openspec/config.yaml` "Auth rules" (and the "no Keycloak client library" tech-stack line) to describe the direct-to-Keycloak / `keycloak-js` / silent-SSO model
- [x] 6.2 Run `npm run test` and `npm run build`/typecheck; fix fallout from the removed cookie exchange
- [ ] 6.3 Verify end-to-end against a real Keycloak: fresh login (PKCE), protected-route access, full page reload re-establishes silently, 401 refresh, and logout ends the Keycloak session. (Blocked on provisioning the `food-app-web` public client in the realm. Build + preview verified: app boots, `silent-check-sso.html` is served. Live OAuth roundtrip is a deploy-time check.)
