## Why

Restaurant and OfferProvider must exist before user-owned dining features can reference restaurants or parse offer sources. This change establishes the shared, admin-managed reference-data foundation only; offer fetching, caching, environments, favourites, wheels, and recommendation emails remain separate follow-up changes.

## What Changes

- Add Restaurant as shared reference data with name, city, coordinates, display information, offer availability flags, restaurant-specific offer resource URL, and an optional OfferProvider reference.
- Add OfferProvider as shared parsing configuration with provider type and locator fields for offer, offer text, and offer price extraction.
- Add EOfferProviderType with Html, Api, and Manual values.
- Add CRUD/domain shape for both entities across Domain, DTO, Contracts, DataAccess, Application, and Web layers, mirroring the existing AppUser vertical slice.
- Persist RestaurantEntity and OfferProviderEntity in AppDbContext using PostgreSQL and DataAccess metadata/concurrency base entities.
- Restrict deletion of an OfferProvider while any Restaurant still references it.
- Require the admin realm role for Restaurant and OfferProvider create, update, and delete operations.
- Allow any authenticated user to read Restaurant and OfferProvider data.

## Capabilities

### New Capabilities

- `restaurant-reference-data`: Shared Restaurant records that authenticated users can read and admins can manage.
- `offer-provider-reference-data`: Shared OfferProvider records and provider-type metadata that authenticated users can read and admins can manage.

### Modified Capabilities

- None.

## Impact

- Adds Domain entities and enum: Restaurant, OfferProvider, EOfferProviderType.
- Adds DataAccess EF entities, AppDbContext DbSets/configuration, repositories, mappers, and migrations for PostgreSQL.
- Adds Contracts interfaces and Application services for Restaurant and OfferProvider.
- Adds Web DTOs, mappers, and API controllers following AppUsersController response/error handling.
- Adds DI registrations for repositories, services, and mappers.
- Adds authorization behavior for authenticated reads and admin-only writes.
