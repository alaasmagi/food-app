## Why

The web frontend currently authenticates through a backend-for-frontend (BFF) bridge: login/logout are full-page navigations to the backend, and the SPA exchanges a backend HttpOnly cookie for a bearer token via `GET /api/v1/account/token`. The mobile client, by contrast, talks to Keycloak directly (Authorization Code + PKCE) and sends the resulting JWT to the same backend API. This change aligns the web client with the mobile client so both obtain their JWT directly from Keycloak, and reduces the backend to a pure JWT resource server for the frontend — removing the cookie-exchange endpoint and the credentialed-CORS/return-url plumbing that only existed to serve the SPA.

## What Changes

- **BREAKING**: The web frontend no longer uses the backend cookie bridge. `login()`/`logout()` and token acquisition move from the backend endpoints to Keycloak directly.
- Add the official `keycloak-js` adapter as a dependency and initialize it once at app startup.
- Run the Authorization Code + PKCE flow directly against Keycloak to obtain the JWT access token; send it to the backend API exactly as today (`Authorization: Bearer <token>`).
- Re-establish the session on full page reload via **silent SSO** (`check-sso` / `prompt=none` against Keycloak's own SSO session cookie). Tokens stay **in memory only** — never written to `localStorage`/`sessionStorage`, preserving today's security posture.
- Rewrite `stores/auth.ts`: `login()`/`logout()` drive Keycloak; the silent token acquisition/refresh replaces the cookie exchange. The public store surface (`token`, `currentUser`, `isAuthenticated`, `hasRole`, `roles`, `fetchCurrentUser`, `setCurrentUser`) stays stable for callers; realm-role decoding is unchanged.
- Replace `config.ts` `loginUrl`/`logoutUrl`/`TOKEN_URL` with Keycloak authority/issuer, `clientId`, and redirect config sourced from `VITE_` env vars.
- Update `api/client.ts` 401-retry and the router `authGuard` to refresh via Keycloak instead of the cookie exchange.
- Remove the cookie-exchange `fetchToken()` and its `credentials: "include"` request from `api/account.ts`; this becomes an app with **no** credentialed requests at all.

Out of scope (separate backend change): retiring `GET /api/v1/account/token`, the frontend return-url validation, and the credentialed CORS policy, while keeping the OIDC cookie for the MVC admin console and the existing JWT bearer validation for the API.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `frontend-auth`: Session tokens are now obtained directly from Keycloak via Authorization Code + PKCE using `keycloak-js`, with silent SSO for reload re-establishment, rather than exchanged from a backend cookie. The "backend cookie token exchange" and "login/logout are full-page navigations to the backend" requirements are replaced; the in-memory-only token requirement is retained.

## Impact

- Affected code: `src/stores/auth.ts`, `src/api/account.ts`, `src/api/client.ts`, `src/config.ts`, `src/router/index.ts`, `src/main.ts` (Keycloak init), a new OAuth callback handling path, and their tests.
- New dependency: `keycloak-js`.
- New env vars: Keycloak authority/URL, realm, `clientId`, and redirect URI (`VITE_*`); `VITE_API_BASE_URL` is retained for API calls but no longer used for auth endpoints.
- Backend (separate change): removal of the token-exchange endpoint, the frontend return-url guard, and the credentialed CORS policy.
- Deployment/infra: a Keycloak public client (PKCE, no secret) for the web origin, with the SPA redirect URI and web-origin allowed for CORS on Keycloak's side.
- Project doctrine: `openspec/config.yaml` "Auth rules" (currently "this app never talks to Keycloak directly", "no keycloak-js") are now superseded and must be updated to describe the direct-to-Keycloak model.
