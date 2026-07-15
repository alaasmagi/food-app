## Why

The BFF login/logout front-door is meant to bounce the browser back to the Vue frontend, but it only ever honors *local* return urls. `AccountController.Login` validates `returnUrl` with `Url.IsLocalUrl`, which rejects the frontend's own origin (`https://app.<domain>`) because it is a different host from the backend — so after Keycloak sign-in the browser lands on the backend's MVC admin `Home/Index` instead of the frontend. `Logout` is worse: it takes no `returnUrl` at all and always redirects to `Home/Index`. The frontend has no way to send a user through login or logout and get them back to where they started in the SPA.

## What Changes

- Accept the configured frontend origin as a valid post-auth redirect target on the login/logout front-door, in addition to local urls. A `returnUrl` is honored when it is either a local url **or** an absolute url whose origin exactly equals the configured `FRONTEND_ORIGIN`; anything else falls back to the safe default.
- `AccountController.Login(returnUrl)`: replace the bare `Url.IsLocalUrl` check with the combined local-or-frontend-origin validation, so a frontend return url survives the Keycloak round-trip.
- `AccountController.Logout(returnUrl)`: add a `returnUrl` parameter, validate it the same way, and use it as the post-sign-out `RedirectUri` (which flows through Keycloak's end-session endpoint back to the frontend). Fall back to `Home/Index` when absent or invalid.
- Make the frontend origin available where redirect validation happens (it is currently only wired into the CORS policy, not reachable from the MVC controller). Introduce a small shared helper/service that both the controller and CORS can rely on for the single source of the allowed frontend origin.

This is deliberately narrow: it does not change the auth schemes, the token-exchange endpoint, the CORS policy contract, or any notification-preference behavior — all of which are already implemented and spec-covered.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `bff-authentication`: the login/logout front-door MAY redirect the browser to the configured frontend origin after the OIDC handshake, not only to local urls; logout accepts a `returnUrl`. Non-local, non-frontend return urls are still rejected in favor of a safe default.

## Impact

- **Web/MVC/Controllers/AccountController.cs**: `Login` return-url validation; `Logout` gains a validated `returnUrl` parameter.
- **Web/Configuration**: expose the configured `FRONTEND_ORIGIN` to the MVC controller (e.g. a small options/helper type registered in DI) so both redirect validation and the existing CORS policy read the same value.
- **Tests**: cover the local-url, matching-frontend-origin, and rejected-foreign-origin cases for both actions.
- No change to Domain, DataAccess, DTOs, mappers, the token-exchange endpoint, the auth schemes, or the notification-preference endpoints.
