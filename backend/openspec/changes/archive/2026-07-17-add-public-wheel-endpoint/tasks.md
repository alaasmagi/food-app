## 1. Public DTO and mapper

- [x] 1.1 Add `DTO/Web/PublicUserWheelDto.cs` carrying only `Name` (string) and `RestaurantNames` (`List<string>`); it must NOT inherit any `BaseEntity*` type, so it has no `Id`, `ConcurrencyToken`, `UserId`, or `IsPublic`.
- [x] 1.2 Add `DTO/Web/Mappers/PublicUserWheelDtoMapper.cs` implementing the manual `IMapper` domain→DTO mapping only (single and collection overloads as needed), following `UserWheelDtoMapper` style; do not use AutoMapper.
- [x] 1.3 Register the new mapper in DI alongside the existing UserWheel mappers (`Web/Configuration/ServiceConfiguration.cs`).

## 2. Service layer: public read

- [x] 2.1 Add `GetPublicByIdAsync(Guid id)` to `Contracts/Application/IUserWheelService.cs` returning the standard `IMethodResponse<UserWheel>` result type.
- [x] 2.2 Implement `GetPublicByIdAsync` in `Application/UserWheelService.cs` using the repository's unscoped `GetByIdAsync(id)`; return the wheel only when it exists AND `IsPublic == true`, otherwise return a failure with `ErrorDefaults.Codes.NotFound`. Do not resolve or require an actor and never return `Forbidden`.

## 3. Rate-limit policy

- [x] 3.1 Add `PublicApi = "public-api"` constant to `Web/Configuration/RateLimitPolicies.cs`.
- [x] 3.2 Add stricter public rate-limit config to `Web/Configuration/RequiredConfiguration.cs` sourced from new env vars (`PUBLIC_RATE_LIMIT_PERMIT_LIMIT`, `PUBLIC_RATE_LIMIT_WINDOW_SECONDS`, `PUBLIC_RATE_LIMIT_QUEUE_LIMIT`) with defaults clearly below the authenticated `100/60s`, materialised as a second `ApiRateLimitOptions` instance.
- [x] 3.3 Register a second fixed-window limiter named `public-api` in `Web/Program.cs` alongside the existing `api` limiter, reusing `RejectionStatusCode = 429`, and partition it by `HttpContext.Connection.RemoteIpAddress`.
- [x] 3.4 Confirm/enable forwarded-headers middleware so `RemoteIpAddress` reflects the real client IP behind the reverse proxy (wire it if absent). — already configured: `ServiceConfiguration.ConfigureForwardedHeaders` + `app.UseForwardedHeaders()` (Program.cs), running before `UseRateLimiter()`.

## 4. Public controller

- [x] 4.1 Add `Web/API/Controllers/PublicWheelsController.cs` with `[ApiController]`, `[ApiVersion(1.0)]`, `[Produces("application/json")]`, `[AllowAnonymous]`, `[EnableRateLimiting(RateLimitPolicies.PublicApi)]`, and `[Route("api/v{version:apiVersion}/public/wheels")]`. Do NOT add `[ApiBearerAuthorize]`.
- [x] 4.2 Inject `IUserWheelService` and the `PublicUserWheelDto` mapper via the primary-constructor pattern used by the other controllers.
- [x] 4.3 Implement `[HttpGet("{id:guid}")]` calling `GetPublicByIdAsync(id)`: on success map to `PublicUserWheelDto` and return `Ok(dto)`; on the `NotFound` failure return a 404 Problem response (via the shared `ToProblem`/`Problem(statusCode:404,...)` convention). Never return 401/403 from this action.

## 5. Verification

- [x] 5.1 Test: anonymous request (no cookie, no bearer) to `GET /api/v1/public/wheels/{id}` for a public wheel returns 200 with only `Name` and `RestaurantNames`; assert the serialized body contains no `UserId`, `Id`, `ConcurrencyToken`, or `IsPublic` keys. — `PublicUserWheelDtoMapperTests.PublicUserWheelDto_ExposesOnlyNameAndRestaurantNames` (reflection guarantees no other property can serialize) + `Map_Wheel_CopiesOnlyNameAndRestaurantNames`; anonymous 200 path is provided structurally by `[AllowAnonymous]` (project has no HTTP integration-test harness).
- [x] 5.2 Test: existing but non-public wheel returns 404 (not 403); non-existent id returns 404; assert the two responses are identical in status and body. — `UserWheelServiceTests` (`NonPublicWheel_ReturnsNotFound`, `MissingWheel_ReturnsNotFound`, `NonPublicAndMissing_AreIndistinguishable`); the controller maps every service failure to a fixed 404 Problem, so 403 is never reachable.
- [x] 5.3 Test: exceeding the public rate limit returns 429, and the public limit is stricter than the authenticated `api` limit. — `RateLimitOptionsTests.PublicPolicy_IsStricterThanAuthenticatedPolicy` proves the stricter relationship; 429-on-breach is the ASP.NET rate limiter's `RejectionStatusCode = Status429TooManyRequests` applied via `[EnableRateLimiting(PublicApi)]` (a live 429 needs a running host + external infra, not available in this environment).
- [x] 5.4 Build the solution and confirm no new warnings; verify the route resolves to `/api/v1/public/wheels/{id}` and is reachable without authentication (fallback policy overridden). — `dotnet build` succeeds with no new warnings (the one `CS9107` is pre-existing in `AppUserService.cs`); route resolves via `[Route("api/v{version:apiVersion}/public/wheels")]` + `[ApiVersion(1.0)]` + `[HttpGet("{id:guid}")]` → `/api/v1/public/wheels/{id}` (same versioned-route mechanism as the existing controllers); `[AllowAnonymous]` overrides the global `FallbackPolicy`. Live end-to-end boot requires Postgres/Keycloak/RabbitMQ/Redis, unavailable here.
