## 1. Domain

- [x] 1.1 Add `Domain/UserWheel.cs` extending `BaseEntityUserWithConcurrency` with `Name`,
      `RestaurantNames` (`List<string>`), and `IsPublic` (bool).

## 2. DTO - DataAccess entity and mapper

- [x] 2.1 Add `DTO/DataAccess/UserWheelEntity.cs` extending `BaseEntityUserWithMetaConcurrency` with
      `Name` (`[Required][MaxLength]`), `RestaurantNames` (`List<string>`), and `IsPublic` (bool). No FK
      or nav property to `RestaurantEntity` - this is a frozen name snapshot, not a relationship (design.md
      Decision 2).
- [x] 2.2 Add `DTO/DataAccess/Mappers/UserWheelEntityMapper.cs` (`IMapper<UserWheel, UserWheelEntity>`),
      field-for-field both directions, following `DiningEnvironmentEntityMapper` conventions (including
      `UserId`).

## 3. DTO - Web DTO and mapper

- [x] 3.1 Add `DTO/Web/UserWheelDto.cs` extending `BaseEntityWithConcurrency` with `Name`
      (`[Required][StringLength]`), `RestaurantNames` (`List<string>`), and `IsPublic` (bool). Do not
      expose UserId on the DTO - ownership is derived from the authenticated request, not client input.
- [x] 3.2 Add `DTO/Web/Mappers/UserWheelDtoMapper.cs` (`IMapper<UserWheelDto, UserWheel>`) following
      `DiningEnvironmentDtoMapper` conventions (Id regeneration when empty, ConcurrencyToken
      defaulting).

## 4. Contracts

- [x] 4.1 Add `Contracts/DataAccess/IUserWheelRepository.cs` extending `IBaseRepository<UserWheel>` (no
      extra members needed beyond the base contract).
- [x] 4.2 Add `Contracts/Application/IUserWheelService.cs` extending `IBaseService<UserWheel>`.

## 5. Application - shared ownership-check base class

- [x] 5.1 Add `Application/OwnershipScopedService.cs`: an abstract
      `OwnershipScopedService<TDomainEntity, TRepository>` extending `BaseService<TDomainEntity,
      TDomainEntity, TRepository>` (constrained to `IBaseEntity<Guid>, IBaseEntityUserId<Guid>` /
      `IBaseRepository<TDomainEntity, Guid, Guid>`), overriding `GetByIdAsync`/`UpdateAsync`/
      `RemoveAsync` with the unscoped-fetch-then-compare-UserId pattern from design.md Decision 3,
      using the protected `ServiceRepository` field from `BaseService` (no per-subclass repository
      field needed). Do NOT modify `DiningEnvironmentService`, `EnvironmentRestaurantService`, or
      `FavouriteService` to use this base class - they are explicitly out of scope for this change.

## 6. DataAccess - repository, EF configuration, migration

- [x] 6.1 Add `DataAccess/UserWheelRepository.cs` extending `BaseRepository<UserWheel, UserWheelEntity,
      IMapper<UserWheel, UserWheelEntity>>` (no extra members needed).
- [x] 6.2 Add a `UserWheels` `DbSet` to `AppDbContext` and configure in `OnModelCreating`:
      - `RestaurantNames` property: `HasColumnType("jsonb")` + `HasConversion` (System.Text.Json
        serialize/deserialize) + an explicit `ValueComparer` for structural equality, per design.md
        Decision 2.
      - `Name` with `[MaxLength]`-matching `HasMaxLength`.
      - No FK/navigation to `RestaurantEntity`.
- [x] 6.3 Generate the EF Core migration for `AppDbContext` (`dotnet ef migrations add AddUserWheel`
      against the DataAccess project), following the naming/structure convention of
      `20260715045138_AddFavourite`, and verify the generated column type is `jsonb`.

## 7. Application service

- [x] 7.1 Add `Application/UserWheelService.cs`: an identity mapper (`UserWheelIdentityMapper`) plus
      `UserWheelService : OwnershipScopedService<UserWheel, IUserWheelRepository>, IUserWheelService` -
      should need no method bodies of its own beyond the constructor, since all CRUD + ownership-check
      behavior comes from the shared base class.

## 8. Web

- [x] 8.1 Add `Web/API/Controllers/UserWheelsController.cs` mirroring `DiningEnvironmentsController`
      (CRUD, versioned route `api/v{version:apiVersion}/user-wheels`, rate limiting, If-Match handling
      on Update/Delete, `ToProblem` error mapping). Inject `ICurrentActorAccessor` (reuse the existing
      implementation) and pass the resolved actor into every service call. No
      `[Authorize(Policy = Admin)]` - any authenticated user manages their own wheels.
- [x] 8.2 Register in `Web/Configuration/ServiceConfiguration.cs`: entity/identity/web mappers for
      `UserWheel`, `IUserWheelRepository`, `IUserWheelService`.

## 9. Verification

- [x] 9.1 Build the solution and confirm no warnings introduced.
- [ ] 9.2 Write/extend integration tests (or manual verification against a running instance) covering:
      list only returns the caller's own `UserWheel` rows; get/update/delete on another user's row
      returns forbidden even when IsPublic is true; get on a nonexistent id returns not-found;
      RestaurantNames round-trips exactly (including order) through create/read; updating a wheel's
      RestaurantNames in place is correctly detected and persisted by EF change tracking (exercises the
      ValueComparer).
- [ ] 9.3 Apply the new migration against a local PostgreSQL instance and verify the `RestaurantNames`
      column is `jsonb` and the schema otherwise matches design.md.
