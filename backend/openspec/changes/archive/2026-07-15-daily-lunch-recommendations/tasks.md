## 1. Rename opt-in flag to SendNotifications

- [x] 1.1 In `Domain/AppUser.cs`, rename `DailyLunchRecommendationsEnabled` → `SendNotifications` (bool, default false).
- [x] 1.2 In `DTO/DataAccess/AppUserEntity.cs`, rename the property to `SendNotifications`.
- [x] 1.3 In `DTO/Web/AppUserDto.cs`, rename the property to `SendNotifications`.
- [x] 1.4 Update both mappers (`DTO/DataAccess/Mappers/AppUserEntityMapper.cs`, `DTO/Web/Mappers/AppUserDtoMapper.cs`) to map `SendNotifications` in every direction.
- [x] 1.5 In `Contracts/DataAccess/IAppUserRepository.cs` and `DataAccess/AppUserRepository.cs`, rename `GetDailyLunchRecommendationSubscribersAsync` → `GetNotificationSubscribersAsync`, update its `Where(u => u.SendNotifications)` predicate, and update the `UpsertFromIdentityEventAsync` default (`SendNotifications = false`) and its comment.
- [x] 1.6 In `Application/DailyRecommendationNotificationService.cs`, call the renamed subscriber method.
- [x] 1.7 Update all tests referencing `DailyLunchRecommendationsEnabled` / the old method name (`AppUserRepositoryTests`, `AppUserMapperTests`, `DailyRecommendationNotificationServiceTests`, and any others) to `SendNotifications`.

## 2. Add NotificationEnvironmentId field

- [x] 2.1 In `Domain/AppUser.cs`, add `public Guid? NotificationEnvironmentId { get; set; }`.
- [x] 2.2 In `DTO/DataAccess/AppUserEntity.cs`, add nullable `NotificationEnvironmentId` (and a `DiningEnvironmentEntity?` nav or plain FK, matching the mapper style — keep AppUserEntity lean, plain FK preferred).
- [x] 2.3 In `DTO/Web/AppUserDto.cs`, add nullable `NotificationEnvironmentId`.
- [x] 2.4 Map `NotificationEnvironmentId` through both mappers in every direction.

## 3. EF configuration + migration

- [x] 3.1 In `DataAccess/Context/AppDbContext.cs` `OnModelCreating`, configure the `AppUserEntity.NotificationEnvironmentId → DiningEnvironmentEntity` FK with `OnDelete(DeleteBehavior.SetNull)` and add an index on `NotificationEnvironmentId`.
- [x] 3.2 Generate the AppDb migration: `dotnet ef migrations add AddSendNotificationsAndNotificationEnvironment --context AppDbContext --output-dir Migrations/AppDb`.
- [x] 3.3 Inspect the generated migration: confirm it uses `RenameColumn` for `DailyLunchRecommendationsEnabled` → `SendNotifications` (not drop+add, so opt-in values are preserved) and adds the nullable `NotificationEnvironmentId` column, its FK, and its index. Adjust by hand if EF emitted drop+add.
- [ ] 3.4 Build and apply the migration against a dev database; verify the column rename preserved existing `true` rows.

## 4. Environment-scoped candidate resolution

- [x] 4.1 In `Contracts/DataAccess/IEnvironmentRestaurantRepository.cs`, add a `Guid? environmentId` parameter to `GetDailyRecommendationRestaurantCandidatesAsync`.
- [x] 4.2 In `DataAccess/EnvironmentRestaurantRepository.cs`, when `environmentId` is non-null add `.Where(er => er.EnvironmentId == environmentId)`; keep the `HasOffers` filter, `IsFetchable` computation, and `RestaurantId` dedup unchanged for the null case.
- [x] 4.3 In `Application/DailyRecommendationNotificationService.BuildContentAsync`, pass `user.NotificationEnvironmentId` into the candidate query.
- [x] 4.4 Update `EnvironmentRestaurantRepositoryTests` / `DailyRecommendationNotificationServiceTests` to cover: null scope = all environments (deduped), set scope = only that environment, set scope excludes other environments' restaurants.

## 5. Ownership validation on preference write

- [x] 5.1 In `Application/AppUserService.cs`, override `UpdateAsync` so that when the incoming `NotificationEnvironmentId` is non-null it loads that `DiningEnvironment` (unscoped) via `IDiningEnvironmentRepository`, returns `NOT_FOUND` if missing and `FORBIDDEN` if `DiningEnvironment.UserId != actor` (resolved via `ICurrentActorAccessor`), and accepts null unconditionally; inject the required dependencies following the existing service constructor style.
- [x] 5.2 Add tests: setting own environment succeeds; setting another user's environment → forbidden; setting a nonexistent environment → not-found; clearing to null succeeds.

## 6. Clear scope on environment deletion

- [x] 6.1 In `Application/DiningEnvironmentService.RemoveAsync`, after the ownership check and as part of the delete, clear `NotificationEnvironmentId` to null on any `AppUser` referencing the environment being deleted (via `IAppUserRepository`), so the behavior is observable through the repository layer.
- [x] 6.2 Add an `IAppUserRepository` method (e.g. `ClearNotificationEnvironmentAsync(Guid environmentId, ct)`) and implement it in `AppUserRepository`.
- [x] 6.3 Add tests: deleting a referenced environment nulls the referencing `AppUser.NotificationEnvironmentId`; the delete succeeds; an unreferenced-environment delete leaves other values unchanged.

## 7. Verify

- [x] 7.1 Run the full test suite (`dotnet test`) and fix any remaining references to the old field/method names.
- [x] 7.2 Confirm the serialized event contract is unchanged (`DailyLunchRecommendationEventSerializationTests` still passes: `type: email`, `source: food`, `action: daily.lunch.recommendation`, and the content/rows/offers shape).
- [x] 7.3 Sanity-run the app so the hosted scheduler wires up and `DailyRecommendationNotificationService` resolves from DI without errors.
