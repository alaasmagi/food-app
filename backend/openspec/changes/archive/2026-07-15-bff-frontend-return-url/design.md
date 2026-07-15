## Context

The BFF login/logout front-door lives in `Web/MVC/Controllers/AccountController.cs`. `Login(returnUrl)` challenges Keycloak via the OIDC cookie scheme and, on the callback, redirects to `returnUrl` only when `Url.IsLocalUrl(returnUrl)` is true. The Vue frontend is served from a **separate origin** (`https://app.<domain>`, configured as `FRONTEND_ORIGIN`), so its return urls are never local and always fall through to `Home/Index` — the backend's MVC admin landing page. `Logout()` has no `returnUrl` parameter at all and unconditionally redirects to `Home/Index`.

The configured frontend origin already exists as `RequiredConfiguration.FrontendOrigin()`, but today it is consumed in exactly one place — `AddApplicationCors` — and is not reachable from the MVC controller. There is no shared, DI-visible representation of "the allowed frontend origin."

Constraint carried from the existing `bff-authentication` spec: the front-door must still **reject** arbitrary (attacker-controlled) return urls in favor of a safe default — this is an open-redirect guard, so widening the allow-set must stay a strict allow-list, never a relaxation to "any absolute url."

## Goals / Non-Goals

**Goals:**
- After login or logout, the browser can return to the configured frontend origin, not just to local backend urls.
- `Logout` accepts a `returnUrl` and honors it under the same validation as `Login`.
- A single source of truth for the allowed frontend origin, shared by CORS and redirect validation.
- Preserve the open-redirect guard: anything that is neither local nor the configured frontend origin falls back to the safe default.

**Non-Goals:**
- No change to auth schemes, the token-exchange endpoint, the CORS policy contract, or notification-preference behavior.
- No support for multiple frontend origins or wildcard/subdomain matching — exactly one configured origin.
- No change to what "local" means (`Url.IsLocalUrl` semantics are kept for the local branch).

## Decisions

### Decision 1: Validate `returnUrl` as "local OR exactly the frontend origin"
A return url is accepted when `Url.IsLocalUrl(returnUrl)` is true, **or** when it parses as an absolute `http(s)` url whose scheme+host+port equals the configured frontend origin. Comparison is done on parsed `Uri` components (ordinal-ignore-case host, explicit scheme and port), not on string `StartsWith`, to avoid `https://app.evil.com` slipping past a naive prefix check. Any other value (including unparseable input) falls back to the safe default (`Home/Index`).

- **Why not keep `Url.IsLocalUrl` only?** That is exactly the bug — it structurally cannot accept a cross-origin frontend url.
- **Why not allow any absolute url?** That reintroduces an open-redirect vulnerability. The allow-list is the point.
- **Why not `StartsWith(frontendOrigin)`?** Prefix matching is a classic open-redirect footgun (`https://app.<domain>.evil.com`). Parse-and-compare origin components instead.

### Decision 2: Expose the frontend origin through a small DI-registered type
Introduce a minimal options/helper (e.g. a `FrontendOriginProvider` or a record holding the origin plus an `IsAllowedReturnUrl(...)` method) registered in `ServiceConfiguration`, constructed from the same `RequiredConfiguration.FrontendOrigin()` value already read at startup. `AddApplicationCors` and the `AccountController` both consume it, so CORS and redirect validation can never drift to different origins.

- **Why not read the env var directly in the controller?** Controllers should not reach into `Environment.GetEnvironmentVariable`; DI is the established pattern in this project and keeps configuration validation centralized in `RequiredConfiguration`.
- **Why co-locate the `IsAllowedReturnUrl` logic on the provider?** So the open-redirect rule has one implementation shared by `Login` and `Logout`, and is unit-testable without an HTTP context.

### Decision 3: Keep the sign-out mechanics unchanged
`Logout` still `SignOut`s both the cookie and OIDC schemes (the OIDC sign-out drives Keycloak's end-session endpoint); only the `RedirectUri` becomes the validated `returnUrl` instead of a hardcoded `Home/Index`. The `[HttpPost]` + `[ValidateAntiForgeryToken]` protection on `Logout` is retained.

## Risks / Trade-offs

- **[Open-redirect regression if validation is sloppy]** → Compare parsed `Uri` origin components against the single configured origin; never prefix-match; fall back to the safe default on any parse failure. Cover the foreign-origin rejection case in tests.
- **[CORS and redirect origins drifting apart]** → Both read the one DI-registered frontend-origin value; there is no second source.
- **[Logout returnUrl passing through Keycloak end-session]** → `RedirectUri` is applied post-sign-out as it is today; only its value changes, so the end-session flow is unaffected.

## Migration Plan

Pure code change, no data or schema migration. Deploy is a straight replacement; rollback is reverting the controller + configuration wiring. `FRONTEND_ORIGIN` is already a required, already-set configuration value, so no new environment variable is introduced.

## Open Questions

_None._
