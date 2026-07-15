## ADDED Requirements

### Requirement: Authenticated users manage their own UserWheel records
The system SHALL allow an authenticated user to create, list, read, update, and delete `UserWheel`
records owned by that user, and SHALL NOT expose another user's `UserWheel` records through any list or
read endpoint.

#### Scenario: Create user wheel
- **WHEN** an authenticated user submits a valid `UserWheel` create request with a Name and a list of
  RestaurantNames
- **THEN** the system creates the `UserWheel` owned by that user and returns the created record.

#### Scenario: List own user wheels
- **WHEN** an authenticated user requests the `UserWheel` collection
- **THEN** the system returns only the `UserWheel` records owned by that user.

#### Scenario: Get own user wheel by id
- **WHEN** an authenticated user requests their own existing `UserWheel` by id
- **THEN** the system returns that `UserWheel` record.

#### Scenario: Missing user wheel
- **WHEN** an authenticated user requests a `UserWheel` id that does not exist for any user
- **THEN** the system returns a not-found response through the standard IMethodResponse error mapping.

#### Scenario: Delete own user wheel
- **WHEN** an authenticated user deletes their own existing `UserWheel` record
- **THEN** the system deletes the record.

### Requirement: UserWheel records include a frozen RestaurantNames snapshot and an IsPublic flag
The system SHALL persist and return each `UserWheel` with a Name, a RestaurantNames list of strings, and
an IsPublic flag that defaults to false. RestaurantNames SHALL be stored as a plain list of strings, not
as references to Restaurant records.

#### Scenario: Create with restaurant names
- **WHEN** an authenticated user creates a `UserWheel` with Name "Lunch Roulette" and RestaurantNames
  `["Place A", "Place B"]`
- **THEN** the system stores the `UserWheel` with that exact ordered list of names.

#### Scenario: Default IsPublic
- **WHEN** an authenticated user creates a `UserWheel` without specifying IsPublic
- **THEN** the system stores the `UserWheel` with IsPublic set to false.

#### Scenario: Renaming a restaurant does not change a saved wheel
- **WHEN** a Restaurant referenced by name in an existing `UserWheel`'s RestaurantNames is later renamed
  or deleted
- **THEN** the `UserWheel`'s stored RestaurantNames remain unchanged.

### Requirement: Cross-user access to a UserWheel is forbidden, not filtered silently
The system SHALL reject an authenticated user's attempt to read, update, or delete a `UserWheel` that
exists but is owned by a different user with a forbidden response, distinguishable from the not-found
response returned when the id does not exist at all, regardless of that `UserWheel`'s IsPublic value.

#### Scenario: Read another user's user wheel
- **WHEN** an authenticated user requests an existing `UserWheel` id owned by a different user
- **THEN** the system rejects the request as forbidden.

#### Scenario: Read another user's public user wheel is still forbidden
- **WHEN** an authenticated user requests an existing `UserWheel` id owned by a different user, and that
  `UserWheel` has IsPublic set to true
- **THEN** the system still rejects the request as forbidden - IsPublic currently has no effect on access.

#### Scenario: Update another user's user wheel
- **WHEN** an authenticated user submits an update for an existing `UserWheel` id owned by a different
  user
- **THEN** the system rejects the request as forbidden and does not modify the record.

#### Scenario: Delete another user's user wheel
- **WHEN** an authenticated user requests deletion of an existing `UserWheel` id owned by a different
  user
- **THEN** the system rejects the request as forbidden and does not delete the record.

#### Scenario: Unauthenticated access is rejected
- **WHEN** an unauthenticated caller requests any `UserWheel` endpoint
- **THEN** the system rejects the request according to the configured authentication policy.

### Requirement: UserWheel writes use optimistic concurrency
The system SHALL use the `UserWheel` concurrency token for update and delete operations.

#### Scenario: Update with matching concurrency token
- **WHEN** an authenticated user updates their own `UserWheel` with a matching If-Match concurrency
  token
- **THEN** the system stores the change and returns the updated `UserWheel` with a new concurrency
  token.

#### Scenario: Update with stale concurrency token
- **WHEN** an authenticated user updates their own `UserWheel` with a stale If-Match concurrency token
- **THEN** the system returns a concurrency-conflict response through the standard IMethodResponse
  error mapping.

#### Scenario: Delete without required concurrency token
- **WHEN** an authenticated user deletes their own `UserWheel` without a required If-Match concurrency
  token
- **THEN** the system returns a precondition-required response through the standard IMethodResponse
  error mapping.

### Requirement: UserWheel follows the established vertical slice
The system SHALL implement `UserWheel` through Domain, DTO, Contracts, DataAccess, Application, and Web
layers following the existing AppUser vertical slice pattern, with ownership scoped via
`IBaseEntityUserId` and the current actor resolved from the authenticated request.

#### Scenario: CRUD flow uses service and repository layers
- **WHEN** a `UserWheel` API request is handled
- **THEN** the controller maps Web DTOs to Domain models, resolves the current actor from the
  authenticated request, calls the Application service with that actor, and the service uses the
  UserWheel repository rather than direct DbContext access.

#### Scenario: Persistence keeps metadata and ownership in DataAccess
- **WHEN** a `UserWheel` is stored in PostgreSQL
- **THEN** the EF entity includes metadata, concurrency, and the owning UserId, while the Domain model
  includes only business fields, the owning UserId, and concurrency.
