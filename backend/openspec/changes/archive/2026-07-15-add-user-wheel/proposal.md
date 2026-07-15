## Why

Users want a saved, optionally shareable random-restaurant picker ("spin the wheel") that is independent
of the `DiningEnvironment`/`EnvironmentRestaurant` membership model - a wheel is a frozen list of
restaurant names captured at save time, not a live set of Restaurant references.

## What Changes

- Add `UserWheel` domain entity: `Name`, `RestaurantNames` (a frozen JSON array of restaurant name
  strings, stored as `jsonb` on Postgres - not a foreign-key list), `IsPublic` (bool, default false),
  user-owned via `BaseEntityUserWithConcurrency` (Domain) / `BaseEntityUserWithMetaConcurrency`
  (DataAccess EF entity), actor = `AppUser.Id`, same ownership-scoping mechanism already established for
  `DiningEnvironment`/`Favourite`.
- `RestaurantNames` is deliberately a snapshot, not a relationship: renaming or deleting a `Restaurant`
  later must not change a previously saved wheel, so there is no FK to `Restaurant` and no delete-behavior
  decision needed this time.
- `IsPublic` is persisted but inert in this change - it grants no additional access. Every read/update/
  delete still goes through the normal per-owner ownership check regardless of its value. The
  anonymous-read design for `IsPublic == true` wheels is an explicit follow-up, out of scope here.
- Implement the full vertical slice - Domain, DTO (DataAccess + Web + mappers), Contracts, DataAccess
  (repository, EF configuration, migration), Application (service), Web (API controller) - mirroring the
  existing `AppUser`/`DiningEnvironment`/`Favourite` vertical slice layer-for-layer.
- Reuse the existing actor-resolution infrastructure (`ICurrentActorAccessor`) - no new actor-resolution
  work needed.
- Cross-user access to another user's `UserWheel` fails with an explicit forbidden response, using the
  same unscoped-fetch-first pattern already established for `DiningEnvironment`/`Favourite`.
- Extract the now-four-times-duplicated ownership-check pattern (`DiningEnvironmentService`,
  `EnvironmentRestaurantService`, `FavouriteService`, and now `UserWheelService`) into a shared
  `OwnershipScopedService<TDomainEntity, TRepository>` base class in `Application`, per the deferred
  refactor flagged in the `add-favourite` design. `UserWheelService` is built directly on top of it; the
  three existing services are left as-is for now (see design.md for why).

## Capabilities

### New Capabilities
- `user-wheel`: user-owned saved random-restaurant picker with a frozen name snapshot, ownership
  scoping, and forbidden-vs-not-found semantics. `IsPublic` is persisted but has no behavioral effect
  yet.

### Modified Capabilities
- None. Unlike `DiningEnvironment`/`Favourite`, `UserWheel` has no foreign key to `Restaurant`, so there
  is no `restaurant-reference-data` delete-behavior change needed.

## Impact

- New files across Domain, DTO, Contracts, DataAccess, Application, Web for `UserWheel`, following the
  `AppUser`/`DiningEnvironment`/`Favourite` vertical-slice pattern.
- `AppDbContext`: one new table with a `jsonb` column for `RestaurantNames`, one new EF migration.
- New `Application/OwnershipScopedService.cs` shared base class; `UserWheelService` derives from it.
  `DiningEnvironmentService`/`EnvironmentRestaurantService`/`FavouriteService` are not touched by this
  change.
- Out of scope: any public/unauthenticated read endpoint for `IsPublic == true` wheels - a dedicated
  follow-up change once this CRUD shape exists.
