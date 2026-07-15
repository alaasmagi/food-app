# dining-environment Specification

## Purpose
TBD - created by archiving change add-dining-environment. Update Purpose after archive.
## Requirements
### Requirement: Authenticated users manage their own DiningEnvironment records
The system SHALL allow an authenticated user to create, list, read, update, and delete `DiningEnvironment`
records owned by that user, and SHALL NOT expose another user's `DiningEnvironment` records through any
list or read endpoint.

#### Scenario: Create dining environment
- **WHEN** an authenticated user submits a valid `DiningEnvironment` create request with a Name
- **THEN** the system creates the `DiningEnvironment` owned by that user and returns the created record.

#### Scenario: List own dining environments
- **WHEN** an authenticated user requests the `DiningEnvironment` collection
- **THEN** the system returns only the `DiningEnvironment` records owned by that user.

#### Scenario: Get own dining environment by id
- **WHEN** an authenticated user requests their own existing `DiningEnvironment` by id
- **THEN** the system returns that `DiningEnvironment` record.

#### Scenario: Missing dining environment
- **WHEN** an authenticated user requests a `DiningEnvironment` id that does not exist for any user
- **THEN** the system returns a not-found response through the standard IMethodResponse error mapping.

### Requirement: DiningEnvironment records include Name and optional Description
The system SHALL persist and return each `DiningEnvironment` with a required Name and an optional
nullable Description.

#### Scenario: Create without description
- **WHEN** an authenticated user creates a `DiningEnvironment` with a Name and no Description
- **THEN** the system stores the `DiningEnvironment` with a null Description.

#### Scenario: Create with description
- **WHEN** an authenticated user creates a `DiningEnvironment` with a Name and a Description
- **THEN** the system stores both fields and returns them unchanged.

### Requirement: Cross-user access to a DiningEnvironment is forbidden, not filtered silently
The system SHALL reject an authenticated user's attempt to read, update, or delete a `DiningEnvironment`
that exists but is owned by a different user with a forbidden response, distinguishable from the
not-found response returned when the id does not exist at all.

#### Scenario: Read another user's dining environment
- **WHEN** an authenticated user requests an existing `DiningEnvironment` id owned by a different user
- **THEN** the system rejects the request as forbidden.

#### Scenario: Update another user's dining environment
- **WHEN** an authenticated user submits an update for an existing `DiningEnvironment` id owned by a
  different user
- **THEN** the system rejects the request as forbidden and does not modify the record.

#### Scenario: Delete another user's dining environment
- **WHEN** an authenticated user requests deletion of an existing `DiningEnvironment` id owned by a
  different user
- **THEN** the system rejects the request as forbidden and does not delete the record.

#### Scenario: Unauthenticated access is rejected
- **WHEN** an unauthenticated caller requests any `DiningEnvironment` endpoint
- **THEN** the system rejects the request according to the configured authentication policy.

### Requirement: DiningEnvironment writes use optimistic concurrency
The system SHALL use the `DiningEnvironment` concurrency token for update and delete operations.

#### Scenario: Update with matching concurrency token
- **WHEN** an authenticated user updates their own `DiningEnvironment` with a matching If-Match
  concurrency token
- **THEN** the system stores the change and returns the updated `DiningEnvironment` with a new
  concurrency token.

#### Scenario: Update with stale concurrency token
- **WHEN** an authenticated user updates their own `DiningEnvironment` with a stale If-Match
  concurrency token
- **THEN** the system returns a concurrency-conflict response through the standard IMethodResponse
  error mapping.

#### Scenario: Delete without required concurrency token
- **WHEN** an authenticated user deletes their own `DiningEnvironment` without a required If-Match
  concurrency token
- **THEN** the system returns a precondition-required response through the standard IMethodResponse
  error mapping.

### Requirement: Deleting a DiningEnvironment cascades to its EnvironmentRestaurant memberships
The system SHALL delete all `EnvironmentRestaurant` rows belonging to a `DiningEnvironment` when that
`DiningEnvironment` is deleted.

#### Scenario: Delete environment with memberships
- **WHEN** an authenticated user deletes a `DiningEnvironment` that has one or more `EnvironmentRestaurant`
  memberships
- **THEN** the system deletes the `DiningEnvironment` and all of its `EnvironmentRestaurant` rows in the
  same operation.

### Requirement: Authenticated users manage their own EnvironmentRestaurant memberships
The system SHALL allow an authenticated user to create, list, read, and delete `EnvironmentRestaurant`
membership records owned by that user, referencing one `DiningEnvironment` and one `Restaurant`, and
SHALL NOT expose another user's `EnvironmentRestaurant` records through any list or read endpoint.

#### Scenario: Add restaurant to own environment
- **WHEN** an authenticated user submits a valid `EnvironmentRestaurant` create request referencing
  their own `DiningEnvironment` and an existing `Restaurant`
- **THEN** the system creates the membership owned by that user and returns the created record.

#### Scenario: List own environment memberships
- **WHEN** an authenticated user requests the `EnvironmentRestaurant` collection
- **THEN** the system returns only the `EnvironmentRestaurant` records owned by that user.

#### Scenario: Cannot add restaurant to another user's environment
- **WHEN** an authenticated user submits an `EnvironmentRestaurant` create request referencing a
  `DiningEnvironment` owned by a different user
- **THEN** the system rejects the request as forbidden and does not create the membership.

#### Scenario: Remove restaurant from own environment
- **WHEN** an authenticated user deletes their own existing `EnvironmentRestaurant` record
- **THEN** the system deletes the membership.

#### Scenario: Cross-user access to a membership is forbidden
- **WHEN** an authenticated user requests or deletes an existing `EnvironmentRestaurant` id owned by a
  different user
- **THEN** the system rejects the request as forbidden.

### Requirement: A Restaurant appears at most once per DiningEnvironment for a given user
The system SHALL reject an `EnvironmentRestaurant` create request that would duplicate an existing
`(DiningEnvironment, Restaurant)` pairing for the same owning user.

#### Scenario: Duplicate membership rejected
- **WHEN** an authenticated user submits an `EnvironmentRestaurant` create request for a Restaurant that
  is already a member of the target `DiningEnvironment`
- **THEN** the system rejects the request and does not create a duplicate membership.

#### Scenario: Same restaurant allowed in a different environment
- **WHEN** an authenticated user submits an `EnvironmentRestaurant` create request for a Restaurant that
  is already a member of a different `DiningEnvironment` owned by the same user
- **THEN** the system creates the new membership successfully.

### Requirement: Deleting a Restaurant cascades to its EnvironmentRestaurant memberships
The system SHALL delete all `EnvironmentRestaurant` rows referencing a `Restaurant` when that
`Restaurant` is deleted, across all users.

#### Scenario: Admin deletes a restaurant referenced by environments
- **WHEN** an admin deletes a `Restaurant` that is referenced by one or more `EnvironmentRestaurant`
  rows belonging to any user
- **THEN** the system deletes the `Restaurant` and all `EnvironmentRestaurant` rows that referenced it.

### Requirement: DiningEnvironment and EnvironmentRestaurant follow the established vertical slice
The system SHALL implement `DiningEnvironment` and `EnvironmentRestaurant` through Domain, DTO,
Contracts, DataAccess, Application, and Web layers following the existing AppUser vertical slice
pattern, with ownership scoped via `IBaseEntityUserId` and the current actor resolved from the
authenticated request.

#### Scenario: CRUD flow uses service and repository layers
- **WHEN** a `DiningEnvironment` or `EnvironmentRestaurant` API request is handled
- **THEN** the controller maps Web DTOs to Domain models, resolves the current actor from the
  authenticated request, calls the Application service with that actor, and the service uses the
  corresponding repository rather than direct DbContext access.

#### Scenario: Persistence keeps metadata and ownership in DataAccess
- **WHEN** a `DiningEnvironment` or `EnvironmentRestaurant` is stored in PostgreSQL
- **THEN** the EF entity includes metadata, concurrency, and the owning UserId, while the Domain model
  includes only business fields, the owning UserId, and concurrency.
