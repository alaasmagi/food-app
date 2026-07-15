# frontend-auth Specification

## Purpose
TBD - created by archiving change add-auth-bootstrap. Update Purpose after archive.
## Requirements
### Requirement: Auth store holds session state in memory only

The application SHALL provide a Pinia `auth` store exposing `token`, `currentUser`, `isAuthenticated`, and `hasRole(role)`, plus `login()`, `logout()`, `fetchToken()`, and `fetchCurrentUser()` actions. The token SHALL be stored in memory only and never written to `localStorage` or `sessionStorage`, so it does not survive a full page reload by design. `currentUser` SHALL be populated by `fetchCurrentUser()` (from `GET /api/v1/account/me`) and MAY be refreshed after a preferences update; it carries `sendNotifications` and `notificationEnvironmentId`.

#### Scenario: Authenticated state reflects a present token

- **WHEN** the store holds a non-expired `token` and a `currentUser`
- **THEN** `isAuthenticated` is true

#### Scenario: Unauthenticated by default

- **WHEN** the app first loads before any token exchange
- **THEN** `token` is empty and `isAuthenticated` is false

#### Scenario: Current user populated on demand

- **WHEN** `fetchCurrentUser()` is called while authenticated
- **THEN** `currentUser` is populated from `GET /api/v1/account/me`, including `sendNotifications` and `notificationEnvironmentId`

#### Scenario: Role check for gated views

- **WHEN** `hasRole("admin")` is called and the current user has the admin role
- **THEN** it returns true; otherwise it returns false

#### Scenario: Token is not persisted

- **WHEN** the token has been set and the page is fully reloaded
- **THEN** the in-memory token is gone and no copy exists in `localStorage` or `sessionStorage`

### Requirement: Token exchange uses the backend cookie

The application SHALL implement `fetchToken()` in `src/api/account.ts` calling `GET /api/v1/account/token` with `credentials: "include"`, returning `{ accessToken, expiresAtUtc }`. This SHALL be the ONLY request in the app that uses `credentials: "include"`.

#### Scenario: Successful token exchange

- **WHEN** the backend session cookie is valid and `fetchToken()` is called
- **THEN** the app receives `{ accessToken, expiresAtUtc }` and the auth store stores the token in memory

#### Scenario: Cookie session expired

- **WHEN** `fetchToken()` is called and the backend responds 401
- **THEN** the app treats the session as expired and triggers the login navigation flow

#### Scenario: Silent re-establish on startup

- **WHEN** the app starts with an empty store but a still-valid backend cookie
- **THEN** `fetchToken()` re-establishes the token with no visible login prompt

### Requirement: Shared fetch wrapper attaches the bearer token

The application SHALL provide `src/api/client.ts`, a shared fetch wrapper through which all non-token API calls pass. It SHALL attach `Authorization: Bearer <token>` from the auth store on every call except the token-exchange call, and SHALL NOT set `credentials: "include"` or any CSRF header on bearer-authorized calls.

#### Scenario: Bearer attached to normal calls

- **WHEN** any API call other than the token exchange is made through the wrapper
- **THEN** the request carries `Authorization: Bearer <token>` and does not send credentials or a CSRF header

#### Scenario: Silent refresh on 401

- **WHEN** an API call through the wrapper returns 401
- **THEN** the wrapper silently calls `fetchToken()` once and retries the original request before surfacing an error

#### Scenario: Refresh also fails

- **WHEN** the retried `fetchToken()` itself returns 401
- **THEN** the wrapper surfaces the error and the session is treated as expired

### Requirement: Login and logout are full-page navigations

The application SHALL implement `login()` and `logout()` as full-page browser navigations, never fetch/XHR. `login()` SHALL navigate `window.location.href` to `https://api.<domain>/account/login?returnUrl=<current-url>`. `logout()` SHALL navigate the window to `https://api.<domain>/account/logout` and clear the in-memory token from the store.

#### Scenario: Login navigation

- **WHEN** `login()` is invoked
- **THEN** the whole browser window navigates to the backend login URL with the current URL as `returnUrl`

#### Scenario: Logout navigation and clear

- **WHEN** `logout()` is invoked
- **THEN** the in-memory token is cleared and the whole browser window navigates to the backend logout URL
