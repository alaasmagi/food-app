## Context

The backend currently has a complete AppUser vertical slice and AppDbContext, but no Restaurant or OfferProvider model. Later capabilities need Restaurant as shared reference data before they can create DiningEnvironment memberships, favourites, user wheels, offer cache rows, or recommendation messages.

Restaurant and OfferProvider are shared data, not user-owned data. They must be visible to authenticated users and mutable only by users with the admin realm role. The implementation must mirror the existing AppUser pattern across Domain, DTO, Contracts, DataAccess, Application, and Web, including explicit mappers and IMethodResponse-based controller error handling.

## Goals / Non-Goals

**Goals:**

- Add Restaurant, OfferProvider, and EOfferProviderType to the Domain layer using BaseEntityWithConcurrency.
- Add PostgreSQL EF entities using BaseEntityWithMetaConcurrency and configure them in AppDbContext.
- Expose CRUD APIs for both entities through the same controller/service/repository/mapper shape as AppUser.
- Model Restaurant.OfferProviderId as nullable and allow HasOffers without a provider.
- Configure OfferProvider deletion to be restricted while any Restaurant references it.
- Enforce admin-only writes and authenticated reads for both API surfaces.

**Non-Goals:**

- No OfferFetchService, provider invocation, HTML/API parsing, manual menu maintenance workflow, or offer cache.
- No DiningEnvironment, EnvironmentRestaurant, Favourite, UserWheel, or recommendation email implementation.
- No SQLite OfferCacheDbContext changes.
- No user ownership scoping for Restaurant or OfferProvider, because both are shared reference data.

## Decisions

- Mirror the AppUser vertical slice exactly for both entities. This keeps repository inheritance, service constructors, mapper placement, DI registration, controller routes, and IMethodResponse translation consistent with the project’s only established implementation. Alternative considered: introduce a generic shared CRUD controller/service abstraction. That would reduce repetition but create a new convention before the repo has enough duplicated slices to justify it.
- Keep Domain entities free of metadata and use BaseEntityWithConcurrency. Concurrency tokens are needed for the API If-Match update/delete flow, while audit metadata belongs only to EF entities. Alternative considered: use metadata-capable base classes in Domain. That conflicts with the project rule that persistence metadata stays in DataAccess.
- Store OfferProvider fetch location only on Restaurant.OffersResourceUrl. OfferProvider represents parsing configuration shared across restaurants, so it has no base URL or endpoint field. Alternative considered: a provider base URL plus restaurant-relative path. That does not fit sources where each restaurant has a full independent URL and would split the fetch URL across two entities.
- Make Restaurant.OfferProviderId nullable with an optional EF relationship. HasOffers describes whether a restaurant conceptually has offers; it does not require automated provider parsing. Alternative considered: require OfferProviderId when HasOffers is true. That would block manually admin-maintained menus and violates the desired domain model.
- Configure the OfferProvider-to-Restaurant relationship with DeleteBehavior.Restrict. This makes provider deletion fail while referenced and preserves restaurant data. Alternative considered: cascade delete or set-null. Cascade would delete restaurants unexpectedly, and set-null would silently remove parsing configuration.
- Enforce write authorization at the Web/API boundary. Controllers should require the admin realm role for POST, PUT, and DELETE while allowing the fallback authenticated-user policy to cover GET endpoints. Alternative considered: enforce admin checks inside repositories or services. That would mix HTTP/identity policy concerns into lower layers and diverge from the existing layering.

## Risks / Trade-offs

- Admin role claim mapping may differ between Keycloak tokens and ASP.NET Core role authorization -> verify the existing Keycloak role mapping before relying on a literal role attribute/policy.
- DeleteBehavior.Restrict can surface as a database update exception if the repository does not pre-check references -> translate expected provider-delete failures into the existing IMethodResponse/ErrorDefaults pattern instead of leaking a raw 500.
- No existing automated test project is present -> implementation should add focused coverage if a test project is introduced, and at minimum validate build plus migration generation.
- Scaffolded controllers may differ from the AppUsersController pattern -> generated code must be adapted before acceptance, not treated as final.

## Migration Plan

- Add the two EF entities and AppDbContext DbSets/configuration in the PostgreSQL AppDbContext only.
- Generate an AppDbContext migration that creates OfferProviders and Restaurants, including the nullable OfferProviderId foreign key with restricted delete behavior.
- Apply the migration in environments before enabling clients to create DiningEnvironment, Favourite, or UserWheel records that reference Restaurant.
- Rollback by reverting the migration and removing the new API/service registrations if no dependent data has been introduced. After later dependent capabilities exist, rollback requires handling their foreign keys first.

## Open Questions

- What exact admin role policy or role name is already exposed by the configured Keycloak integration for realm roles?
