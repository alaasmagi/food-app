## 1. Domain

- [x] 1.1 Add `Domain/DiningEnvironment.cs` extending `BaseEntityUserWithConcurrency` with `Name` and
      nullable `Description`.
- [x] 1.2 Add `Domain/EnvironmentRestaurant.cs` extending `BaseEntityUserWithConcurrency` with
      `EnvironmentId` and `RestaurantId`.

## 2. DTO - DataAccess entities and mappers

- [x] 2.1 Add `DTO/DataAccess/DiningEnvironmentEntity.cs` extending `BaseEntityUserWithMetaConcurrency`
      with `Name` (`[Required][MaxLength]`), nullable `Description` (`[MaxLength]`), and the
      `EnvironmentRestaurants` collection navigation property.
- [x] 2.2 Add `DTO/DataAccess/EnvironmentRestaurantEntity.cs` extending
      `BaseEntityUserWithMetaConcurrency` with `EnvironmentId`, `RestaurantId`, and nav properties to
      `DiningEnvironmentEntity`/`RestaurantEntity`.
- [x] 2.3 Add `DTO/DataAccess/Mappers/DiningEnvironmentEntityMapper.cs` (`IMapper<DiningEnvironment,
      DiningEnvironmentEntity>`), field-for-field both directions, following
      `RestaurantEntityMapper`/`AppUserEntityMapper` conventions (including `UserId`).
- [x] 2.4 Add `DTO/DataAccess/Mappers/EnvironmentRestaurantEntityMapper.cs`
      (`IMapper<EnvironmentRestaurant, EnvironmentRestaurantEntity>`), same conventions.

## 3. DTO - Web DTOs and mappers

- [x] 3.1 Add `DTO/Web/DiningEnvironmentDto.cs` extending `BaseEntityWithConcurrency` with `Name`
      (`[Required][StringLength]`) and nullable `Description` (`[StringLength]`). Do not expose UserId
      on the DTO - ownership is derived from the authenticated request, not client input.
- [x] 3.2 Add `DTO/Web/EnvironmentRestaurantDto.cs` extending `BaseEntityWithConcurrency` with
      `EnvironmentId` and `RestaurantId`.
- [x] 3.3 Add `DTO/Web/Mappers/DiningEnvironmentDtoMapper.cs` (`IMapper<DiningEnvironmentDto,
      DiningEnvironment>`) following `AppUserDtoMapper`/`RestaurantDtoMapper` conventions (Id
      regeneration when empty, ConcurrencyToken defaulting).
- [x] 3.4 Add `DTO/Web/Mappers/EnvironmentRestaurantDtoMapper.cs` (`IMapper<EnvironmentRestaurantDto,
      EnvironmentRestaurant>`), same conventions.

## 4. Contracts

- [x] 4.1 Add `Contracts/DataAccess/IDiningEnvironmentRepository.cs` extending
      `IBaseRepository<DiningEnvironment>` (no extra members needed beyond the base contract).
- [x] 4.2 Add `Contracts/DataAccess/IEnvironmentRestaurantRepository.cs` extending
      `IBaseRepository<EnvironmentRestaurant>` plus an `ExistsForEnvironmentAndRestaurantAsync(Guid
      environmentId, Guid restaurantId, CancellationToken ct)` method for the uniqueness check.
- [x] 4.3 Add `Contracts/Application/IDiningEnvironmentService.cs` extending
      `IBaseService<DiningEnvironment>`.
- [x] 4.4 Add `Contracts/Application/IEnvironmentRestaurantService.cs` extending
      `IBaseService<EnvironmentRestaurant>`.
- [x] 4.5 Add `Contracts/Application/ICurrentActorAccessor.cs` exposing a way to resolve the current
      authenticated actor's id (e.g. `Guid? TryGetActorId()`), per design.md Decision 2.

## 5. DataAccess - repositories, actor accessor, EF configuration, migration

- [x] 5.1 Add `DataAccess/DiningEnvironmentRepository.cs` extending `BaseRepository<DiningEnvironment,
      DiningEnvironmentEntity, IMapper<DiningEnvironment, DiningEnvironmentEntity>>`.
- [x] 5.2 Add `DataAccess/EnvironmentRestaurantRepository.cs` extending
      `BaseRepository<EnvironmentRestaurant, EnvironmentRestaurantEntity, IMapper<EnvironmentRestaurant,
      EnvironmentRestaurantEntity>>`, implementing `ExistsForEnvironmentAndRestaurantAsync` as a direct
      `AppDbContext` query (scoped by `EnvironmentId` + `RestaurantId` only - the unique index already
      enforces the per-user scope via `EnvironmentId`'s ownership).
- [x] 5.3 Add `Application/CurrentActorAccessor.cs` implementing `ICurrentActorAccessor` via
      `IHttpContextAccessor`, reading the Keycloak subject claim (verify exact claim name against an
      actual issued token) and parsing it as `Guid`. Required adding a `FrameworkReference` to
      `Microsoft.AspNetCore.App` in `Application.csproj` since it's a plain classlib SDK project.
- [x] 5.4 Add `DiningEnvironments`/`EnvironmentRestaurants` `DbSet`s to `AppDbContext` and configure in
      `OnModelCreating`:
      - `DiningEnvironmentEntity`: unique index not required (no uniqueness constraint on the
        environment itself beyond its Id).
      - `EnvironmentRestaurantEntity`: `HasOne(EnvironmentId).WithMany().OnDelete(Cascade)`;
        `HasOne(RestaurantId).WithMany().OnDelete(Cascade)`; unique index on `(UserId, EnvironmentId,
        RestaurantId)` per design.md Decision 4.
- [x] 5.5 Generate the EF Core migration for `AppDbContext` (`dotnet ef migrations add
      AddDiningEnvironmentAndEnvironmentRestaurant` against the DataAccess project), following the
      naming/structure convention of `20260714192805_AddRestaurantOfferProviderReferenceData`.

## 6. Application services

- [x] 6.1 Add `Application/DiningEnvironmentService.cs` extending `BaseService<DiningEnvironment,
      DiningEnvironment, IDiningEnvironmentRepository>` (with an identity mapper, mirroring
      `AppUserService`/`RestaurantService`). Override `GetByIdAsync`/`UpdateAsync`/`RemoveAsync` to
      apply the unscoped-fetch ownership check from design.md Decision 3 (NOT_FOUND vs FORBIDDEN vs
      proceed) before delegating to the base actor-scoped implementation.
- [x] 6.2 Add `Application/EnvironmentRestaurantService.cs` extending `BaseService<EnvironmentRestaurant,
      EnvironmentRestaurant, IEnvironmentRestaurantRepository>` with the same ownership-check overrides,
      plus a `CreateAsync` override that:
      - rejects the request as forbidden if the target `DiningEnvironment` is not owned by the current
        actor
      - rejects the request (duplicate) if `ExistsForEnvironmentAndRestaurantAsync` already returns true
        for the given `(EnvironmentId, RestaurantId)` pair. Added a small
        `Contracts/Application/EnvironmentRestaurantErrorCodes.cs` (`DUPLICATE_MEMBERSHIP`), mirroring
        the existing `OfferFetchErrorCodes` convention for feature-specific error codes.

## 7. Web

- [x] 7.1 Add `Web/API/Controllers/DiningEnvironmentsController.cs` mirroring
      `AppUsersController`/`RestaurantsController` (CRUD, versioned route
      `api/v{version:apiVersion}/dining-environments`, rate limiting, If-Match handling, `ToProblem`
      error mapping). Inject `ICurrentActorAccessor` and pass the resolved actor into every service
      call. No `[Authorize(Policy = Admin)]` - any authenticated user manages their own environments.
      Returns 401 if the actor can't be resolved from the request (defensive - shouldn't happen given
      the global authenticated-fallback policy).
- [x] 7.2 Add `Web/API/Controllers/EnvironmentRestaurantsController.cs`, same conventions, route
      `api/v{version:apiVersion}/environment-restaurants` (Create/List/Get/Delete only, no Update -
      matches the spec).
- [x] 7.3 Register in `Web/Configuration/ServiceConfiguration.cs`: entity/identity/web mappers,
      `IDiningEnvironmentRepository`/`IEnvironmentRestaurantRepository`,
      `IDiningEnvironmentService`/`IEnvironmentRestaurantService`, and `ICurrentActorAccessor` (scoped,
      since it depends on `IHttpContextAccessor`).

## 8. Restaurant reference data change (modified capability)

- [x] 8.1 Update `AppDbContext`'s `Restaurant` -> `EnvironmentRestaurant` FK configuration to
      `DeleteBehavior.Cascade` (already covered by task 5.4; cross-referenced here for the modified
      `restaurant-reference-data` spec).
- [x] 8.2 Confirm no existing `RestaurantRepository`/`RestaurantService` referenced-by guard needs to be
      added for `EnvironmentRestaurant` (cascade is the chosen behavior, unlike the `OfferProvider`
      restrict guard - no blocking check should be introduced here). Confirmed - no guard added.

## 9. Verification

- [x] 9.1 Build the solution and confirm no warnings introduced.
- [ ] 9.2 Write/extend integration tests (or manual verification against a running instance) covering:
      list only returns the caller's own `DiningEnvironment`/`EnvironmentRestaurant` rows; get/update/
      delete on another user's row returns forbidden; get on a nonexistent id returns not-found;
      duplicate `EnvironmentRestaurant` creation is rejected; deleting a `DiningEnvironment` removes its
      memberships; deleting a `Restaurant` removes referencing memberships across users.
- [ ] 9.3 Apply the new migration against a local PostgreSQL instance and verify the schema matches
      design.md.
