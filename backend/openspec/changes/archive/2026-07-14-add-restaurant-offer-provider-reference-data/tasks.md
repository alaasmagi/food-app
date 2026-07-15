## 1. Model and Mapper Shape

- [x] 1.1 Re-read the AppUser vertical slice files and mirror their naming, constructor, mapper, and controller response patterns for Restaurant and OfferProvider.
- [x] 1.2 Add Domain/Restaurant.cs, Domain/OfferProvider.cs, and Domain/EOfferProviderType.cs using BaseEntityWithConcurrency and the requested business fields only.
- [x] 1.3 Add DTO/DataAccess/RestaurantEntity.cs and DTO/DataAccess/OfferProviderEntity.cs using BaseEntityWithMetaConcurrency, validation attributes, nullable OfferProviderId, and navigation properties where needed.
- [x] 1.4 Add Domain-to-DataAccess mappers for Restaurant and OfferProvider that map every field explicitly and preserve concurrency tokens.
- [x] 1.5 Add DTO/Web/RestaurantDto.cs and DTO/Web/OfferProviderDto.cs with API-facing validation and fields matching the required Web contract.
- [x] 1.6 Add Web DTO mappers for Restaurant and OfferProvider that map every field explicitly and create ids for new DTO inputs consistently with AppUserDtoMapper.

## 2. Persistence and Repositories

- [x] 2.1 Add AppDbContext DbSets and model configuration for Restaurants and OfferProviders, including table names, key fields, useful indexes, max lengths, and explicit nullable Restaurant.OfferProviderId relationship.
- [x] 2.2 Configure the OfferProvider-to-Restaurant relationship with restricted delete behavior so referenced providers are not cascaded or silently detached.
- [x] 2.3 Add IRestaurantRepository and IOfferProviderRepository contracts extending the base repository pattern.
- [x] 2.4 Implement RestaurantRepository and OfferProviderRepository by extending BaseRepository with the new Domain, EF entity, and mapper types.
- [x] 2.5 Ensure deletion of a referenced OfferProvider returns a controlled IMethodResponse error path rather than leaking an unhandled database exception.
- [x] 2.6 Generate an AppDbContext PostgreSQL migration for OfferProviders and Restaurants only.

## 3. Application Services and DI

- [x] 3.1 Add IRestaurantService and IOfferProviderService contracts extending IBaseService for their Domain types.
- [x] 3.2 Add RestaurantIdentityMapper and OfferProviderIdentityMapper following AppUserIdentityMapper.
- [x] 3.3 Add RestaurantService and OfferProviderService extending BaseService with the matching repository, unit-of-work, and identity mapper dependencies.
- [x] 3.4 Register the new DataAccess mappers, Web mappers, repositories, identity mappers, and services in Web/Configuration/ServiceConfiguration.cs.

## 4. Web API and Authorization

- [x] 4.1 Add RestaurantsController under Web/API/Controllers with GET collection, GET by id, POST, PUT, and DELETE actions following AppUsersController route/versioning/rate-limiting/error mapping.
- [x] 4.2 Add OfferProvidersController under Web/API/Controllers with GET collection, GET by id, POST, PUT, and DELETE actions following AppUsersController route/versioning/rate-limiting/error mapping.
- [x] 4.3 Normalize If-Match concurrency tokens for Restaurant and OfferProvider PUT/DELETE actions the same way AppUsersController does.
- [x] 4.4 Enforce admin realm role authorization on Restaurant and OfferProvider POST, PUT, and DELETE while leaving reads available to any authenticated user.
- [x] 4.5 Verify the Keycloak realm-role claim mapping used by ASP.NET Core authorization and adjust the admin policy or attribute accordingly.

## 5. Verification

- [x] 5.1 Build the solution and fix compile or nullable-reference warnings introduced by this change.
- [x] 5.2 Inspect the generated migration to confirm Restaurants and OfferProviders use the app schema, include metadata/concurrency fields, and set the OfferProvider foreign key delete behavior to Restrict.
- [x] 5.3 Verify Restaurant create/update supports HasOffers true with null OfferProviderId and a full OffersResourceUrl.
- [x] 5.4 Verify OfferProvider responses expose provider type and locator fields but no base URL or endpoint field.
- [x] 5.5 Verify non-admin write requests are forbidden, authenticated read requests succeed, and unauthenticated requests are rejected by the configured authentication policy.
- [x] 5.6 Verify deleting a referenced OfferProvider is blocked and deleting an unreferenced OfferProvider with a valid If-Match token succeeds.
