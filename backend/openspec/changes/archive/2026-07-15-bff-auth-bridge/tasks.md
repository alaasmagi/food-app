## 1. Configuration

- [x] 1.1 Add `FrontendOrigin()` (from `FRONTEND_ORIGIN`) to `Web/Configuration/RequiredConfiguration.cs`, following the existing `Required(...)` helper style.
- [x] 1.2 Add `FRONTEND_ORIGIN=https://app.<domain>` to `.env.example` with a short comment.
- [x] 1.3 Add a CORS policy-name constant (e.g. `CorsPolicies.Frontend`) alongside the other `Web/Configuration` constants.

## 2. Auth schemes + CORS registration

- [x] 2.1 In `ServiceConfiguration.AddApplicationAuthentication`, register `AddKeycloakJwtBearer(keycloakOptions)` in addition to the existing `AddKeycloakOidc`, keeping the OIDC cookie as the default scheme.
- [x] 2.2 In the same method (or a dedicated `AddApplicationCors`), register `services.AddCors(...)` with a named policy that `WithOrigins(frontendOrigin).AllowCredentials().AllowAnyHeader().AllowAnyMethod()` — no wildcard origin. Thread `frontendOrigin` from `ConfigureApplicationServices`.
- [x] 2.3 In `Web/Program.cs`, add `app.UseCors(CorsPolicies.Frontend)` after `app.UseRouting()` and before `app.UseAuthentication()`.

## 3. Pin Web API to the bearer scheme

- [x] 3.1 Make Web API controllers authorize via the bearer scheme (shared API base controller or an MVC authorization convention applying `[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]`), so unauthenticated API calls return 401 rather than redirecting. Leave MVC controllers on the cookie `FallbackPolicy`.
- [x] 3.2 Verify existing `[Authorize(Policy = Admin)]` endpoints still resolve the admin role under the bearer scheme (roles come from the token; `IncludeClientRoles` is already set).

## 4. Token-exchange endpoint

- [x] 4.1 Add `Web/API/Controllers/AccountController.cs` (API, route `api/v{version:apiVersion}/account`) with `GET token` annotated `[Authorize(AuthenticationSchemes = CookieAuthenticationDefaults.AuthenticationScheme)]` and `[EnableCors(CorsPolicies.Frontend)]`.
- [x] 4.2 Implement `token` to read the current session's Duende-managed access token (`HttpContext.GetUserAccessTokenAsync()` / `GetTokenAsync("access_token")`) and its expiry; return a `TokenResponseDto { accessToken, expiresAtUtc }` under `DTO/Web`.
- [x] 4.3 Return 401 when there is no valid cookie session (attribute-driven) and handle a missing/expired managed token gracefully.

## 5. Self-service notification preferences

- [x] 5.1 Add a `NotificationPreferencesDto { bool SendNotifications; Guid? NotificationEnvironmentId }` under `DTO/Web`.
- [x] 5.2 Add a focused service path to update only the current actor's notification fields — e.g. `IAppUserService.UpdateNotificationPreferencesAsync(Guid actor, bool sendNotifications, Guid? environmentId)` in `Application/AppUserService.cs` — that loads the actor's own `AppUser`, sets only those two fields, and updates using the existing concurrency token, reusing the existing `NotificationEnvironmentId` ownership validation (FORBIDDEN/NOT_FOUND).
- [x] 5.3 Add `PATCH notification-preferences` on the API `AccountController`, resolving the actor via `ICurrentActorAccessor`, rejecting unauthenticated callers, and never reading a target id from the client. Map `IMethodResponse` failures to HTTP via the existing `ToProblem` pattern.

## 6. Tests

- [x] 6.1 Add a service test for `UpdateNotificationPreferencesAsync`: own environment succeeds; another user's environment → forbidden; nonexistent environment → not-found; clearing to null succeeds; only the two fields change (identity/other fields preserved).
- [x] 6.2 Add coverage that the self-service path resolves the target from the actor and cannot be pointed at another user's `AppUser`.

## 7. Verify

- [x] 7.1 `dotnet build` and `dotnet test` are green.
- [x] 7.2 Sanity-check the DI graph and middleware order build without errors (bearer scheme registered, CORS policy resolvable, `UseCors` positioned correctly).
- [x] 7.3 Manually confirm (or document, if infra is unavailable) that `GET /api/v1/account/token` returns a token only for a cookie session and that a protected API endpoint accepts that bearer token.
