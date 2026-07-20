## Context

The backend currently serves two identity surfaces from Keycloak: an OIDC cookie scheme (default challenge) that powers the MVC Admin console and once served as the SPA login front-door, and a JWT bearer scheme that authorizes the Web API. The BFF bridge glued the SPA to the cookie world: `GET /api/v1/account/token` (cookie-authorized) handed the Duende-managed access token to the SPA, `app.UseCors(CorsPolicies.Frontend)` was credentialed so the SPA's cookie-bearing XHR could call cross-origin, and MVC `AccountController` login/logout validated return urls against the frontend origin via `FrontendOriginProvider.IsAllowedReturnUrl`.

With the frontend switching to direct-to-Keycloak PKCE (`switch-web-auth-to-direct-keycloak`), the SPA obtains its own JWT and calls the API with a bearer token only — no cookie. That makes the entire BFF bridge unused. The Admin console still needs the cookie scheme.

## Goals / Non-Goals

**Goals:**
- Remove the SPA-only cookie bridge: the token-exchange endpoint, the frontend-origin return-url allowance, and the credentialed CORS behavior.
- Keep the backend a working JWT resource server for the frontend (unchanged) and keep the OIDC cookie for the Admin console.
- Preserve the open-redirect protection on login/logout, now scoped to local urls only.
- Keep a single configured source of the frontend origin for CORS.

**Non-Goals:**
- Any change to JWT validation, `ApiBearerAuthorize`, or API endpoint behavior.
- Removing or restructuring the OIDC cookie scheme or the Admin console.
- Keycloak server configuration for JWT validation (already correct); the web public client is configured on the frontend side.

## Decisions

### Decision: Remove `GET /api/v1/account/token` and `TokenResponseDto`
The endpoint exists solely to hand a cookie session's access token to the SPA. With no consumer it is removed along with `DTO/Web/TokenResponseDto.cs` (used nowhere else). This eliminates the only endpoint that authorized specifically via the cookie scheme in the API.

- **Alternatives considered:** leaving it in place behind the cookie scheme (harmless but a live, untested auth surface with no consumer — prefer deletion).

### Decision: Login/logout validate local return urls only; drop `IsAllowedReturnUrl`
The MVC `AccountController` `ResolveRedirectUri` keeps its open-redirect guard but now allows only local urls (`Url.IsLocalUrl`), falling back to the local `Home/Index` default otherwise. The frontend-origin branch is removed, so `FrontendOriginProvider.IsAllowedReturnUrl` is deleted; the provider keeps only `Origin` for CORS. The Admin console only ever redirects within the backend, so local-only is sufficient.

- **Alternatives considered:** keeping `IsAllowedReturnUrl` for a hypothetical future SPA return (speculative; reintroduce if ever needed).

### Decision: Frontend CORS policy becomes non-credentialed, origin unchanged
`CorsPolicies.Frontend` drops `AllowCredentials()` and keeps `WithOrigins(frontendOriginProvider.Origin)` (non-wildcard), `AllowAnyHeader`, `AllowAnyMethod`. `app.UseCors` stays global so bearer API calls from the frontend origin still receive CORS headers. Removing credentials is required correctness once cookies are gone: a credentialed policy is stricter than needed and the `Access-Control-Allow-Credentials` header no longer has a purpose.

- **Alternatives considered:** wildcard origin (rejected — no reason to widen; keep the origin allow-list).

## Risks / Trade-offs

- **Removing the endpoint before the frontend stops calling it** breaks login on the old SPA build → deploy ordering: the frontend change ships first (or together); the endpoint removal is safe once no build calls it. The endpoint can linger through one deploy if a strict order is undesirable. Rollback = redeploy the prior backend build.
- **Admin console login regression from the return-url change** → covered by keeping the local-url path intact; `FrontendOriginProviderTests` return-url cases are removed and the MVC login/logout local-redirect behavior is asserted.
- **A stray credentialed cross-origin call somewhere** would now fail CORS → audited: the only credentialed request was the token exchange, which is being removed; all other API calls are bearer, non-credentialed.

## Open Questions

- None blocking. Confirm no external/integration consumer (outside the web SPA) depends on `GET /api/v1/account/token` before removal — search shows only the SPA used it.
