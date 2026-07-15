## Context

`DiningEnvironment`, `EnvironmentRestaurant`, and `Favourite` already established the ownership pattern
this change reuses: `BaseEntityUserWithConcurrency`/`BaseEntityUserWithMetaConcurrency`, the shared
`ICurrentActorAccessor`, and a service-layer unscoped-fetch check that turns cross-user access into an
explicit `FORBIDDEN` instead of relying on `BaseRepository`'s actor-scoped queries (which would otherwise
return `NOT_FOUND` for a foreign-owned row before any ownership check runs). `UserWheel` is the fourth
consumer of this exact pattern - the `add-favourite` design explicitly flagged this as the point where
extracting a shared helper would be worth doing, so this change follows through on that.

The other new piece is `RestaurantNames`: a frozen JSON snapshot rather than a live relationship. No
other entity in this codebase stores a JSON column yet, so the EF configuration for it is new, though
the underlying Npgsql/EF Core feature (`jsonb` column + value converter) is standard.

## Goals / Non-Goals

**Goals:**
- Let a user create, list, read, update, and delete their own `UserWheel` records.
- Persist `RestaurantNames` as an immutable-at-read-time snapshot with no FK to `Restaurant`, so
  renaming/deleting a `Restaurant` never retroactively changes a saved wheel.
- Keep cross-user access forbidden-vs-not-found semantics identical to `DiningEnvironment`/`Favourite`.
- Stop the ownership-check pattern from growing a fifth copy: extract it into a shared
  `OwnershipScopedService<TDomainEntity, TRepository>` base class and build `UserWheelService` on it.

**Non-Goals:**
- Any anonymous/public read path for `IsPublic == true` wheels. This change only persists the flag;
  designing "one specific owned resource is readable without authentication" is a distinct authorization
  problem (it doesn't fit the current "every endpoint requires an authenticated actor" global fallback
  policy) and belongs in its own change once the CRUD shape exists to build on.
- Retrofitting `DiningEnvironmentService`, `EnvironmentRestaurantService`, or `FavouriteService` onto the
  new shared base class. They keep their current (duplicated) implementations - see Decision 3 for why.
- Any validation/limit on the size or contents of `RestaurantNames` beyond what the proposal specifies -
  not requested, and inventing a cap would be a guess.

## Decisions

### 1. Base classes and actor resolution: identical to DiningEnvironment/Favourite
`UserWheel`/Domain -> `BaseEntityUserWithConcurrency`. `UserWheelEntity`/DataAccess ->
`BaseEntityUserWithMetaConcurrency`. Actor resolution reuses the existing `ICurrentActorAccessor`. No new
decision here - this is exactly the reuse the accessor was built for.

### 2. RestaurantNames: `jsonb` column via value converter, no FK to Restaurant
`UserWheelEntity.RestaurantNames` is `List<string>`, mapped with `HasColumnType("jsonb")` plus a
`System.Text.Json`-based `HasConversion` (serialize/deserialize the list) and an explicit `ValueComparer`
(so EF's change tracking correctly detects in-place list mutation via structural equality instead of
reference equality). There is no navigation property and no foreign key to `RestaurantEntity` anywhere in
this entity - the proposal is explicit that a saved wheel must survive a `Restaurant` rename or deletion
unchanged, which is only true if the stored data is plain strings, not ids. This also means, unlike
`DiningEnvironment`/`Favourite`, there is no `restaurant-reference-data` delete-behavior decision to make
for this change - there's nothing for a `Restaurant` delete to cascade or restrict.

Alternative considered: store `RestaurantNames` as a join table of frozen name rows (one row per name per
wheel), mirroring `EnvironmentRestaurant`'s shape. Rejected - that would still be relational modeling
for what the proposal explicitly frames as an opaque, ordered snapshot value; a JSON column matches the
actual semantics (an ordered list of strings with no independent identity per element) and avoids a
pointless child table.

### 3. Forbidden vs. not-found, extracted into a shared `OwnershipScopedService<TDomainEntity, TRepository>`
Previously (`DiningEnvironmentService`, `EnvironmentRestaurantService`, `FavouriteService`), each service
duplicated the same three-method override (`GetByIdAsync`/`UpdateAsync`/`RemoveAsync`) plus a private
`CheckOwnershipAsync` helper. This change extracts that into
`Application/OwnershipScopedService.cs`:

```csharp
public abstract class OwnershipScopedService<TDomainEntity, TRepository>
    : BaseService<TDomainEntity, TDomainEntity, TRepository>
    where TDomainEntity : class, IBaseEntity<Guid>, IBaseEntityUserId<Guid>
    where TRepository : class, IBaseRepository<TDomainEntity, Guid, Guid>
```

It overrides `GetByIdAsync`/`UpdateAsync`/`RemoveAsync` with the same unscoped-fetch-then-compare-UserId
logic as before, using the protected `ServiceRepository` field `BaseService` already exposes (no need for
each subclass to hold its own private repository field just for the ownership check). `UserWheelService`
becomes a near-empty class that just supplies the identity mapper and constructor wiring, exactly like
`AppUserService`/`RestaurantService` today.

**Existing services are intentionally left untouched.** Retrofitting `DiningEnvironmentService` /
`EnvironmentRestaurantService` / `FavouriteService` onto this base class is a pure refactor of
already-shipped, unrelated code with no functional change - bundling it into "add UserWheel" would widen
the blast radius of this change's review and testing surface for no behavioral benefit. It's a
reasonable follow-up cleanup, not a blocker, and is called out explicitly so it doesn't get lost (see
Risks/Trade-offs).

Alternative considered: keep duplicating the pattern a fourth time and defer extraction again. Rejected -
the `add-favourite` design already flagged this exact trigger point ("once UserWheel makes it a fourth
occurrence"); deferring indefinitely defeats the point of having flagged it.

## Risks / Trade-offs

- **Two implementations of the same ownership-check logic now coexist** (the new shared base class for
  `UserWheelService`, and the duplicated inline version in the three existing services) -> acceptable
  short-term inconsistency; the follow-up cleanup (retrofit the three existing services onto
  `OwnershipScopedService`) is low-risk pure refactoring and can happen whenever it's convenient,
  independent of any further capability work.
- **`jsonb` value converter correctness depends on a working `ValueComparer`** -> without it, EF Core
  would not detect in-place mutations to the `List<string>` (only reassignment of the whole property), a
  subtle bug class for change-tracked updates; mitigated by configuring the comparer explicitly as part
  of this change rather than accepting the EF default reference-equality behavior for the property.
- **No validation on `RestaurantNames` size/content** -> acceptable per the explicit Non-Goal; if this
  becomes a real problem (e.g. very large payloads), it's a small follow-up `[MaxLength]`-style guard,
  not a design change.

## Migration Plan

- One new EF Core migration against `AppDbContext` (PostgreSQL) creating a `UserWheels` table under the
  existing `app` schema, with `RestaurantNames` as a `jsonb` column, following the same convention as the
  `Favourites`/`DiningEnvironments` migrations.
- No backfill needed - the table is new and starts empty.
- Rollback is the standard EF `Down()` migration (drop the table); no data migration risk.

## Open Questions

None - `RestaurantNames` storage (Decision 2) and the ownership-check duplication (Decision 3) are both
resolved above rather than left open.
