## ADDED Requirements

### Requirement: Direct Keycloak authentication via keycloak-js

The application SHALL authenticate directly against Keycloak using the official `keycloak-js` adapter running the OpenID Connect Authorization Code flow with PKCE. A single `Keycloak` instance SHALL be created and initialized once at app startup (before the app mounts) from configuration provided via `VITE_KEYCLOAK_URL`, `VITE_KEYCLOAK_REALM`, and `VITE_KEYCLOAK_CLIENT_ID`. The resulting JWT access token SHALL be sent to the backend API as `Authorization: Bearer <token>`, exactly as the backend already expects. The application SHALL NOT contact the backend for login, logout, or token acquisition.

#### Scenario: Keycloak initialized at startup

- **WHEN** the app starts
- **THEN** a single `keycloak-js` instance is initialized with the configured authority, realm, and client id before the router mounts, and no request is made to any backend auth endpoint

#### Scenario: Access token comes from Keycloak

- **WHEN** the user is authenticated and any API call other than an auth flow is made
- **THEN** the request carries `Authorization: Bearer <token>` where the token was issued by Keycloak, not exchanged from a backend cookie

### Requirement: Session re-established on reload via silent SSO

On a full page reload the application SHALL attempt to silently re-establish the session against Keycloak's own SSO session using `check-sso` / `prompt=none` (via a `silentCheckSsoRedirectUri` static page), with no visible login prompt. If the Keycloak SSO session is still valid the token SHALL be re-acquired silently; otherwise the app SHALL be treated as unauthenticated and the navigation guard SHALL redirect to the login flow. Tokens SHALL remain in memory only and SHALL NEVER be written to `localStorage` or `sessionStorage`.

#### Scenario: Silent re-establish on reload

- **WHEN** the app is reloaded and the Keycloak SSO session is still valid
- **THEN** the access token is re-acquired silently with no visible login prompt and `isAuthenticated` becomes true

#### Scenario: SSO session absent on reload

- **WHEN** the app is reloaded and no valid Keycloak SSO session exists
- **THEN** the app is unauthenticated and the guard redirects a protected route to the login view

#### Scenario: Token is not persisted

- **WHEN** the token has been set and the page is fully reloaded
- **THEN** the previous in-memory token is gone and no copy exists in `localStorage` or `sessionStorage`

## MODIFIED Requirements

### Requirement: Auth store holds session state in memory only

The application SHALL provide a Pinia `auth` store exposing `token`, `currentUser`, `isAuthenticated`, `roles`, and `hasRole(role)`, plus `login()`, `logout()`, `fetchToken()`, `fetchCurrentUser()`, and `setCurrentUser()` actions. The token SHALL be obtained from Keycloak (see the direct Keycloak authentication requirement) and stored in memory only, never written to `localStorage` or `sessionStorage`, so it does not survive a full page reload by design. `roles` SHALL be derived from the Keycloak access token's `realm_access.roles` claim. `currentUser` SHALL be populated by `fetchCurrentUser()` (from `GET /api/v1/account/me`) and MAY be refreshed after a preferences update; it carries `sendNotifications` and `notificationEnvironmentId`.

#### Scenario: Authenticated state reflects a present token

- **WHEN** the store holds a non-expired `token` and a `currentUser`
- **THEN** `isAuthenticated` is true

#### Scenario: Unauthenticated by default

- **WHEN** the app first loads before any token has been acquired
- **THEN** `token` is empty and `isAuthenticated` is false

#### Scenario: Current user populated on demand

- **WHEN** `fetchCurrentUser()` is called while authenticated
- **THEN** `currentUser` is populated from `GET /api/v1/account/me`, including `sendNotifications` and `notificationEnvironmentId`

#### Scenario: Role check for gated views

- **WHEN** `hasRole("admin")` is called and the current user's Keycloak token carries the admin realm role
- **THEN** it returns true; otherwise it returns false

### Requirement: Shared fetch wrapper attaches the bearer token

The application SHALL provide `src/api/client.ts`, a shared fetch wrapper through which all API calls pass. It SHALL attach `Authorization: Bearer <token>` from the auth store on every call, and SHALL NOT set `credentials: "include"` or any CSRF header on any call. No request in the application SHALL use `credentials: "include"`.

#### Scenario: Bearer attached to normal calls

- **WHEN** any API call is made through the wrapper
- **THEN** the request carries `Authorization: Bearer <token>` and does not send credentials or a CSRF header

#### Scenario: Silent refresh on 401

- **WHEN** an API call through the wrapper returns 401
- **THEN** the wrapper silently refreshes the token via Keycloak (`updateToken`) once and retries the original request before surfacing an error

#### Scenario: Refresh also fails

- **WHEN** the Keycloak token refresh itself fails
- **THEN** the wrapper surfaces the error and the session is treated as expired, triggering the login flow

### Requirement: Login and logout drive Keycloak directly

The application SHALL implement `login()` and `logout()` as `keycloak-js` operations, not backend navigations. `login()` SHALL start the Keycloak Authorization Code + PKCE login (redirecting the browser to Keycloak) with the redirect URI resolved to the requesting in-app route. `logout()` SHALL clear the in-memory token from the store and end the Keycloak session (redirecting to Keycloak's end-session endpoint), returning to the app's login view.

#### Scenario: Login starts the Keycloak flow

- **WHEN** `login()` is invoked while unauthenticated
- **THEN** the browser is redirected to Keycloak's authorization endpoint with PKCE, and on return the code is exchanged for a token and `isAuthenticated` becomes true

#### Scenario: Logout ends the Keycloak session and clears the token

- **WHEN** `logout()` is invoked
- **THEN** the in-memory token is cleared and the browser is redirected to Keycloak's end-session endpoint, returning to the login view

## REMOVED Requirements

### Requirement: Token exchange uses the backend cookie

**Reason**: The web client no longer uses the backend-for-frontend cookie bridge. The JWT is now obtained directly from Keycloak via `keycloak-js`, so the `GET /api/v1/account/token` cookie exchange and the sole `credentials: "include"` request are removed.

**Migration**: Replace `fetchToken()`'s cookie exchange with Keycloak token acquisition/refresh (`keycloak-js` init and `updateToken`). The backend `GET /api/v1/account/token` endpoint is retired in the separate backend change; no frontend code calls it after this change.
