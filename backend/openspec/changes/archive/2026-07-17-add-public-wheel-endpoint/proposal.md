## Why

`UserWheel.IsPublic` already exists and defaults to false, but nothing lets an unauthenticated
visitor actually view a wheel that a user has marked public — sharing was deliberately deferred when
`UserWheel` was first built. This change delivers the missing read surface so a shared wheel link
resolves for anyone, while keeping the exposed data minimal and the endpoint hard to abuse.

## What Changes

- Add a new **unauthenticated** endpoint `GET /api/v1/public/wheels/{id}` — no `[Authorize]`
  attribute, no cookie, no bearer token required. It is the only unauthenticated read surface in the
  API.
- The endpoint returns only `Name` and `RestaurantNames` when the wheel exists and its `IsPublic` is
  `true`.
- The endpoint returns **404** (not 403) when the wheel does not exist **or** exists but has
  `IsPublic == false`. The two cases are indistinguishable in the response, so callers cannot probe
  which wheel ids exist.
- Introduce a deliberately minimal public DTO carrying only `Name` and `RestaurantNames`. It never
  exposes `UserId`, `Id`, `ConcurrencyToken`, or any other field, and is separate from the existing
  owner-facing UserWheel Web DTO.
- Apply a dedicated, stricter rate limit to this endpoint using the existing `ApiRateLimitOptions`
  pattern, tighter than the authenticated endpoints since there is no per-user accounting to fall
  back on.

Out of scope: any write operation, any listing of public wheels, and revoking a share (toggling
`IsPublic` back to false through the existing authenticated update endpoint already achieves that).

## Capabilities

### New Capabilities
- `public-wheel-sharing`: Unauthenticated, rate-limited read access to a single `UserWheel` that its
  owner has marked public, exposing only its Name and RestaurantNames and leaking nothing about the
  existence of non-public or non-existent wheels.

### Modified Capabilities
<!-- None. The existing user-wheel requirements govern the authenticated owner surface and are
     unchanged: IsPublic still has no effect on authenticated cross-user access, and the new public
     read lives on a separate, unauthenticated endpoint rather than any existing UserWheel endpoint. -->

## Impact

- **New code**: a public wheel controller under `Web/API/Controllers`, a minimal public wheel Web DTO
  and its mapper under `DTO/Web`, a service method (on `UserWheelService`/`IUserWheelService`) that
  fetches a wheel by id only when public, and a named rate-limit policy.
- **Configuration**: an added stricter limit in the `ApiRateLimitOptions` pattern and its wiring in
  `Web/Program.cs`.
- **Security surface**: introduces the API's first and only unauthenticated read endpoint; the 404
  collapse and the rate limit are the mitigations for enumeration and abuse.
- No database schema change — `UserWheel.IsPublic` and `RestaurantNames` already exist.
