## Why

Users want to rate and note a Restaurant independent of which DiningEnvironment(s) it appears in - a
restaurant is rated once per user, not once per environment. `DiningEnvironment`/`EnvironmentRestaurant`
already let users group restaurants; `Favourite` adds the other personal signal (rating + note) that the
daily recommendation feature will eventually read from.

## What Changes

- Add `Favourite` domain entity: `RestaurantId` (FK), `Rating` (int, 1-5, validated), `Note` (nullable
  string), user-owned via `BaseEntityUserWithConcurrency` (Domain) / `BaseEntityUserWithMetaConcurrency`
  (DataAccess EF entity), actor = `AppUser.Id`, same ownership-scoping mechanism already established for
  `DiningEnvironment`/`EnvironmentRestaurant`.
- Enforce one `Favourite` per `(UserId, RestaurantId)` pair. Submitting a create request for a
  restaurant the user has already favourited updates the existing row (new Rating/Note) instead of
  creating a duplicate - this is an upsert-on-create, not a rejected duplicate (contrast with
  `EnvironmentRestaurant`'s duplicate-is-rejected behavior, since a rating is inherently a single current
  value per user per restaurant, not a repeatable membership).
- Deleting a `Restaurant` cascades removal of any `Favourite` referencing it, consistent with the
  `EnvironmentRestaurant` precedent - `Favourite` is private per-user data, not reference data, so it
  should not block an admin's Restaurant deletion.
- Implement the full vertical slice - Domain, DTO (DataAccess + Web + mappers), Contracts, DataAccess
  (repository, EF configuration, migration), Application (service), Web (API controller) - mirroring the
  existing `AppUser`/`DiningEnvironment` vertical slice layer-for-layer.
- Reuse the existing actor-resolution infrastructure (`ICurrentActorAccessor`) introduced for
  `DiningEnvironment` - no new actor-resolution work needed.
- Cross-user access to another user's `Favourite` fails with an explicit forbidden response, using the
  same unscoped-fetch-first pattern already established for `DiningEnvironment`/`EnvironmentRestaurant`.

## Capabilities

### New Capabilities
- `favourite`: user-owned rating and note for a Restaurant, independent of any DiningEnvironment,
  including ownership scoping, forbidden-vs-not-found semantics, one-per-restaurant upsert behavior, and
  cascade delete when the referenced Restaurant is removed.

### Modified Capabilities
- `restaurant-reference-data`: deleting a Restaurant now also cascades removal of any `Favourite`
  records that reference it.

## Impact

- New files across Domain, DTO, Contracts, DataAccess, Application, Web for `Favourite`, following the
  `AppUser`/`DiningEnvironment` vertical-slice pattern.
- `AppDbContext`: one new table, FK/index/delete-behavior configuration, one new EF migration.
- `Application`: `FavouriteService.CreateAsync` override implements the upsert-by-restaurant behavior
  (find existing row for `(actor, RestaurantId)`, update it in place if found, otherwise create).
- `AppDbContext`: `Favourite` -> `Restaurant` FK configured with `DeleteBehavior.Cascade`, matching the
  `EnvironmentRestaurant` -> `Restaurant` precedent (not the `Restrict` used for `OfferProvider` ->
  `Restaurant`).
- Out of scope: `DiningEnvironment`, `EnvironmentRestaurant`, `UserWheel`, the daily recommendation
  email.
