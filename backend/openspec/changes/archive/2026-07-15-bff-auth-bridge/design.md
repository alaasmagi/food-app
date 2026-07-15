## Context

The app is a single ASP.NET Core host serving both an MVC admin/OIDC surface and a versioned Web API for a Vue frontend (BFF setup). Current auth state:
- `AddKeycloakOidc(keycloakOptions)` is registered (cookie scheme, default), and pulls in Duende `AddOpenIdConnectAccessTokenManagement`, so the current cookie session has a server-managed access token.
- `AccountController` (MVC) already implements `Login` (OIDC challenge → local return url) and `Logout` (cookie + OIDC sign-out).
- Authorization has an `Admin` role policy and a `FallbackPolicy` requiring an authenticated user; admin-write API controllers use `[Authorize(Policy = Admin)]`.
- No JWT bearer scheme, no CORS, and no token-exchange endpoint exist yet.
- `KeycloakOptions` (from `Base.Keycloak.Authentication`) exposes `Authority`, `ClientId`, `Audience`, `ClientSecret`, `RequireHttpsMetadata`, `IncludeClientRoles`. The base package exposes both `AddKeycloakOidc` and `AddKeycloakJwtBearer`.
- Options are POCOs built in `RequiredConfiguration` from env vars and registered as singletons; the current actor is resolved by `CurrentActorAccessor` (`ClaimTypes.NameIdentifier`/`sub`). `AppUser.Id == sub`.

The AppUser notification fields, `AppUserService` environment-ownership validation, and `SetNull`-on-delete already shipped in the archived `daily-lunch-recommendations` change; this change only adds the auth bridge and the user-facing preferences endpoint.

## Goals / Non-Goals

**Goals:**
- Register a JWT bearer scheme for Web API authorization while keeping the OIDC cookie as the default (so MVC + login redirects still work).
- Provide `GET /api/v1/account/token` (cookie-authorized) returning the managed access token + expiry.
- Add a credentialed, non-wildcard CORS policy for the configured frontend origin, applied to the account endpoints.
- Add `PATCH /api/v1/account/notification-preferences` that self-scopes to the current identity and updates only that user's notification fields.

**Non-Goals:**
- Re-implementing the AppUser fields, mappers, ownership validation, or SetNull FK (already done).
- `DailyRecommendationNotificationService` and any frontend work.
- CORS for the non-account Web API surface (bearer-based calls) — see Open Questions.
- Keycloak action tokens / magic-login.

## Decisions

### Decision 1: Cookie stays the default scheme; API opts into bearer
Register `AddKeycloakJwtBearer` in addition to `AddKeycloakOidc`, leaving the OIDC cookie as the default authenticate/challenge scheme. Web API controllers require the bearer scheme explicitly so that (a) an unauthenticated API call returns 401 instead of a browser redirect, and (b) MVC pages keep redirecting to Keycloak. Mechanism: apply `[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]` at the API-controller level (a shared base controller or attribute), leaving existing `[Authorize(Policy = Admin)]` semantics intact but pinned to the bearer scheme. The MVC `FallbackPolicy` (cookie) is unchanged.
- **Why:** Distinct challenge behavior per surface is the whole point of a BFF; a combined "accept either scheme" default blurs 401-vs-redirect and complicates the token endpoint's cookie-only requirement.
- **Alternative considered:** A single default policy accepting both schemes. Rejected — makes it hard to force cookie-only on `/account/token` and yields redirect-on-401 for API callers.

### Decision 2: Token endpoint is cookie-only and reads the Duende-managed token
`GET /api/v1/account/token` is annotated `[Authorize(AuthenticationSchemes = CookieAuthenticationDefaults.AuthenticationScheme)]`. It obtains the access token from the current session via Duende access-token management (`HttpContext.GetUserAccessTokenAsync()` / `GetTokenAsync("access_token")`) and returns `{ accessToken, expiresAtUtc }`, where expiry comes from the managed token's `expires_at` (or the token store).
- **Why:** The frontend can only prove identity here via the same-site cookie; pinning the scheme prevents a bearer token from being exchanged for another. Duende already refreshes/stores the token, so no manual token call to Keycloak is needed.
- **Alternative considered:** Calling Keycloak's token endpoint directly. Rejected — duplicates what `AddOpenIdConnectAccessTokenManagement` already provides and risks token divergence.

### Decision 3: Credentialed, origin-specific CORS applied to account endpoints
Add a named CORS policy (`WithOrigins(frontendOrigin).AllowCredentials().AllowAnyHeader().AllowAnyMethod()`) and apply it to the account endpoints (via `[EnableCors]` on the API `AccountController`, or endpoint routing). The origin comes from a new `FRONTEND_ORIGIN` env var surfaced through `RequiredConfiguration`. `app.UseCors(...)` is added after `UseRouting` and before `UseAuthentication`.
- **Why:** Only the credentialed XHR to `/account/token` needs CORS with the cookie; login/logout are full-page navigations that don't. Credentialed CORS forbids wildcard origins, so the exact origin is required.
- **Alternative considered:** App-wide `AllowAnyOrigin`. Rejected — incompatible with `AllowCredentials` and over-broad.

### Decision 4: Dedicated, self-scoped preferences endpoint
Add `PATCH /api/v1/account/notification-preferences` on the API `AccountController` accepting `{ sendNotifications, notificationEnvironmentId }`. It resolves the acting user via `ICurrentActorAccessor` and updates that `AppUser`'s two fields only — the client cannot supply a target id. It reuses `AppUserService.UpdateAsync` (which already validates `NotificationEnvironmentId` ownership and returns FORBIDDEN/NOT_FOUND). To touch only the two fields, the service loads the current `AppUser`, sets the two fields, and updates with the existing concurrency token.
- **Why:** A self-scoped account endpoint makes cross-user writes structurally impossible, unlike a guarded `PUT /app-users/{id}`.
- **Alternative considered:** Extending `AppUsersController.Update` with a non-admin self-ownership guard. Rejected (per requester) — mixes admin CRUD and self-service on one route and still exposes an id path parameter.
- **Consideration:** May add a focused service method (e.g. `UpdateNotificationPreferencesAsync(actor, sendNotifications, environmentId)`) so field-restriction and self-scoping live in the service rather than the controller.

### Decision 5: No default-Bearer FallbackPolicy change
Keep the MVC `FallbackPolicy` (cookie, authenticated user) as-is; API controllers get bearer via Decision 1. This avoids changing MVC behavior while introducing bearer.

## Risks / Trade-offs

- **Pinning API controllers to the bearer scheme touches multiple controllers** → Use a shared API base controller or a single `[Authorize(AuthenticationSchemes = Bearer)]` applied via an MVC convention so it's declared once; admin endpoints keep `[Authorize(Policy = Admin)]` (which resolves within the bearer scheme).
- **Duende token API surface** (`GetUserAccessTokenAsync` vs `GetTokenAsync`) → Confirm the exact call available with the referenced Duende version during implementation and read expiry from the returned token metadata; fall back to `GetTokenAsync("expires_at")` if needed.
- **Frontend also needs CORS for non-account API** (bearer calls are cross-origin) → Out of scope here per the proposal; flagged as an open question. If the frontend calls the API cross-origin directly, a broader (non-credentialed) CORS policy will be needed later.
- **Return-url open redirect** → Login already restricts to `Url.IsLocalUrl`; keep that guard; logout redirect likewise constrained.

## Migration Plan

1. Add `FRONTEND_ORIGIN` config to `RequiredConfiguration` + `.env.example`.
2. Register `AddKeycloakJwtBearer` and the named CORS policy in `AddApplicationAuthentication`; keep cookie default.
3. Add `app.UseCors(...)` in `Program.cs` (after `UseRouting`, before `UseAuthentication`).
4. Pin Web API controllers to the bearer scheme (shared base/convention).
5. Add the API `AccountController` with the cookie-only `token` action and the self-scoped `notification-preferences` action; add request/response DTOs.
6. Add the focused service path for updating only the actor's notification fields.
- **Rollback:** Remove the bearer registration, CORS policy/middleware, and the new endpoints; the existing cookie/MVC flow is unaffected.

## Open Questions

- Should CORS (non-credentialed) be extended to the rest of the Web API so the frontend can call it cross-origin with the bearer token, or will the frontend go through a same-origin proxy? The proposal scopes CORS to `/account/*` only; broader API CORS is deferred.
- Exact Duende access-token accessor/type for expiry in the referenced package version — to be confirmed at implementation.
