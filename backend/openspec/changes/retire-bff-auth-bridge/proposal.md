## Why

The web frontend is moving to authenticate directly against Keycloak (Authorization Code + PKCE via `keycloak-js`) and send a JWT bearer token, exactly like the mobile client (frontend change `switch-web-auth-to-direct-keycloak`). Once it does, the backend-for-frontend (BFF) cookie bridge built for the SPA — the cookie-to-token exchange endpoint, the frontend-origin return-url allowance, and the credentialed CORS policy — is dead weight and a security surface with no consumer. The backend should become a pure JWT resource server for the frontend while retaining the OIDC cookie only for the MVC Admin console.

## What Changes

- **BREAKING**: Remove `GET /api/v1/account/token` (API `AccountController.Token`) and its cookie-only authorization. The frontend no longer exchanges a cookie for a bearer token.
- Login/logout front-door (MVC `AccountController`) now serves only the Admin console: return-url validation drops the frontend-origin allowance and accepts local urls only, falling back to the safe local default otherwise. `FrontendOriginProvider.IsAllowedReturnUrl` (and its frontend-origin return-url role) is removed.
- Change the frontend CORS policy from credentialed (`AllowCredentials`) to **non-credentialed**: the frontend sends bearer tokens, not cookies, so credentials are no longer needed. The policy still allows exactly the configured frontend origin (non-wildcard) for the whole API surface (`app.UseCors` is global). `FrontendOriginProvider.Origin` is still used as the allowed CORS origin.
- **Unchanged**: the JWT bearer scheme and validation (`AddKeycloakJwtBearer`, `ApiBearerAuthorize`), the cookie+bearer coexistence for the Admin console, and every API endpoint (`/me`, notification-preferences, restaurants, wheels, etc.).

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `bff-authentication`: The token-exchange endpoint is removed; the login/logout front-door serves only the Admin console (no frontend-origin return url); the frontend CORS policy becomes non-credentialed. The cookie+bearer scheme coexistence is retained for the Admin console and the JWT resource-server behavior is unchanged.

## Impact

- Affected code: `Web/API/Controllers/AccountController.cs` (remove `Token`), `Web/MVC/Controllers/AccountController.cs` (return-url validation), `Web/Configuration/FrontendOriginProvider.cs` (drop `IsAllowedReturnUrl`), `Web/Configuration/ServiceConfiguration.cs` (CORS policy no longer credentialed), and their tests (`Tests/AccountControllerTests.cs` and any return-url/CORS tests).
- Removed contract: `GET /api/v1/account/token` and the `TokenResponseDto` if unused elsewhere.
- No database, messaging, or domain changes.
- Coordinated with the frontend change: the frontend stops calling the token endpoint before/at the same time this removes it. The endpoint may remain until the frontend deploy ships to allow either order; rollback is redeploying the previous backend build.
- Deployment: the Keycloak web public client (PKCE, redirect URI, Web Origins) must exist for the frontend; no backend Keycloak config change is required for JWT validation, which already works.
