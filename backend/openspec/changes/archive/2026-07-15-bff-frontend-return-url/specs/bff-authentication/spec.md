## MODIFIED Requirements

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
