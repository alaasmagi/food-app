## ADDED Requirements

### Requirement: Cookie and bearer authentication schemes coexist
The system SHALL register a Keycloak OIDC cookie scheme and a Keycloak JWT bearer scheme, keeping the OIDC cookie as the default challenge scheme so browser navigations redirect to Keycloak, while Web API endpoints authorize against the bearer scheme.

#### Scenario: Browser navigation to a protected MVC page challenges via cookie
- **WHEN** an unauthenticated browser requests a protected MVC page
- **THEN** the system challenges via the OIDC cookie scheme and redirects to Keycloak.

#### Scenario: Web API request with a valid bearer token is authorized
- **WHEN** a caller sends a request to a protected Web API endpoint with a valid Keycloak bearer token
- **THEN** the system authenticates the request via the JWT bearer scheme.

#### Scenario: Web API request without a bearer token is rejected without redirect
- **WHEN** a caller sends a request to a protected Web API endpoint with no valid bearer token
- **THEN** the system rejects it with an unauthorized response rather than a browser redirect.

### Requirement: Login and logout front-door broker the OIDC handshake
The system SHALL expose login and logout actions that drive the Keycloak OIDC handshake over the cookie scheme, so the frontend never contacts Keycloak directly.

#### Scenario: Login challenges Keycloak and returns to a safe local url
- **WHEN** the browser requests the login action with a return url
- **THEN** the system issues an OIDC challenge to Keycloak and, on completion, redirects only to a local return url (rejecting non-local return urls).

#### Scenario: Logout clears the cookie and ends the Keycloak session
- **WHEN** an authenticated user requests the logout action
- **THEN** the system signs out the cookie scheme and the OIDC scheme, ending the Keycloak session.

### Requirement: Token-exchange endpoint returns the managed access token for the cookie session
The system SHALL expose `GET /api/v1/account/token`, authorized specifically via the cookie scheme, returning the current cookie session's Duende-managed access token and its UTC expiry.

#### Scenario: Cookie-authenticated caller receives an access token
- **WHEN** a caller with a valid authentication cookie requests `GET /api/v1/account/token`
- **THEN** the system returns `accessToken` and `expiresAtUtc` for that session's managed token.

#### Scenario: Endpoint is not satisfied by a bearer token
- **WHEN** a caller presents only a bearer token (no auth cookie) to `GET /api/v1/account/token`
- **THEN** the system does not authorize the request through the bearer scheme.

#### Scenario: Unauthenticated caller is rejected
- **WHEN** a caller with no authentication cookie requests `GET /api/v1/account/token`
- **THEN** the system returns an unauthorized response.

### Requirement: Frontend-origin CORS policy is credentialed and non-wildcard
The system SHALL apply a CORS policy that allows exactly the configured frontend origin with credentials enabled to the account endpoints, and SHALL NOT use a wildcard origin.

#### Scenario: Credentialed cross-origin token request from the frontend origin is allowed
- **WHEN** the frontend origin makes a credentialed cross-origin request to `/account/token`
- **THEN** the system allows it with credentials and echoes the specific allowed origin.

#### Scenario: Other origins are not allowed
- **WHEN** an origin other than the configured frontend origin makes a cross-origin request to an account endpoint
- **THEN** the system does not return that origin as allowed.

#### Scenario: Allowed origin is configured, not hardcoded
- **WHEN** the CORS policy is built
- **THEN** the allowed origin is read from configuration rather than an inline constant, and no wildcard origin is combined with credentials.
