# restaurant-reference-data Specification

## Purpose
TBD - created by archiving change add-restaurant-offer-provider-reference-data. Update Purpose after archive.
## Requirements
### Requirement: Authenticated users can read restaurant reference data
The system SHALL expose Restaurant reference data to authenticated users.

#### Scenario: List restaurants
- **WHEN** an authenticated user requests the restaurant collection
- **THEN** the system returns the available Restaurant records.

#### Scenario: Get restaurant by id
- **WHEN** an authenticated user requests an existing Restaurant by id
- **THEN** the system returns that Restaurant record.

#### Scenario: Missing restaurant
- **WHEN** an authenticated user requests a Restaurant id that does not exist
- **THEN** the system returns a not-found response through the standard IMethodResponse error mapping.

### Requirement: Restaurant records include the required domain fields
The system SHALL persist and return each Restaurant with Name, City, Latitude, Longitude, OfferTimeText, ParkingInfo, OpeningInfo, HasOffers, IsFastFood, OffersResourceUrl, and OfferProviderId.

#### Scenario: Restaurant with automated offer source
- **WHEN** an admin creates or updates a Restaurant that references an OfferProvider
- **THEN** the system stores the nullable OfferProviderId together with the restaurant-specific full OffersResourceUrl.

#### Scenario: Restaurant with manual offers and no provider
- **WHEN** an admin creates or updates a Restaurant with HasOffers set to true and OfferProviderId unset
- **THEN** the system stores the Restaurant successfully as a manually maintained offer source.

#### Scenario: Restaurant without offers
- **WHEN** an admin creates or updates a Restaurant with HasOffers set to false
- **THEN** the system allows OffersResourceUrl and OfferProviderId to remain unset.

### Requirement: Restaurant writes require admin role
The system SHALL allow only users with the admin realm role to create, update, or delete Restaurant records.

#### Scenario: Admin creates restaurant
- **WHEN** an authenticated admin submits a valid Restaurant create request
- **THEN** the system creates the Restaurant and returns the created record.

#### Scenario: Non-admin write is forbidden
- **WHEN** an authenticated user without the admin realm role submits a Restaurant create, update, or delete request
- **THEN** the system rejects the request as forbidden.

#### Scenario: Unauthenticated access is rejected
- **WHEN** an unauthenticated caller requests any Restaurant endpoint
- **THEN** the system rejects the request according to the configured authentication policy.

### Requirement: Restaurant writes use optimistic concurrency
The system SHALL use the Restaurant concurrency token for update and delete operations.

#### Scenario: Update with matching concurrency token
- **WHEN** an admin updates a Restaurant with a matching If-Match concurrency token
- **THEN** the system stores the change and returns the updated Restaurant with a new concurrency token.

#### Scenario: Update with stale concurrency token
- **WHEN** an admin updates a Restaurant with a stale If-Match concurrency token
- **THEN** the system returns a concurrency-conflict response through the standard IMethodResponse error mapping.

#### Scenario: Delete without required concurrency token
- **WHEN** an admin deletes a Restaurant without a required If-Match concurrency token
- **THEN** the system returns a precondition-required response through the standard IMethodResponse error mapping.

### Requirement: Restaurant data follows the established vertical slice
The system SHALL implement Restaurant through Domain, DTO, Contracts, DataAccess, Application, and Web layers following the existing AppUser vertical slice pattern.

#### Scenario: Restaurant CRUD flow uses service and repository layers
- **WHEN** a Restaurant API request is handled
- **THEN** the controller maps Web DTOs to Domain models, calls the Application service, and the service uses the Restaurant repository rather than direct DbContext access.

#### Scenario: Restaurant persistence keeps metadata in DataAccess
- **WHEN** a Restaurant is stored in PostgreSQL
- **THEN** the EF entity includes metadata and concurrency while the Domain model includes only business fields and concurrency.

### Requirement: Deleting a Restaurant cascades removal of its EnvironmentRestaurant memberships
The system SHALL delete all `EnvironmentRestaurant` rows referencing a `Restaurant`, across all users,
when that `Restaurant` is deleted. This delete behavior is intentionally not restricted, unlike the
`Restrict` behavior used for `Restaurant`'s reference to `OfferProvider`, because `EnvironmentRestaurant`
is private per-user grouping data rather than reference data depended on by other reference data.

#### Scenario: Admin deletes a restaurant with existing environment memberships
- **WHEN** an admin deletes a `Restaurant` that one or more users have added to a `DiningEnvironment`
- **THEN** the system deletes the `Restaurant` and all `EnvironmentRestaurant` rows that referenced it,
  without requiring those memberships to be removed first.

### Requirement: Deleting a Restaurant cascades removal of its Favourite records
The system SHALL delete all `Favourite` rows referencing a `Restaurant`, across all users, when that
`Restaurant` is deleted. This delete behavior is intentionally not restricted, unlike the `Restrict`
behavior used for `Restaurant`'s reference to `OfferProvider`, because `Favourite` is private per-user
data rather than reference data depended on by other reference data.

#### Scenario: Admin deletes a restaurant with existing favourites
- **WHEN** an admin deletes a `Restaurant` that one or more users have favourited
- **THEN** the system deletes the `Restaurant` and all `Favourite` rows that referenced it, without
  requiring those favourites to be removed first.

