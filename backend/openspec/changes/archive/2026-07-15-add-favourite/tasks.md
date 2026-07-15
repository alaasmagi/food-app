## 1. Domain

- [x] 1.1 Add `Domain/Favourite.cs` extending `BaseEntityUserWithConcurrency` with `RestaurantId`,
      `Rating` (int), and nullable `Note`.

## 2. DTO - DataAccess entity and mapper

- [x] 2.1 Add `DTO/DataAccess/FavouriteEntity.cs` extending `BaseEntityUserWithMetaConcurrency` with
      `RestaurantId`, `Rating` (`[Range(1,5)]`), nullable `Note` (`[MaxLength]`), and a nav property to
      `RestaurantEntity`.
- [x] 2.2 Add `DTO/DataAccess/Mappers/FavouriteEntityMapper.cs` (`IMapper<Favourite, FavouriteEntity>`),
      field-for-field both directions, following `DiningEnvironmentEntityMapper` conventions (including
      `UserId`).

## 3. DTO - Web DTO and mapper

- [x] 3.1 Add `DTO/Web/FavouriteDto.cs` extending `BaseEntityWithConcurrency` with `RestaurantId`,
      `Rating` (`[Range(1,5)]`), and nullable `Note` (`[StringLength]`). Do not expose UserId on the DTO
      - ownership is derived from the authenticated request, not client input.
- [x] 3.2 Add `DTO/Web/Mappers/FavouriteDtoMapper.cs` (`IMapper<FavouriteDto, Favourite>`) following
      `DiningEnvironmentDtoMapper` conventions (Id regeneration when empty, ConcurrencyToken
      defaulting).

## 4. Contracts

- [x] 4.1 Add `Contracts/DataAccess/IFavouriteRepository.cs` extending `IBaseRepository<Favourite>` plus
      `Task<Favourite?> GetByRestaurantAsync(Guid restaurantId, Guid actor, CancellationToken ct =
      default)` for the upsert-on-create lookup (design.md Decision 3).
- [x] 4.2 Add `Contracts/Application/IFavouriteService.cs` extending `IBaseService<Favourite>`.

## 5. DataAccess - repository, EF configuration, migration

- [x] 5.1 Add `DataAccess/FavouriteRepository.cs` extending `BaseRepository<Favourite, FavouriteEntity,
      IMapper<Favourite, FavouriteEntity>>`, implementing `GetByRestaurantAsync` as a direct
      `AppDbContext` query scoped by both `UserId` and `RestaurantId`.
- [x] 5.2 Add a `Favourites` `DbSet` to `AppDbContext` and configure in `OnModelCreating`:
      - `Rating` property with a `[Range(1,5)]`-backed check (data annotation only, no extra DB
        constraint needed).
      - `HasOne(RestaurantId).WithMany().OnDelete(Cascade)` per design.md Decision 5.
      - Unique index on `(UserId, RestaurantId)` per design.md Decision 4.
- [x] 5.3 Generate the EF Core migration for `AppDbContext` (`dotnet ef migrations add AddFavourite`
      against the DataAccess project), following the naming/structure convention of
      `20260714210215_AddDiningEnvironmentAndEnvironmentRestaurant`.

## 6. Application service

- [x] 6.1 Add `Application/FavouriteService.cs` extending `BaseService<Favourite, Favourite,
      IFavouriteRepository>` (with an identity mapper, mirroring `DiningEnvironmentService`). Override
      `GetByIdAsync`/`UpdateAsync`/`RemoveAsync` to apply the same unscoped-fetch ownership check as
      `DiningEnvironmentService` (NOT_FOUND vs FORBIDDEN vs proceed).
- [x] 6.2 Override `CreateAsync` to implement the upsert-on-create behavior from design.md Decision 3:
      look up an existing `Favourite` via `GetByRestaurantAsync(entity.RestaurantId, actor)`; if found,
      call `base.UpdateAsync` with that row's id and current `ConcurrencyToken`; otherwise call
      `base.CreateAsync`.

## 7. Web

- [x] 7.1 Add `Web/API/Controllers/FavouritesController.cs` mirroring `DiningEnvironmentsController`
      (CRUD, versioned route `api/v{version:apiVersion}/favourites`, rate limiting, If-Match handling on
      Update/Delete, `ToProblem` error mapping). Inject `ICurrentActorAccessor` (reuse the existing
      implementation, no new registration needed beyond the service/repository below) and pass the
      resolved actor into every service call. No `[Authorize(Policy = Admin)]` - any authenticated user
      manages their own favourites.
- [x] 7.2 Register in `Web/Configuration/ServiceConfiguration.cs`: entity/identity/web mappers for
      `Favourite`, `IFavouriteRepository`, `IFavouriteService`.

## 8. Restaurant reference data change (modified capability)

- [x] 8.1 Confirm `AppDbContext`'s `Restaurant` -> `Favourite` FK configuration uses
      `DeleteBehavior.Cascade` (covered by task 5.2; cross-referenced here for the modified
      `restaurant-reference-data` spec).
- [x] 8.2 Confirm no referenced-by guard is added to `RestaurantRepository`/`RestaurantService` for
      `Favourite` (cascade is the chosen behavior, unlike the `OfferProvider` restrict guard - no
      blocking check should be introduced here). Confirmed - no guard added.

## 9. Verification

- [x] 9.1 Build the solution and confirm no warnings introduced.
- [ ] 9.2 Write/extend integration tests (or manual verification against a running instance) covering:
      list only returns the caller's own `Favourite` rows; get/update/delete on another user's row
      returns forbidden; get on a nonexistent id returns not-found; a second create for the same
      restaurant updates the existing row instead of duplicating it; out-of-range Rating is rejected;
      deleting a `Restaurant` removes referencing `Favourite` rows across users.
- [ ] 9.3 Apply the new migration against a local PostgreSQL instance and verify the schema matches
      design.md.
