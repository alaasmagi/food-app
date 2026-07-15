## Context

`DiningEnvironment`/`EnvironmentRestaurant` already established the pattern this change reuses:
`BaseEntityUserWithConcurrency`/`BaseEntityUserWithMetaConcurrency` for ownership, `ICurrentActorAccessor`
for resolving the current Keycloak-identity actor from the request, and a service-layer unscoped-fetch
check that turns cross-user access into an explicit `FORBIDDEN` instead of relying on
`BaseRepository`'s actor-scoped queries, which would otherwise return `NOT_FOUND` for a foreign-owned row
before any ownership check runs (`BaseRepository.GetByIdAsync`/`RemoveAsync` filter by actor first;
`UpdateAsync`'s own `FORBIDDEN` branch is unreachable once the row is already excluded by that filter).
`Favourite` is a new entity but not new territory - it's the second consumer of this exact pattern.

The one genuinely new piece is the one-per-restaurant upsert behavior: unlike every other entity in this
codebase (including `EnvironmentRestaurant`, which rejects a duplicate create), a second `Favourite`
create request for a restaurant the user already rated must update the existing row rather than error or
duplicate.

## Goals / Non-Goals

**Goals:**
- Let a user create/update (via upsert), list, read, and delete their own `Favourite` records.
- Guarantee exactly one `Favourite` per `(UserId, RestaurantId)` pair, with a create-time upsert path so
  the client doesn't need to look up an existing row's id/concurrency token before "re-rating" a
  restaurant.
- Keep cross-user access forbidden-vs-not-found semantics identical to `DiningEnvironment`.
- Keep the six-layer implementation identical in shape and conventions to the existing
  `AppUser`/`DiningEnvironment` vertical slices.

**Non-Goals:**
- `DiningEnvironment`, `EnvironmentRestaurant`, `UserWheel`, the daily recommendation email - explicitly
  out of scope.
- Extracting a shared base class/helper for the ownership-check pattern now duplicated across
  `DiningEnvironmentService`, `EnvironmentRestaurantService`, and (after this change)
  `FavouriteService`. Worth doing once `UserWheel` makes it a fourth occurrence, but out of scope here -
  see Risks/Trade-offs.

## Decisions

### 1. Base classes and actor resolution: identical to DiningEnvironment
`Favourite`/Domain -> `BaseEntityUserWithConcurrency`. `FavouriteEntity`/DataAccess ->
`BaseEntityUserWithMetaConcurrency`. Actor resolution reuses the existing `ICurrentActorAccessor` - no
new infrastructure needed, this is exactly why that accessor was built generically rather than coupled
to `DiningEnvironment`.

### 2. Forbidden vs. not-found: same unscoped-fetch-first pattern as DiningEnvironmentService
`FavouriteService` overrides `GetByIdAsync`/`UpdateAsync`/`RemoveAsync` to fetch the row unscoped first
(`ServiceRepository.GetByIdAsync(id)` with no actor, which skips `BaseRepository`'s ownership filter),
returning `NOT_FOUND` if the row doesn't exist at all and `FORBIDDEN` if it exists but
`UserId != actor`, otherwise delegating to the base actor-scoped implementation. No alternative
considered - this is a direct application of the precedent, not a new decision.

### 3. Upsert-on-create: service-layer find-then-update, not a relaxed unique constraint
`FavouriteService.CreateAsync` is overridden to:
1. Look up an existing `Favourite` for `(actor, entity.RestaurantId)` via a new repository method,
   `IFavouriteRepository.GetByRestaurantAsync(Guid restaurantId, Guid actor, CancellationToken ct)`,
   which queries `AppDbContext.Favourites` directly (scoped by both `UserId` and `RestaurantId`, actor-
   scoped by construction rather than relying on `BaseRepository`'s generic scoping since this is a
   lookup by a non-primary-key tuple).
2. If found: call `base.UpdateAsync(existing.Id, entity, existing.ConcurrencyToken, actor)` - the
   service supplies the *current* concurrency token itself (just read a moment earlier), so the caller
   of the upsert-create endpoint never needs to know the existing row's id or token. This is a
   read-modify-write performed transparently by the service, not a bypass of concurrency checking at
   the repository level - `BaseRepository.UpdateAsync`'s `ValidateConcurrencyToken` still runs and still
   protects against a genuinely stale write in between the service's read and write (a narrow race
   window under concurrent double-submits from the same user, which is an acceptable trade-off for a
   personal rating value - see Risks/Trade-offs).
3. If not found: call `base.CreateAsync(entity, actor)` as normal.

Alternative considered: enforce uniqueness only via a DB unique constraint and let the create fail with
a duplicate-key/concurrency-style error, forcing the client to catch that and issue a follow-up PUT.
Rejected - the proposal explicitly asks for the second create to transparently update the existing row,
and pushing a retry-as-update dance onto every API client is worse UX than resolving it server-side once.

The unique index on `(UserId, RestaurantId)` is kept anyway (see Decision 4) as a defense-in-depth
backstop in case of a genuine race between two concurrent create calls that both miss each other's
in-flight insert - the loser gets a DB-level constraint violation surfaced as a 500, an acceptable rare
edge case given ratings are low-stakes, idempotent-in-intent data.

### 4. Uniqueness: unique index on `(UserId, RestaurantId)`
Mirrors the `EnvironmentRestaurant` unique-index approach (Decision 4 in that change's design) - scoped
by `UserId` explicitly even though it's logically redundant once combined with a per-user query, for the
same self-describing-constraint reasoning.

### 5. Delete behavior: `Restaurant` -> `Favourite` is `Cascade`, not `Restrict`
Same reasoning as the `Restaurant` -> `EnvironmentRestaurant` decision already made in the
`add-dining-environment` change: `Favourite` is private per-user data, not reference data another piece
of reference data depends on, so blocking a `Restaurant` delete on the existence of other users' private
ratings would be an operational dead end (the admin has no visibility into who has favourited what).
Cascading is unambiguous here and not treated as an open question - it directly follows the established
precedent rather than re-deriving it.

## Risks / Trade-offs

- **Read-modify-write race on concurrent double-submit of the same upsert-create request** (Decision 3)
  -> narrow window, low-stakes data (a rating), and the DB unique index still prevents a true duplicate
  row from ever being persisted even if both requests raced past the initial lookup - mitigated
  sufficiently without adding locking.
- **Ownership-check pattern now duplicated a third time** (`DiningEnvironmentService`,
  `EnvironmentRestaurantService`, `FavouriteService`) -> acceptable for now since each occurrence is
  small and mechanical; flagged as a candidate for extraction into a shared base/helper once `UserWheel`
  makes it a fourth occurrence, deliberately deferred rather than bundled into this change (see
  Non-Goals) to avoid touching already-shipped, unrelated service files as a side effect of adding
  `Favourite`.
- **Rating bounds (1-5) enforced only via `[Range]` on the Web DTO and DataAccess entity, not in Domain**
  -> consistent with this codebase's existing convention (validation lives in DataAnnotations checked by
  ASP.NET Core's automatic model-state validation and by the database column constraint, not in
  hand-written Domain logic); acceptable since every other validated field in this codebase follows the
  same pattern.

## Migration Plan

- One new EF Core migration against `AppDbContext` (PostgreSQL) creating a `Favourites` table under the
  existing `app` schema, following the same convention as the `DiningEnvironments`/
  `EnvironmentRestaurants` migration.
- No backfill needed - the table is new and starts empty.
- Rollback is the standard EF `Down()` migration (drop the table); no data migration risk.

## Open Questions

None - the two design points that could have been open questions (upsert mechanics, Restaurant delete
behavior) are resolved in Decisions 3 and 5 by direct application of existing precedent in this
codebase.
