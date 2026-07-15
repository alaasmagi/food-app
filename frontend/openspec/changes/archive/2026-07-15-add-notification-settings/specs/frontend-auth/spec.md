## MODIFIED Requirements

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
