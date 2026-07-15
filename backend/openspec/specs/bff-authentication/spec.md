# bff-authentication Specification

## Purpose
Defines the backend-for-frontend (BFF) authentication bridge that lets a browser session and Web API callers share Keycloak identity: an OIDC cookie scheme brokers the login/logout handshake, a JWT bearer scheme protects the Web API, a token-exchange endpoint hands the cookie session's managed access token to the frontend, and a credentialed, non-wildcard CORS policy scopes those account endpoints to the configured frontend origin.

## Requirements
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
The system SHALL expose login and logout actions that drive the Keycloak OIDC handshake over the cookie scheme, so the frontend never contacts Keycloak directly. After the handshake completes, each action SHALL redirect the browser to a validated return url that is either a local url or exactly the configured frontend origin, falling back to a safe local default for any other value.

#### Scenario: Login challenges Keycloak and returns to a local url
- **WHEN** the browser requests the login action with a local return url
- **THEN** the system issues an OIDC challenge to Keycloak and, on completion, redirects to that local return url.

#### Scenario: Login returns to the configured frontend origin
- **WHEN** the browser requests the login action with a return url whose origin equals the configured frontend origin
- **THEN** the system issues an OIDC challenge to Keycloak and, on completion, redirects to that frontend return url.

#### Scenario: Login rejects a foreign return url
- **WHEN** the browser requests the login action with a return url that is neither local nor the configured frontend origin
- **THEN** the system does not redirect to that url and instead redirects to the safe local default.

#### Scenario: Logout clears the cookie, ends the Keycloak session, and returns to a validated url
- **WHEN** an authenticated user requests the logout action with a return url
- **THEN** the system signs out the cookie scheme and the OIDC scheme, ending the Keycloak session, and on completion redirects to the return url when it is local or the configured frontend origin, otherwise to the safe local default.

#### Scenario: Return-url validation compares origin components, not string prefixes
- **WHEN** a return url shares a string prefix with the configured frontend origin but has a different origin (for example a different host that merely begins with the allowed value)
- **THEN** the system treats it as foreign and redirects to the safe local default rather than the supplied url.

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
