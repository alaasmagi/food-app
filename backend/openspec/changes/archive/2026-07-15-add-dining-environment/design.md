## Context

`Restaurant` and `OfferProvider` are shared, admin-managed reference data with no ownership concept.
`DiningEnvironment`/`EnvironmentRestaurant` are the first entities in this codebase that need to be
scoped to an individual Keycloak-identity user. Research against the existing code turned up two gaps
that this design has to close rather than just mirror:

1. **`BaseEntityUser*` base classes exist in `alaasmagi.Base.Domain`/`alaasmagi.Base.DataAccess.EF` but
   are not used anywhere yet.** `AppUser`, `Restaurant`, and `OfferProvider` all sit on the non-user
   base classes. `DiningEnvironment`/`EnvironmentRestaurant` will be the first real usage of the
   ownership-scoped variants.
2. **No actor/current-user-id resolution exists anywhere in the Web layer.** `BaseRepository`'s
   ownership scoping takes an `actor` parameter on every call; nothing in this codebase currently reads
   the authenticated Keycloak identity from `HttpContext` and passes it down as that actor. This has to
   be built as new, small infrastructure.

Additionally, `BaseRepository`'s actor scoping (per its `alaasmagi-base-nuget` source) filters every
read query by `actor`, so a request for another user's row already comes back empty before any
ownership check runs - `GetByIdAsync`/`RemoveAsync` on a foreign-owned id therefore surface as
`NOT_FOUND`, not `FORBIDDEN`. `UpdateAsync` has an explicit `FORBIDDEN` branch, but it fetches the
"existing" row through the same actor-scoped query first, so a foreign-owned row is already excluded by
then and that branch is effectively unreachable in practice. The proposal requires an explicit forbidden
response on cross-user access rather than a plain not-found, so this design adds a thin app-level check
to produce that signal deliberately instead of relying on the (currently dead) library-level branch.

## Goals / Non-Goals

**Goals:**
- Let a user create, list, read, update, and delete their own `DiningEnvironment` records and manage
  `EnvironmentRestaurant` membership rows within them.
- Guarantee no user can read, modify, or delete another user's `DiningEnvironment`/`EnvironmentRestaurant`
  rows, and that an attempt to do so on a resource that exists (but belongs to someone else) is
  reported as forbidden, distinguishable from a resource that does not exist at all.
- Introduce the minimum actor-resolution plumbing needed to make ownership scoping work end-to-end,
  reusable by `Favourite`/`UserWheel` later.
- Keep both entities' six-layer implementation (Domain/DTO/Contracts/DataAccess/Application/Web)
  identical in shape and conventions to the existing `AppUser` vertical slice.

**Non-Goals:**
- `Favourite`, `UserWheel`, and the daily recommendation email - explicitly out of scope.
- Wiring `AddKeycloakJwtBearer` for bearer-token API clients. Today only `AddKeycloakOidc` (cookie
  scheme) is registered; API controllers currently authenticate via that same cookie principal. This
  design reads claims off `HttpContext.User` regardless of which scheme populated it, so it works today
  and continues to work unmodified once a bearer scheme is added later - but adding that scheme is a
  separate, pre-existing gap this change does not attempt to close.
- Changing `OfferProvider` <-> `Restaurant` delete behavior (stays `Restrict`, unchanged).

## Decisions

### 1. Base classes: use the dormant `BaseEntityUser*` hierarchy as specified
`DiningEnvironment`/Domain -> `BaseEntityUserWithConcurrency` (adds `UserId` + `ConcurrencyToken`).
`DiningEnvironmentEntity`/DataAccess -> `BaseEntityUserWithMetaConcurrency` (adds `UserId` + audit
fields + `ConcurrencyToken`). Same pair for `EnvironmentRestaurant`. `UserId` on both is the actor key
(`Guid`, matching `AppUser.Id`). This is a straightforward application of already-published,
already-tested base classes; no alternative was considered since the base library already provides
exactly this shape and the project's own conventions require reusing it rather than reimplementing.

### 2. Actor resolution: a small `ICurrentActorAccessor` reading the `sub` claim
Add `Contracts/Application/ICurrentActorAccessor.cs` (`Guid GetActorId()` or similar) and an
implementation in `Application` backed by `IHttpContextAccessor` (already registered in
`ServiceConfiguration.AddApplicationAuthentication`). It reads the Keycloak subject claim
(`ClaimTypes.NameIdentifier` / `"sub"`, whichever the Keycloak middleware surfaces - confirmed during
implementation against an actual token) and parses it as the `Guid` actor id. This is exactly the same
identity value `RabbitMqEventHandler` already uses as `AppUser.Id` when provisioning users from Keycloak
events, so no new identity mapping is introduced - it is the same id, read from a different transport
(JWT/cookie claim vs. event payload).

Controllers for `DiningEnvironment`/`EnvironmentRestaurant` inject this accessor and pass its value as
the `actor` argument on every service/repository call, the same way `AppUsersController` etc. pass no
actor today (because their entities aren't user-owned). No other controller changes.

Alternative considered: deriving the actor inside the repository layer via `IHttpContextAccessor`
directly. Rejected - repositories should stay HTTP-agnostic (they're also invoked from
`RabbitMqEventHandler`, a non-HTTP context), so actor resolution belongs in Web/Application, not
DataAccess.

### 3. Forbidden vs. not-found: explicit unscoped ownership check in the service layer
For `GetById`, `Update`, and `Remove`, `DiningEnvironmentService`/`EnvironmentRestaurantService` first
fetch the row **unscoped** (call the repository's `GetByIdAsync` without an actor, which per
`BaseRepository.ShouldUseUserId` skips the ownership filter entirely) to distinguish the three possible
outcomes explicitly:
- row does not exist at all -> `NOT_FOUND`
- row exists, `UserId != actor` -> `FORBIDDEN`
- row exists, `UserId == actor` -> proceed with the normal actor-scoped repository call for the actual
  read/update/delete

This mirrors the existing convention of adding a small domain-level guard in the service layer on top of
`BaseRepository` (see `OfferProviderService.RemoveAsync`'s referenced-by check) rather than modifying
the shared `alaasmagi.Base.DataAccess.EF` package. `List` endpoints do not need this check - actor-scoped
filtering silently returning only the caller's own rows is correct there (there is no single "resource"
being requested that could leak an existence signal).

Alternative considered: rely solely on `BaseRepository`'s built-in scoping and accept `NOT_FOUND` for
cross-user access (no data leaks either way - existence of a foreign row is technically observable via
the 403-vs-404 distinction itself, but the proposal explicitly calls for forbidden semantics). Rejected
because the change requirements are explicit that cross-user access must surface as forbidden, not be
indistinguishable from a missing resource.

### 4. Uniqueness: `EnvironmentRestaurant` unique index on `(UserId, EnvironmentId, RestaurantId)`
A given `RestaurantId` may appear once per `EnvironmentId` per user. Since ownership is already carried
on the row (`UserId`), the unique index is scoped by all three columns (not just `EnvironmentId` +
`RestaurantId`) purely for defense-in-depth consistency with how every other query on this table is
actor-scoped - in practice `EnvironmentId` already belongs to exactly one user, so `UserId` is
redundant with it, but including it keeps the constraint self-describing without depending on a join to
`DiningEnvironment` to reason about correctness.

### 5. Delete behavior: `DiningEnvironment` -> `EnvironmentRestaurant` is `Cascade`; `Restaurant` ->
`EnvironmentRestaurant` is also `Cascade` (not `Restrict`)
- `DiningEnvironment` deleted -> its own `EnvironmentRestaurant` rows are meaningless without their
  parent grouping, so cascading is unambiguous and was not in question.
- `Restaurant` deleted by an admin -> the open design question. Decision: **cascade**, not restrict,
  diverging from the `OfferProvider` <-> `Restaurant` precedent. Reasoning:
  - `OfferProvider` is Restrict because it is reference data depended on by other reference data
    (`Restaurant.OfferProviderId`) - an admin deleting shared parsing config out from under restaurants
    that still use it would silently break a system-wide feature (offer fetching), so blocking the
    delete until the admin deliberately unlinks it is the correct, safety-first behavior for that
    reference-to-reference relationship.
  - `EnvironmentRestaurant` is different in kind: it is private, per-user bookkeeping with no
    functional dependency running the other way. Losing a membership row when its target restaurant is
    removed from the catalog is low-stakes (the user can simply add a different restaurant to the same
    environment) and has no system-wide effect.
  - Restrict here would mean an admin cannot delete a defunct/erroneous `Restaurant` record until every
    affected user's private `EnvironmentRestaurant` rows are located and removed first - something the
    admin has no visibility into (these are private per-user rows) and has no reasonable path to
    discover or manage. That is an operational dead end with no corresponding safety benefit.
  - Cascade keeps `Restaurant` deletion admin-controlled (still requires the admin role and a valid
    concurrency token, unchanged) while not entangling reference-data lifecycle with every user's
    private groupings.

## Risks / Trade-offs

- **First real use of `BaseEntityUser*` and of actor-scoped repository calls in this codebase** ->
  mitigated by keeping the actor-resolution component small and localized (one accessor, injected only
  where needed) and by writing integration-style tests that specifically hit the base-package scoping
  behavior (list only returns own rows; get/update/delete another user's row returns forbidden, not a
  500 or a leak of data).
- **Relying on `BaseRepository`'s undocumented actor-omission behavior (`ShouldUseUserId` returning
  false when `actor` is `default`) to obtain an "unscoped" fetch** -> this is reading current library
  behavior rather than a documented contract; mitigated by covering it with a repository-level test
  against the real `alaasmagi.Base.DataAccess.EF` package version pinned in this project, so a future
  package upgrade that changes this behavior fails a test instead of silently reopening the
  forbidden-vs-not-found gap.
- **Cascade on `Restaurant` -> `EnvironmentRestaurant` silently removes user data as a side effect of an
  admin action on unrelated reference data** -> acceptable given the low stakes of a single membership
  row (see Decision 5); no additional mitigation planned (e.g. no soft-delete or notification), since
  that would add complexity out of proportion to the risk for a personal-grouping row.
- **Actor resolution reads a claim shape (`sub`) that hasn't been exercised end-to-end for API
  authorization anywhere else in this codebase yet** -> mitigated by verifying the claim name against an
  actual issued token during implementation rather than assuming `ClaimTypes.NameIdentifier` naming,
  and by keeping the accessor as the single place that would need updating if the claim shape differs.

## Migration Plan

- One new EF Core migration against `AppDbContext` (PostgreSQL) creating `dining_environments` and
  `environment_restaurants` under the existing `app` schema, following the same migration-authoring
  convention as `20260714192805_AddRestaurantOfferProviderReferenceData` (schema already ensured by that
  prior migration).
- No backfill needed - both tables are new and start empty.
- Rollback is the standard EF `Down()` migration (drop both tables in dependency order); no data
  migration risk since nothing existing depends on these tables yet.

## Open Questions

None outstanding - the one open design question raised in the proposal (Restaurant delete behavior) is
resolved in Decision 5.
