## Why

The Vue frontend must never talk to Keycloak directly. Today the backend can broker a browser login into a cookie session (`AddKeycloakOidc` + `AccountController.Login/Logout` already exist), but there is no way for the frontend to obtain a real bearer token to call the Web API directly, and no JWT bearer scheme registered to validate such tokens. This change adds the missing half of the BFF bridge: a bearer scheme for API authorization and a cookie-authorized token-exchange endpoint, plus the CORS needed for the frontend to call it. It also adds the user-facing self-service endpoint for the already-implemented notification preferences.

## What Changes

- **Dual auth schemes**: register `AddKeycloakJwtBearer` (validates bearer tokens on Web API endpoints) alongside the existing `AddKeycloakOidc` cookie scheme (MVC admin console + the login front-door). The OIDC cookie stays the default challenge scheme so browser navigations still redirect to Keycloak; Web API endpoints authorize via the bearer scheme.
- **Token-exchange endpoint**: new `GET /api/v1/account/token`, authorized specifically via the **cookie** scheme (not bearer), returning `{ accessToken, expiresAtUtc }` sourced from the Duende-managed access token of the current cookie session (`AddOpenIdConnectAccessTokenManagement` is already wired by `AddKeycloakOidc`).
- **CORS**: a named policy allowing exactly the configured frontend origin with `AllowCredentials()`, applied to the `/account/*` endpoints (so the credentialed XHR to `/account/token` can send the cookie and read the response). Origin comes from new configuration, not a wildcard.
- **Self-service notification preferences**: new `PATCH /api/v1/account/notification-preferences` that resolves the current actor from the authenticated identity and updates **only that user's own** `SendNotifications` / `NotificationEnvironmentId` — a non-admin can never target another user's `AppUser`. Reuses the existing `AppUserService` ownership validation for `NotificationEnvironmentId`.

**Prerequisite already in place** (implemented in the archived `daily-lunch-recommendations` change — NOT re-done here): `AppUser.SendNotifications` and `AppUser.NotificationEnvironmentId` on Domain/entity/DTO/both mappers, the `AppUserService` ownership validation when setting `NotificationEnvironmentId`, and the `SetNull`-on-delete FK. This change consumes those; it does not restate them.

## Capabilities

### New Capabilities
- `bff-authentication`: how the backend brokers frontend authentication — the dual cookie/bearer scheme split, the login/logout front-door, the cookie-authorized token-exchange endpoint, and the frontend-origin CORS policy.

### Modified Capabilities
- `daily-recommendation-notifications`: ADD a requirement that a user can read/update **their own** notification preferences (`SendNotifications`, `NotificationEnvironmentId`) through a self-scoped account endpoint, enforcing self-ownership and reusing the existing environment-ownership validation.

## Impact

- **Web/Configuration**: `ServiceConfiguration.AddApplicationAuthentication` (add `AddKeycloakJwtBearer`; keep cookie default; ensure API endpoints require bearer and `/account/token` requires cookie), a new CORS policy registration, and new frontend-origin configuration in `RequiredConfiguration` (+ `.env.example`).
- **Web/Program.cs**: add `app.UseCors(...)` in the correct middleware position (after `UseRouting`, before `UseAuthentication`).
- **Web/API/Controllers**: new `AccountController` (API) with `GET token` (cookie-scheme) and `PATCH notification-preferences` (self-scoped); no change to the existing MVC `AccountController.Login/Logout`.
- **Contracts/Application + Application**: an `AppUserService` path (or reuse of `UpdateAsync`) to update only the current actor's notification fields; DTOs for the token response and the preferences request under `DTO/Web`.
- **No changes** to Domain, DataAccess entities/migrations, mappers, or `DailyRecommendationNotificationService` (out of scope / already done).
- New dependency surface: relies on Duende access-token management already pulled in by `AddKeycloakOidc`.
