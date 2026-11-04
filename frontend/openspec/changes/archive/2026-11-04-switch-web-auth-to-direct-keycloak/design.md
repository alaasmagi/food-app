## Context

The web SPA authenticates through a backend-for-frontend (BFF) bridge: `login()`/`logout()` full-page navigate to the backend (`/account/login`, `/account/logout`), the backend runs the OIDC code flow with Keycloak and sets an HttpOnly cookie, and the SPA exchanges that cookie for an in-memory bearer token via `GET /api/v1/account/token` (`credentials: "include"`). All other API calls already send `Authorization: Bearer <token>` to a backend that validates JWTs.

The mobile client instead runs Authorization Code + PKCE directly against Keycloak and sends the resulting JWT to the same backend. This change moves the web client to the same direct model, using the official `keycloak-js` adapter. The backend's JWT resource-server behavior is unchanged; only the cookie bridge is removed (in a separate backend change). The OIDC cookie scheme remains on the backend for the MVC admin console.

Constraint carried over from today: the access token lives in memory only, never in `localStorage`/`sessionStorage`, and the session is silently re-established on a full page reload — previously from the backend cookie, now from Keycloak's own SSO session cookie.

## Goals / Non-Goals

**Goals:**
- Web SPA obtains its JWT directly from Keycloak via Authorization Code + PKCE using `keycloak-js`.
- Full page reload silently re-establishes the session via silent SSO (`check-sso` / `prompt=none`) with no visible login prompt when the Keycloak session is still valid.
- No tokens are persisted to web storage; token stays in memory only.
- The public `auth` store surface (`token`, `currentUser`, `isAuthenticated`, `roles`, `hasRole`, `fetchCurrentUser`, `setCurrentUser`, `login`, `logout`) stays stable so feature code and existing tests need no behavioral change beyond auth internals.
- Remove the last credentialed request from the app; nothing uses `credentials: "include"` anymore.

**Non-Goals:**
- Backend teardown of `GET /api/v1/account/token`, the return-url guard, and the credentialed CORS policy — handled by a separate backend change.
- Changing the backend JWT validation, the admin MVC console, or any non-auth API behavior.
- Persisting refresh tokens or building a "remember me" beyond what the Keycloak SSO session already provides.
- Light-mode or any UI redesign of the login view.

## Decisions

### Decision: Use `keycloak-js` as the OIDC adapter
The official adapter handles PKCE, token storage in memory, token refresh, and the silent `check-sso` iframe flow out of the box, minimizing hand-rolled crypto and matching Keycloak's own recommended integration.

- **Alternatives considered:** `oidc-client-ts` (provider-agnostic, but we only target Keycloak and would re-implement Keycloak-specific silent-SSO wiring); hand-rolled PKCE like mobile (maximum control, but the largest surface to get wrong for a browser app, and browsers lack mobile's secure-store so the trade-offs differ).

### Decision: Silent SSO for reload re-establishment, no token persistence
Initialize with `onLoad: 'check-sso'` and a `silentCheckSsoRedirectUri` pointing at a minimal static HTML page (`public/silent-check-sso.html`) that re-posts the result to the app. On reload, `keycloak-js` runs a hidden iframe request with `prompt=none` against Keycloak's SSO session cookie; if the session is alive the app gets a fresh token silently, otherwise it lands unauthenticated and the guard redirects to login. Tokens remain only in `keycloak-js` in-memory state, mirrored into the Pinia store — never written to web storage.

- **Alternatives considered:** persisting the refresh token in `localStorage` (simpler, mirrors mobile, but exposes a long-lived token to any XSS — strictly weaker than today's posture and rejected).

### Decision: Keep the `auth` store as the single source of truth for the app; `keycloak-js` sits behind it
A module-level singleton holds the `Keycloak` instance and is initialized once from `main.ts` before the app mounts. `stores/auth.ts` wraps it: `login()` calls `keycloak.login({ redirectUri })`, `logout()` calls `keycloak.logout({ redirectUri })` after clearing in-memory state, and the silent token acquisition/refresh replaces the old cookie `fetchToken()`. `setSession()` continues to derive `roles` from the access token via the existing `decodeRoles()` (Keycloak `realm_access.roles`), so admin gating is unchanged. Components keep consuming the store, not `keycloak-js` directly.

- **Alternatives considered:** exposing `keycloak-js` directly to components (spreads the dependency across the codebase and breaks the stable store surface).

### Decision: 401 refresh path uses `keycloak.updateToken()`
`api/client.ts` keeps its "refresh once, retry once, else fail" shape, but the refresh step calls `keycloak.updateToken(minValidity)` (which refreshes against Keycloak using the in-memory refresh token, or silently via SSO) instead of the cookie exchange. On refresh failure the session is treated as expired and the login flow is triggered. The router `authGuard` similarly triggers a silent `updateToken`/init check before deciding.

### Decision: Configuration moves to Keycloak `VITE_` env vars
`config.ts` drops `loginUrl`, `logoutUrl`, and `TOKEN_URL`, and gains Keycloak `url` (authority), `realm`, and `clientId` from `VITE_KEYCLOAK_URL`, `VITE_KEYCLOAK_REALM`, `VITE_KEYCLOAK_CLIENT_ID`. `VITE_API_BASE_URL` is retained for API calls. The redirect URI is derived from `window.location.origin` plus the app's callback path, so no separate URL builder is needed. `.env.example` and the dev guard are updated accordingly.

### Decision: Callback handling is a keycloak-js concern, not a dedicated route component
`keycloak-js` completes the code exchange on the redirect back to the app origin by reading the URL fragment/query during `init()`, then cleans the URL. So the "OAuth callback path" is handled by initializing Keycloak before the router mounts rather than by a bespoke `/oauth/callback` view; `silent-check-sso.html` is the only new static asset. This keeps existing routes (`/login`, `/`, `/wheel`, `/settings`, `/w/:id`) intact.

## Risks / Trade-offs

- **Silent SSO iframe blocked by third-party-cookie restrictions** (Safari ITP, browsers phasing out third-party cookies) → the SPA and Keycloak should share a common parent domain so the KC session cookie is first-party in the iframe; document the Keycloak client `Web Origins`/redirect config. If silent SSO fails, the app degrades to an explicit login redirect rather than breaking — no worse than an expired session today.
- **Keycloak public client misconfiguration** (missing redirect URI or Web Origin) → login/refresh fail in a hard-to-diagnose way. Mitigation: enumerate the required Keycloak client settings in tasks and `.env.example`; verify against a real Keycloak in the verify step.
- **Token now visible to the SPA's JS at all times** (as opposed to the short-lived exchanged token before) → this is inherent to the direct model; mitigated by keeping tokens in memory only, no persistence, and short access-token lifetimes on the Keycloak client.
- **Store surface drift breaking feature code/tests** → keep the public store API identical; changes are internal to `auth.ts`/`account.ts`/`client.ts`. The `authGuard` and `client` tests are updated to mock `keycloak-js` instead of the cookie `fetchToken`.
- **Coordinated deploy with the backend change** → until the backend removes the cookie endpoint it can coexist; the frontend simply stops calling it. Order is not strict, but the Keycloak public client must exist before the frontend deploy. Rollback = redeploy the previous frontend build (which uses the cookie bridge) since the backend keeps the endpoint until its own change ships.

## Open Questions

- Exact Keycloak `clientId` for the web public client and whether it is shared with or distinct from the mobile client (recommend distinct: different redirect URIs and origins).
- Access-token lifetime to configure on the web client (shorter is better given in-JS exposure).
- Whether any admin-only web views exist today that rely on `hasRole('admin')`, to confirm role gating is exercised end-to-end after the switch.
