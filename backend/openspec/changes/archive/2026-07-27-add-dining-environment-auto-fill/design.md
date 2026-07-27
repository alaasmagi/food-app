## Context

`DiningEnvironment` is a user-owned grouping of restaurants, implemented as a full vertical slice
(Domain → DTO/DataAccess → DTO/Web → Contracts → DataAccess repository → Application service → Web API
controller) mirroring the authoritative AppUser slice. Memberships are `EnvironmentRestaurant` rows,
each owned by the same user, unique per `(DiningEnvironment, Restaurant)` pair. `Restaurant` is shared
reference data that already carries geographic coordinates (nullable latitude/longitude).

Today a user seeds an environment by POSTing one `EnvironmentRestaurant` at a time. This change lets a
user store an auto-fill origin (a map point plus radius) on the environment and trigger a one-shot
proximity import that adds all nearby restaurants as memberships. The client supplies coordinates
directly (it owns the map); the backend does no geocoding.

Constraints that shape the design:
- Ownership scoping is enforced by `alaasmagi.Base.DataAccess.EF.BaseRepository` actor scoping — cross-user
  reads are filtered and cross-user writes return FORBIDDEN. Do not bypass with direct DbContext access.
- Domain entities hold no metadata; only DataAccess EF entities do. `DiningEnvironment` is
  `BaseEntityUserWithConcurrency` (Domain) → `BaseEntityUserWithMetaConcurrency` (EF).
- Expected failures use the `IMethodResponse<T>` result pattern with `ErrorDefaults` codes, mapped to
  HTTP in the controller (VALIDATION→400, FORBIDDEN→403, NOT_FOUND→404, CONCURRENCY_CONFLICT→409).
- Mappers must never drop a field (a null return is treated as MAP_FAILED).

## Goals / Non-Goals

**Goals:**
- Add three optional nullable auto-fill fields to `DiningEnvironment` across all layers and both mappers.
- Enforce the write-path validation rules (both-or-neither coordinates; radius requires coordinates;
  coordinate range; radius range 1..50000; null radius persists as null).
- Add an owner-scoped `POST /api/v1/dining-environments/{id}/auto-fill` endpoint that additively imports
  in-radius restaurants as `EnvironmentRestaurant` memberships, using a haversine distance and a 500 m
  default radius applied at run time.
- Add one EF migration on `AppDbContext` adding three nullable columns to `dining_environments`.

**Non-Goals:**
- Geocoding an address string to coordinates (the client supplies coordinates).
- Removing out-of-radius members or otherwise syncing membership to the current radius.
- Any live/scheduled auto-add or push notification when new nearby restaurants appear later.
- A spatial index / PostGIS. A plain haversine over the modest restaurant set is acceptable at this scale.

## Decisions

### New capability rather than modifying the dining-environment spec
The auto-fill fields, their validation, and the endpoint form one cohesive concern. Existing
`dining-environment` requirements (CRUD, ownership, concurrency, cascade) are unchanged — the new fields
are additive and optional. Grouping the new behavior under a new `dining-environment-auto-fill`
capability keeps the delta focused and avoids re-stating unchanged requirements.
*Alternative considered:* fold everything into `dining-environment` as MODIFIED requirements — rejected
because no existing requirement's behavior actually changes, and MODIFIED risks losing detail at archive.

### Store the origin on DiningEnvironment; apply the 500 m default only at run time
The three fields live on the environment so the user can re-run auto-fill later without re-sending the
origin. Per the write rules, a null radius is stored as null; the 500 m default is substituted only when
auto-fill executes. This keeps the stored row honest (null means "unset", not "500") and lets the
default evolve without a data migration.
*Alternative considered:* persist 500 when radius is null — rejected because it silently invents data and
hides intent.

### Validation lives in the DiningEnvironment write path (service layer)
The both-or-neither, radius-requires-coordinates, and range checks are business rules, so they belong in
`DiningEnvironmentService` create/update, returning an `IMethodResponse` VALIDATION failure before
persisting — consistent with using the result pattern over exceptions. The controller maps VALIDATION to
400. Coordinate/radius bounds are also reasonable to assert here rather than via data annotations so the
same rules apply on create and update uniformly.
*Alternative considered:* data annotations on the Web DTO — rejected because cross-field rules
(both-or-neither, radius-requires-coordinates) are awkward as annotations and the service is the single
enforcement point already used for ownership.

### Haversine filter over restaurants with both coordinates
Auto-fill loads restaurants (shared reference data, open read) and computes great-circle distance from
the stored origin to each restaurant that has BOTH latitude and longitude; restaurants missing either
are skipped. In-radius restaurants not already members become new `EnvironmentRestaurant` rows via the
existing membership repository, reusing the same uniqueness guarantee that prevents duplicates. Distance
math can run in-memory over the fetched candidate set (small scale) or be pushed into SQL; either is
acceptable. A cheap bounding-box pre-filter on lat/long may narrow candidates before the exact haversine
if desired, but is not required.
*Alternative considered:* PostGIS/`geography` distance — rejected as overkill for the current scale and
an unnecessary new dependency; the design leaves room to adopt it later without changing the contract.

### Endpoint shape and return value
`POST /api/v1/dining-environments/{id}/auto-fill` on the existing `DiningEnvironmentsController`,
Bearer-authorized. It resolves the current actor, loads the owned environment (FORBIDDEN if another
user's, NOT_FOUND if absent), validates that coordinates are stored (400 otherwise), runs the import, and
returns a summary DTO: `{ added, alreadyPresent, totalMembers }`. Owner scoping is enforced by loading
the environment through the actor-scoped repository/service rather than a raw lookup.
*Alternative considered:* return the full membership list — a compact summary is enough for the client to
refresh; it can re-list memberships if it needs the full set.

## Risks / Trade-offs

- [In-memory haversine over all restaurants could get slow as the catalog grows] → Acceptable at current
  scale; a lat/long bounding-box pre-filter (indexable) can bound the candidate set, and the contract is
  unchanged if PostGIS is adopted later.
- [Auto-fill is not idempotent in effect as the catalog changes] → By design it is additive and
  re-runnable; the uniqueness guarantee on `(environment, restaurant)` makes re-running safe (no
  duplicates), and it never removes members.
- [Client sends coordinates but with axes swapped or out of range] → Range validation (-90..90 /
  -180..180) rejects impossible values; swapped-but-valid coordinates cannot be detected server-side and
  are the client's responsibility.
- [Radius cap chosen arbitrarily] → 50000 m prevents an absurd query while comfortably covering any real
  neighborhood/city-area use; it is enforced only when a radius is supplied.
- [Storing null radius but defaulting to 500 at run time could surprise a client expecting the effective
  value on read] → The read returns the stored null truthfully; the effective 500 m is an auto-fill-time
  concept and is documented as such.

## Migration Plan

1. Add the three nullable fields to Domain `DiningEnvironment`, the EF entity, the Web DTO, and both
   mappers.
2. Add one EF Core migration on `AppDbContext` adding `AutoFillLatitude` (double, null),
   `AutoFillLongitude` (double, null), and `AutoFillRadiusMeters` (int, null) to `dining_environments`.
   No new table; no `OfferCacheDbContext` change.
3. Deploy is backward compatible: all columns are nullable with no default, existing rows read as null,
   and existing write requests remain valid.
4. Rollback: the endpoint and validation are additive; reverting the code and dropping the three columns
   restores prior behavior with no data loss beyond unused auto-fill origins.

## Open Questions

- None blocking. If restaurant catalog growth later makes the in-memory scan costly, revisit with a
  bounding-box pre-filter or PostGIS `geography` distance without changing the endpoint contract.
