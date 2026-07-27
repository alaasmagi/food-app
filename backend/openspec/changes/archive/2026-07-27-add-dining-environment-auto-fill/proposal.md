## Why

Building a `DiningEnvironment` today means adding restaurants one membership at a time. Users who
organize by locality (a neighborhood, an office area) want to seed an environment with every
restaurant near a point they pick on a map in one action, then optionally re-run it later as new
restaurants are added to the shared catalog.

## What Changes

- `DiningEnvironment` gains three optional, nullable fields describing a saved auto-fill origin:
  - `AutoFillLatitude` (`double?`)
  - `AutoFillLongitude` (`double?`)
  - `AutoFillRadiusMeters` (`int?`)
  - Added to the Domain model, the DataAccess EF entity, the Web DTO, and both mappers (Domain↔EF,
    Domain↔Web), each field carried through without being silently dropped.
- Validation on the `DiningEnvironment` create/update write path:
  - `AutoFillLatitude` and `AutoFillLongitude` are both-or-neither — supplying one without the other
    is a validation error.
  - `AutoFillRadiusMeters` may only be present when coordinates are present — a radius without
    coordinates is a validation error.
  - Latitude must be within [-90, 90] and longitude within [-180, 180] when supplied.
  - `AutoFillRadiusMeters`, when supplied, must be a positive integer within a sane cap
    (1..50000 meters) to prevent an unbounded query.
  - When coordinates are set but radius is null, radius is persisted as null; the 500-meter default
    is applied only at auto-fill time — the default is never silently written to the row.
- New endpoint `POST /api/v1/dining-environments/{id}/auto-fill`:
  - Authorized and owner-scoped — a user may only auto-fill their own environment; targeting another
    user's environment returns FORBIDDEN.
  - Reads the environment's stored `AutoFill*` values; if the environment has no coordinates, returns
    a validation error (400) stating auto-fill is unavailable without a location.
  - Computes great-circle (haversine) distance from the stored point to every `Restaurant` that has
    BOTH `Latitude` and `Longitude` set; restaurants missing either coordinate are silently skipped.
  - Adds every in-radius restaurant not already a member as an `EnvironmentRestaurant`; never removes
    existing members that fall outside the radius (additive one-shot import, not a sync) and never
    creates a duplicate membership.
  - Returns a summary of the result (number added, number already present, resulting membership count).
- Auto-fill is a one-shot explicit action. Storing the `AutoFill*` values only enables the user to
  re-run it; the backend never adds restaurants on its own.
- **BREAKING**: none. All new fields are optional/nullable and existing write requests remain valid.

## Capabilities

### New Capabilities
- `dining-environment-auto-fill`: The saved auto-fill origin (latitude, longitude, radius) on a
  `DiningEnvironment`, its write-path validation rules, and the owner-scoped proximity auto-fill
  endpoint that adds in-radius restaurants as memberships.

### Modified Capabilities
<!-- None. Existing dining-environment requirements are unchanged; the new optional fields and the
     auto-fill endpoint are additive and covered by the new capability above. -->

## Impact

- **Domain**: `DiningEnvironment` gains three nullable fields.
- **DataAccess**: `DiningEnvironment` EF entity gains three nullable columns; a new EF migration adds
  `AutoFillLatitude`, `AutoFillLongitude`, `AutoFillRadiusMeters` to the `dining_environments` table
  (no new table). Restaurant coordinate reads and `EnvironmentRestaurant` inserts are reused.
- **DTO**: `DiningEnvironment` Web DTO and both mappers carry the new fields; a small result DTO for
  the auto-fill summary.
- **Contracts / Application**: `DiningEnvironmentService` (or a focused auto-fill service) gains the
  validation on writes and an auto-fill operation using the `EnvironmentRestaurant` repository and a
  haversine distance filter over restaurants.
- **Web**: `DiningEnvironmentsController` gains the `POST {id}/auto-fill` action, Bearer-authorized,
  mapping IMethodResponse failures (FORBIDDEN→403, NOT_FOUND→404, VALIDATION→400) as elsewhere.
- No changes to authentication, messaging, the offer cache, or the frontend contract beyond the new
  DTO fields and endpoint.
