## Context

`UserWheel` already carries an `IsPublic` flag (default `false`), stored on the domain entity
(`Domain/UserWheel.cs`, `BaseEntityUserWithConcurrency`) and exposed on the owner-facing
`DTO/Web/UserWheelDto.cs`. Every current API surface is authenticated: the global authorization
`FallbackPolicy` requires an authenticated user (`Web/Configuration/ServiceConfiguration.cs`), and
`UserWheelsController` is decorated `[ApiBearerAuthorize]`. Its reads flow through
`OwnershipScopedService.GetByIdAsync(id, actor)`, which fetches the row **unscoped**, then returns
`NotFound` when missing and `Forbidden` when `UserId != actor` — i.e. the current read path is
structurally incapable of serving another user's wheel, public or not (the existing `user-wheel` spec
codifies this: "IsPublic currently has no effect on access").

This change adds the first and only unauthenticated read surface: `GET /api/v1/public/wheels/{id}`,
returning a shared wheel's `Name` and `RestaurantNames` when `IsPublic == true`. It must not leak which
wheel ids exist and must be resistant to abuse, since it has no per-user accounting.

Constraints: follow the existing AppUser/UserWheel vertical-slice conventions (manual `IMapper`, service
layer over `OwnershipScopedService`/`BaseRepository`, RFC7807 `Problem` responses, `ApiRateLimitOptions`
+ `[EnableRateLimiting]` pattern). No database schema change — `IsPublic` and `RestaurantNames` already
exist.

## Goals / Non-Goals

**Goals:**
- Serve a single public wheel (`Name` + `RestaurantNames` only) to anonymous callers when `IsPublic`.
- Collapse "non-public" and "non-existent" into one indistinguishable `404` so ids cannot be enumerated.
- Never expose `UserId`, `Id`, `ConcurrencyToken`, or any other field on the public surface.
- Apply a dedicated rate-limit policy, stricter than the authenticated `api` policy, via the existing
  `ApiRateLimitOptions` pattern.
- Stay within the established layer conventions; no new architecture.

**Non-Goals:**
- Any write operation, or toggling `IsPublic` (already handled by the authenticated update endpoint).
- Listing or discovering public wheels.
- Changing the authenticated owner surface or the `user-wheel` spec's access semantics.
- Response caching / CDN concerns (may come later; not required here).

## Decisions

### 1. A new dedicated controller with `[AllowAnonymous]`, not a new action on `UserWheelsController`
`PublicWheelsController` under `Web/API/Controllers`, routed
`[Route("api/v{version:apiVersion}/public/wheels")]` with a single `[HttpGet("{id:guid}")]` →
`/api/v1/public/wheels/{id}`. It carries `[ApiController]`, `[ApiVersion(1.0)]`, `[Produces("application/json")]`
and, because the global `FallbackPolicy` requires authentication, an explicit `[AllowAnonymous]`. It
deliberately does **not** carry `[ApiBearerAuthorize]`.
- *Why a separate controller*: keeps the anonymous surface physically isolated from the bearer-only
  owner endpoints, so `[AllowAnonymous]` can never accidentally widen an authenticated action, and the
  distinct `/public/` route prefix makes the trust boundary obvious in logs and configuration.
- *Alternative rejected*: adding a `[AllowAnonymous]` action onto `UserWheelsController` — mixes trust
  levels in one class decorated `[ApiBearerAuthorize]`, inviting mistakes.

### 2. A new service method that fetches unscoped and gates on `IsPublic`, collapsing to `NotFound`
Add `GetPublicByIdAsync(Guid id)` to `IUserWheelService` / `UserWheelService`. It uses the repository's
**unscoped** `GetByIdAsync(id)` (the same base call `OwnershipScopedService.CheckOwnershipAsync` uses),
then: returns the wheel when it exists **and** `IsPublic == true`; otherwise returns a failure with
`ErrorDefaults.Codes.NotFound`. It never resolves or requires an actor and never returns `Forbidden`.
- *Why not reuse `GetByIdAsync(id, actor)`*: that path requires an actor and returns `Forbidden` for
  foreign-owned rows — exactly the leak (403 vs 404) this change must avoid, and it would reject every
  anonymous request.
- *Why collapse to `NotFound` in the service, not the controller*: the single failure code flows through
  the existing `IError.Code → 404` mapping unchanged, and the controller stays trivial (one success, one
  `404`). Both the missing and non-public branches perform the same single unscoped read, so they are
  indistinguishable by response **and** by timing.

### 3. A new minimal `PublicUserWheelDto` with a one-directional mapper
`DTO/Web/PublicUserWheelDto.cs` carries only `Name` (string) and `RestaurantNames` (`List<string>`) —
it does not inherit `BaseEntity*`, so it has no `Id`/`ConcurrencyToken`, and it has no `UserId` or
`IsPublic`. A `PublicUserWheelDtoMapper` (`DTO/Web/Mappers`) implements domain→DTO only, following the
manual `IMapper` convention (no AutoMapper).
- *Why a new DTO*: the owner-facing `UserWheelDto` exposes `Id`, `ConcurrencyToken`, and `IsPublic`;
  reusing it would leak fields by construction. A field the DTO does not declare cannot be serialized —
  the safest way to guarantee minimality is a type that only has the two allowed fields.
- *Why domain→DTO only*: the public surface is read-only; there is no inbound public payload to map.

### 4. A second rate-limit policy, stricter, expressed through the existing pattern
Add `RateLimitPolicies.PublicApi = "public-api"` and a second fixed-window limiter registered in
`Web/Program.cs` alongside the existing `api` limiter, fed by a second `ApiRateLimitOptions` instance
sourced from new env vars (e.g. `PUBLIC_RATE_LIMIT_PERMIT_LIMIT` / `_WINDOW_SECONDS` / `_QUEUE_LIMIT`)
in `RequiredConfiguration`, with stricter defaults than the authenticated `100/60s`. The controller is
decorated `[EnableRateLimiting(RateLimitPolicies.PublicApi)]`, reusing `RejectionStatusCode = 429`.
- *Why a separate policy rather than reusing `api`*: the authenticated `api` policy assumes per-user
  bearer tokens; an unauthenticated endpoint needs its own, tighter budget that cannot borrow authed
  headroom.
- *Partition by client IP*: the public limiter partitions on `HttpContext.Connection.RemoteIpAddress`
  (honouring the configured forwarded-headers/proxy setup) rather than a single global bucket, so one
  caller cannot starve the endpoint for everyone. Confirm the deployment's `ForwardedHeaders` config so
  `RemoteIpAddress` reflects the real client behind the reverse proxy.
- *Reuse `ApiRateLimitOptions` verbatim*: the `(PermitLimit, WindowSeconds, QueueLimit)` record already
  models everything needed; no new options type.

## Risks / Trade-offs

- **Existence enumeration via response differences** → Both the missing and non-public branches return
  an identical `404` Problem body through the same code path and perform the same single unscoped read,
  so responses match in status, body, and timing.
- **Unauthenticated abuse / DoS** → Dedicated stricter policy, `429` on breach, partitioned by client
  IP so a single source cannot exhaust the shared window. Numeric defaults chosen conservatively.
- **IP partitioning defeated by a misconfigured proxy** → If `ForwardedHeaders` is not set, all traffic
  appears to originate from the proxy IP and shares one bucket (fail-closed: over-throttles rather than
  under-throttles). Mitigation: verify forwarded-headers middleware is configured in the deployment.
- **Accidental field leak on the public DTO** → The DTO declares only the two permitted fields and does
  not inherit any base entity, so no `Id`/`ConcurrencyToken`/`UserId` exists to serialize; the mapper is
  domain→DTO only. A test asserts the serialized body contains no owner/identity keys.
- **`FallbackPolicy` silently re-securing the endpoint** → `[AllowAnonymous]` on the controller
  overrides the fallback (same mechanism as `/health`); an integration test hits the endpoint with no
  credentials to confirm it is reachable.

## Migration Plan

- Purely additive: no database migration (`IsPublic`, `RestaurantNames` already exist), no change to
  existing endpoints or the `user-wheel` spec's authenticated semantics.
- Deploy order is irrelevant to existing clients; the new route and env vars are new surface only.
- New env vars ship with stricter built-in defaults, so the endpoint is safe even if the deployment
  does not set them explicitly.
- **Rollback**: remove the controller, service method, DTO/mapper, and the added policy/config. No data
  or schema to revert; owners' `IsPublic` flags are untouched.

## Open Questions

- Exact numeric limits for the public policy (proposed starting point: a small permit count per short
  window, clearly below the authenticated `100/60s`) — confirm the target values with expected legitimate
  share-link traffic.
- Is the reverse-proxy `ForwardedHeaders` configuration already in place so per-IP partitioning sees real
  client IPs? If not, that wiring should accompany this change.
