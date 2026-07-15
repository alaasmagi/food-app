## Why

Restaurant and OfferProvider are shared reference data, but a user has no way yet to organize that
catalog into their own personal groupings (e.g. "Work", "Home"). Favourite and the daily recommendation
UI that arrive later both need a per-user grouping concept to build on, so DiningEnvironment and its
membership relation need to exist first.

## What Changes

- Add `DiningEnvironment` domain entity: `Name`, `Description` (nullable), user-owned via
  `BaseEntityUserWithConcurrency` (Domain) / `BaseEntityUserWithMetaConcurrency` (DataAccess EF entity),
  actor = `AppUser.Id`.
- Add `EnvironmentRestaurant` domain entity: `EnvironmentId` (FK to `DiningEnvironment`), `RestaurantId`
  (FK to `Restaurant`), same user-owned base classes as `DiningEnvironment`. No offer/wheel flags -
  those concerns stay on `Restaurant.HasOffers` and the future `UserWheel`.
- Enforce a per-user uniqueness constraint: a given `RestaurantId` can appear at most once within the
  same `EnvironmentId` for the same owning user.
- Deleting a `DiningEnvironment` cascades to its own `EnvironmentRestaurant` rows (membership rows have
  no independent meaning once their environment is gone).
- Deleting a `Restaurant` cascades removal of any `EnvironmentRestaurant` memberships that reference it.
  This intentionally does **not** mirror the `OfferProvider` <-> `Restaurant` restrict pattern - see
  design.md for the reasoning (personal grouping data vs. reference-on-reference data).
- Implement the full vertical slice for both entities - Domain, DTO (DataAccess + Web + mappers),
  Contracts, DataAccess (repository, EF configuration, migration), Application (service), Web (API
  controller) - mirroring the existing `AppUser` slice layer-for-layer.
- Introduce the missing actor-resolution infrastructure: the current authenticated user's Keycloak
  `sub` claim (== `AppUser.Id`) must be read from the request and threaded into service/repository
  calls as the actor, since no entity in this codebase currently uses the ownership-scoped
  `BaseEntityUser*` base classes or ownership-aware controller wiring.
- Ensure cross-user access to another user's `DiningEnvironment` or `EnvironmentRestaurant` fails with
  an explicit forbidden response rather than a plain not-found, closing the gap where
  `BaseRepository`'s built-in actor scoping alone would only produce not-found on reads.

## Capabilities

### New Capabilities
- `dining-environment`: user-owned grouping of restaurants (DiningEnvironment) and its
  restaurant-membership relation (EnvironmentRestaurant), including ownership scoping, forbidden-vs-not-found
  semantics, uniqueness, and cascade/restrict delete behavior.

### Modified Capabilities
- `restaurant-reference-data`: deleting a Restaurant now cascades removal of any `EnvironmentRestaurant`
  memberships that reference it.

## Impact

- New files across Domain, DTO, Contracts, DataAccess, Application, Web for `DiningEnvironment` and
  `EnvironmentRestaurant`, following the `AppUser`/`Restaurant` vertical-slice pattern.
- `AppDbContext`: two new tables, FK/index/delete-behavior configuration, one new EF migration.
- New actor-resolution component (reads the Keycloak `sub` claim from the authenticated request) plus
  changes to how `DiningEnvironment`/`EnvironmentRestaurant` controllers and services pass the actor
  down into `BaseRepository` calls - this is new infrastructure, not a copy of existing code.
- `AppDbContext`: `EnvironmentRestaurant` -> `Restaurant` FK configured with `DeleteBehavior.Cascade`
  (in contrast to the `Restrict` used for `Restaurant` -> `OfferProvider`).
- Out of scope: `Favourite`, `UserWheel`, and the daily recommendation email.
