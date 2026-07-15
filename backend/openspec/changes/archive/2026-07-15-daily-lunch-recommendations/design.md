## Context

The daily lunch recommendation email is already implemented end to end: `AppUser.DailyLunchRecommendationsEnabled` gates opt-in, `DailyRecommendationNotificationService.RunAsync` builds one `DailyLunchRecommendationEvent` per opted-in user and publishes it via `IBaseEventPublisher`, and `DailyRecommendationSchedulerHostedService` triggers it daily at 08:00 Europe/Tallinn (configurable). Restaurant candidates come from `EnvironmentRestaurantRepository.GetDailyRecommendationRestaurantCandidatesAsync(userId)`, which flattens **all** of the user's environment memberships, keeps `HasOffers` restaurants, dedupes by `RestaurantId`, and marks each as fetchable. The messaging DTO contract (`type: email`, `source: food`, `action: daily.lunch.recommendation`, and the `content`/`recommendationRows`/`offers` shape) matches the email hub and is not changing.

This change is an enhancement to that existing feature, driven by two product needs: (1) let users scope the email to a single dining environment, and (2) rename the opt-in flag to a general `SendNotifications`. Key established conventions to follow: manual `IMapper<TA,TB>` mappers, POCO options registered as singletons (not `IOptions<T>`), `OwnershipScopedService`/`CurrentActorAccessor` for actor-scoped writes, `alaasmagi.Base.*` base classes, and two separate EF migration histories (`AppDb` for PostgreSQL, `OfferCache` for SQLite).

## Goals / Non-Goals

**Goals:**
- Rename `AppUser.DailyLunchRecommendationsEnabled` → `AppUser.SendNotifications` consistently across all layers, tests, and the DB column.
- Add `AppUser.NotificationEnvironmentId` (`Guid?`) that scopes the daily email to one owned environment when set, or to all environments (current behavior) when null.
- Reject setting `NotificationEnvironmentId` to an environment the acting user does not own.
- Clear `NotificationEnvironmentId` to null when its referenced `DiningEnvironment` is deleted, without blocking the delete.

**Non-Goals:**
- No change to the email-hub event contract, the offer cache, the price passthrough, the plain-deep-link approach, or the one-event-per-user (even when empty) behavior.
- No change to the scheduler (stays 08:00 Europe/Tallinn, configurable).
- No Keycloak action-token / magic-login generation.
- No frontend settings UI, and no per-environment separate emails.

## Decisions

### Decision 1: Rename the opt-in flag rather than add a second flag
Replace `DailyLunchRecommendationsEnabled` with `SendNotifications` everywhere (Domain, `AppUserEntity`, `AppUserDto`, both mappers, `IAppUserRepository.GetDailyLunchRecommendationSubscribersAsync` → `GetNotificationSubscribersAsync`, the subscriber query predicate, `UpsertFromIdentityEventAsync` default, and all tests). A single EF migration renames the column via `migrationBuilder.RenameColumn` to preserve existing opted-in rows.
- **Why:** The authoritative project context lists AppUser's notification fields as exactly `SendNotifications` + `NotificationEnvironmentId`; a single general toggle avoids two overlapping booleans.
- **Alternative considered:** Keep both flags (non-breaking). Rejected — leaves dead/ambiguous state and contradicts the project context.
- **Trade-off:** Breaking rename of a shipped column; handled by a rename migration (not drop+add) so data is preserved.

### Decision 2: `NotificationEnvironmentId` scoping is applied at the candidate query
Add an optional `Guid? environmentId` parameter to `GetDailyRecommendationRestaurantCandidatesAsync(userId, environmentId, ct)`. When non-null, the query additionally filters `environmentRestaurant.EnvironmentId == environmentId`; when null, behavior is unchanged (all environments, flat, deduped). `DailyRecommendationNotificationService.BuildContentAsync` passes `user.NotificationEnvironmentId` through.
- **Why:** Keeps the scope decision in one place (the query), reuses the existing `HasOffers` filter, fetchable flag, and `RestaurantId` dedup untouched.
- **Alternative considered:** Filter in memory in the service after fetching all candidates. Rejected — pulls rows the user didn't ask for and duplicates the ownership boundary.
- **Note:** No extra ownership check is needed inside the background job: the query is already scoped by `UserId`, so a stale `NotificationEnvironmentId` pointing at another user's environment would simply match nothing and fall back to an empty scoped set. (Ownership is enforced at write time — Decision 3 — so this is defense-in-depth only.)

### Decision 3: Ownership of `NotificationEnvironmentId` is validated on the AppUser preference write
`AppUser` is not a user-owned entity (`BaseEntityWithMetaConcurrency`, no `IBaseEntityUserId`), so the generic `AppUserService` cannot auto-scope it. Add explicit validation on the preference-update path: when the incoming `NotificationEnvironmentId` is non-null, load that `DiningEnvironment` unscoped and require `DiningEnvironment.UserId == actor` (via `ICurrentActorAccessor` / `IDiningEnvironmentRepository`); return `NOT_FOUND` if it does not exist and `FORBIDDEN` if it is owned by someone else — mirroring `OwnershipScopedService.CheckOwnershipAsync`. Null is always accepted.
- **Why:** Reuses the existing NOT_FOUND-vs-FORBIDDEN ownership idiom already used by `DiningEnvironmentService` et al.
- **Alternative considered:** A DB-level FK with a composite `(UserId, EnvironmentId)` guarantee. Rejected — AppUser has no `UserId` column of its own (its `Id` *is* the user), so cross-user protection must be enforced in the service, not the schema.
- **Scope note:** The write path is the existing `AppUsersController.Update` → `AppUserService.UpdateAsync`. This change adds the validation there (overriding `UpdateAsync` in `AppUserService`, analogous to the ownership-scoped services). A dedicated "update my notification preferences" endpoint is deferred to the frontend change.

### Decision 4: Clear `NotificationEnvironmentId` on environment delete in the service, with a DB `SetNull` FK as backstop
Configure the `AppUserEntity.NotificationEnvironmentId → DiningEnvironmentEntity` FK with `OnDelete(DeleteBehavior.SetNull)` in `AppDbContext.OnModelCreating`, and also clear referencing rows explicitly in `DiningEnvironmentService.RemoveAsync` before/around the delete so the behavior is observable through the repository layer and covered by a service test.
- **Why:** `SetNull` guarantees no dangling reference and no delete block even on paths that bypass the service; the explicit service-level clear keeps the behavior testable without a live PostgreSQL FK and documents the intent.
- **Alternative considered:** `Restrict` + require the user to unset first. Rejected — the proposal requires the delete to succeed and the scope to auto-clear.
- **FK shape:** `NotificationEnvironmentId` is nullable, so `SetNull` is valid. The relationship is optional/one-to-many from `DiningEnvironment` to `AppUser` (an environment may be the notification scope of at most its owner, but modeled as a plain optional FK with no navigation collection to keep `AppUserEntity` lean).

### Decision 5: Keep the scheduler and messaging contract untouched
No changes to `DailyRecommendationSchedulerHostedService`, `DailyRecommendationScheduleOptions` (08:00 Europe/Tallinn), the event envelope, or `AppMessageActions.DailyLunchRecommendation`.
- **Why:** The trigger and the email-hub contract already satisfy the requirements; touching them adds risk without benefit.

## Risks / Trade-offs

- **Column rename migration on a live DB** → Use `RenameColumn` (not drop/add) and verify the generated migration renames rather than recreates, preserving existing opt-in values.
- **`NotificationEnvironmentId` set then that environment deleted between selection and send** → `SetNull` FK + scoped query means the worst case is an email sourced from all environments (null scope) or an empty scoped set for that run; no crash, no dangling id.
- **AppUser write path is a generic CRUD `Update`** → Ownership validation must live in `AppUserService.UpdateAsync`; missing it would let a user point their scope at another user's environment id. Covered by an explicit forbidden-path test.
- **Two migration histories** → The new migration must target `--context AppDbContext --output-dir Migrations/AppDb` only; no `OfferCache` migration is involved.

## Migration Plan

1. Rename the field across Domain/DTO/mappers/repository/tests; add `NotificationEnvironmentId` to Domain + `AppUserEntity` + `AppUserDto` + both mappers.
2. Configure the FK + `SetNull` in `AppDbContext`; add the ownership validation in `AppUserService.UpdateAsync` and the clear-on-delete in `DiningEnvironmentService.RemoveAsync`.
3. Extend the candidate query signature and the service call.
4. Generate one AppDb migration: `dotnet ef migrations add AddSendNotificationsAndNotificationEnvironment --context AppDbContext --output-dir Migrations/AppDb`; confirm it renames the column and adds the nullable FK column + index.
5. Deploy = apply the AppDb migration. **Rollback:** revert the migration (renames the column back, drops the FK column); no data loss for the opt-in flag since values are preserved through the rename.

## Open Questions

None — the opt-in rename and the 08:00 Europe/Tallinn trigger were confirmed with the requester; all other behavior is inherited from the existing implementation.
