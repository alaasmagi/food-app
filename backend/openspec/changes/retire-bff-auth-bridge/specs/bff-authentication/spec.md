## MODIFIED Requirements

### Requirement: Login and logout front-door broker the OIDC handshake
The system SHALL expose login and logout actions that drive the Keycloak OIDC handshake over the cookie scheme for the MVC Admin console. After the handshake completes, each action SHALL redirect the browser to a validated return url that is a local url, falling back to a safe local default for any non-local value. The frontend does not use these actions; it authenticates directly against Keycloak.

#### Scenario: Login challenges Keycloak and returns to a local url
- **WHEN** the browser requests the login action with a local return url
- **THEN** the system issues an OIDC challenge to Keycloak and, on completion, redirects to that local return url.

#### Scenario: Login rejects a non-local return url
- **WHEN** the browser requests the login action with a return url that is not a local url
- **THEN** the system does not redirect to that url and instead redirects to the safe local default.

#### Scenario: Logout clears the cookie, ends the Keycloak session, and returns to a validated url
- **WHEN** an authenticated user requests the logout action with a return url
- **THEN** the system signs out the cookie scheme and the OIDC scheme, ending the Keycloak session, and on completion redirects to the return url when it is local, otherwise to the safe local default.

### Requirement: Frontend-origin CORS policy is non-credentialed and non-wildcard
The system SHALL apply a CORS policy that allows exactly the configured frontend origin, without credentials, to the API surface, and SHALL NOT use a wildcard origin. Because the frontend now sends a bearer token rather than a cookie, the policy SHALL NOT enable credentials.

#### Scenario: Cross-origin bearer request from the frontend origin is allowed
- **WHEN** the frontend origin makes a cross-origin request with a bearer token to the API
- **THEN** the system echoes the specific allowed origin and does not require or enable credentials.

#### Scenario: Other origins are not allowed
- **WHEN** an origin other than the configured frontend origin makes a cross-origin request to the API
- **THEN** the system does not return that origin as allowed.

#### Scenario: Allowed origin is configured, not hardcoded
- **WHEN** the CORS policy is built
- **THEN** the allowed origin is read from configuration rather than an inline constant, and no wildcard origin is used, and credentials are not enabled.

## REMOVED Requirements

### Requirement: Token-exchange endpoint returns the managed access token for the cookie session
**Reason**: The web frontend now obtains its JWT directly from Keycloak (Authorization Code + PKCE) and no longer exchanges a backend cookie for a bearer token, so the cookie-authorized token-exchange endpoint has no consumer.

**Migration**: Remove `GET /api/v1/account/token` and `TokenResponseDto`. Frontend clients acquire and refresh tokens via Keycloak directly (see the frontend change `switch-web-auth-to-direct-keycloak`); the backend continues to validate those tokens via the existing JWT bearer scheme.
