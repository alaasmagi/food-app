## ADDED Requirements

### Requirement: Authenticated users can read offer provider reference data
The system SHALL expose OfferProvider reference data to authenticated users.

#### Scenario: List offer providers
- **WHEN** an authenticated user requests the OfferProvider collection
- **THEN** the system returns the available OfferProvider records.

#### Scenario: Get offer provider by id
- **WHEN** an authenticated user requests an existing OfferProvider by id
- **THEN** the system returns that OfferProvider record.

#### Scenario: Missing offer provider
- **WHEN** an authenticated user requests an OfferProvider id that does not exist
- **THEN** the system returns a not-found response through the standard IMethodResponse error mapping.

### Requirement: OfferProvider records include provider type and locator fields
The system SHALL persist and return each OfferProvider with Name, ProviderType, OfferLocator, OfferTextLocator, and OfferPriceLocator.

#### Scenario: HTML provider configuration
- **WHEN** an admin creates or updates an OfferProvider with ProviderType Html
- **THEN** the system stores the locator fields as the provider's HTML parsing configuration.

#### Scenario: API provider configuration
- **WHEN** an admin creates or updates an OfferProvider with ProviderType Api
- **THEN** the system stores the locator fields as the provider's API parsing configuration.

#### Scenario: Manual provider type
- **WHEN** an admin creates or updates an OfferProvider with ProviderType Manual
- **THEN** the system stores the provider type without requiring any base URL or endpoint field.

### Requirement: OfferProvider has no fetch URL field
The system SHALL NOT store a base URL or endpoint on OfferProvider; the complete offer fetch URL MUST live on Restaurant.OffersResourceUrl.

#### Scenario: Multiple restaurants share one provider
- **WHEN** multiple Restaurants reference the same OfferProvider
- **THEN** each Restaurant keeps its own complete OffersResourceUrl independently of the shared OfferProvider.

#### Scenario: OfferProvider response shape excludes endpoint
- **WHEN** an authenticated user reads an OfferProvider
- **THEN** the response contains provider metadata and locator fields but no base URL or endpoint field.

### Requirement: OfferProvider writes require admin role
The system SHALL allow only users with the admin realm role to create, update, or delete OfferProvider records.

#### Scenario: Admin creates offer provider
- **WHEN** an authenticated admin submits a valid OfferProvider create request
- **THEN** the system creates the OfferProvider and returns the created record.

#### Scenario: Non-admin write is forbidden
- **WHEN** an authenticated user without the admin realm role submits an OfferProvider create, update, or delete request
- **THEN** the system rejects the request as forbidden.

#### Scenario: Unauthenticated access is rejected
- **WHEN** an unauthenticated caller requests any OfferProvider endpoint
- **THEN** the system rejects the request according to the configured authentication policy.

### Requirement: Referenced OfferProvider deletion is restricted
The system SHALL block deletion of an OfferProvider while any Restaurant references it.

#### Scenario: Delete referenced offer provider
- **WHEN** an admin deletes an OfferProvider that is referenced by at least one Restaurant
- **THEN** the system rejects the delete and preserves both the OfferProvider and the referencing Restaurants.

#### Scenario: Delete unreferenced offer provider
- **WHEN** an admin deletes an OfferProvider that no Restaurant references and supplies a valid If-Match concurrency token
- **THEN** the system deletes the OfferProvider.

### Requirement: OfferProvider writes use optimistic concurrency
The system SHALL use the OfferProvider concurrency token for update and delete operations.

#### Scenario: Update with matching concurrency token
- **WHEN** an admin updates an OfferProvider with a matching If-Match concurrency token
- **THEN** the system stores the change and returns the updated OfferProvider with a new concurrency token.

#### Scenario: Update with stale concurrency token
- **WHEN** an admin updates an OfferProvider with a stale If-Match concurrency token
- **THEN** the system returns a concurrency-conflict response through the standard IMethodResponse error mapping.

#### Scenario: Delete without required concurrency token
- **WHEN** an admin deletes an OfferProvider without a required If-Match concurrency token
- **THEN** the system returns a precondition-required response through the standard IMethodResponse error mapping.

### Requirement: OfferProvider data follows the established vertical slice
The system SHALL implement OfferProvider through Domain, DTO, Contracts, DataAccess, Application, and Web layers following the existing AppUser vertical slice pattern.

#### Scenario: OfferProvider CRUD flow uses service and repository layers
- **WHEN** an OfferProvider API request is handled
- **THEN** the controller maps Web DTOs to Domain models, calls the Application service, and the service uses the OfferProvider repository rather than direct DbContext access.

#### Scenario: OfferProvider persistence keeps metadata in DataAccess
- **WHEN** an OfferProvider is stored in PostgreSQL
- **THEN** the EF entity includes metadata and concurrency while the Domain model includes only business fields and concurrency.
