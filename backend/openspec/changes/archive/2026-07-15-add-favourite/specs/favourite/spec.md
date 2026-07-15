## ADDED Requirements

### Requirement: Authenticated users manage their own Favourite records
The system SHALL allow an authenticated user to create, list, read, and delete `Favourite` records
owned by that user, and SHALL NOT expose another user's `Favourite` records through any list or read
endpoint.

#### Scenario: Create favourite
- **WHEN** an authenticated user submits a valid `Favourite` create request for a Restaurant they have
  not yet favourited, with a Rating and optional Note
- **THEN** the system creates the `Favourite` owned by that user and returns the created record.

#### Scenario: List own favourites
- **WHEN** an authenticated user requests the `Favourite` collection
- **THEN** the system returns only the `Favourite` records owned by that user.

#### Scenario: Get own favourite by id
- **WHEN** an authenticated user requests their own existing `Favourite` by id
- **THEN** the system returns that `Favourite` record.

#### Scenario: Missing favourite
- **WHEN** an authenticated user requests a `Favourite` id that does not exist for any user
- **THEN** the system returns a not-found response through the standard IMethodResponse error mapping.

#### Scenario: Delete own favourite
- **WHEN** an authenticated user deletes their own existing `Favourite` record
- **THEN** the system deletes the record.

### Requirement: Favourite records include Rating and optional Note for a Restaurant
The system SHALL persist and return each `Favourite` with a RestaurantId, a required Rating between 1
and 5 inclusive, and an optional nullable Note.

#### Scenario: Create with valid rating and no note
- **WHEN** an authenticated user creates a `Favourite` with Rating 4 and no Note
- **THEN** the system stores the `Favourite` with a null Note.

#### Scenario: Create with valid rating and note
- **WHEN** an authenticated user creates a `Favourite` with Rating 5 and a Note
- **THEN** the system stores both fields and returns them unchanged.

#### Scenario: Reject out-of-range rating
- **WHEN** an authenticated user submits a `Favourite` create or update request with a Rating outside
  the 1-5 range
- **THEN** the system rejects the request as invalid and does not persist the record.

### Requirement: Cross-user access to a Favourite is forbidden, not filtered silently
The system SHALL reject an authenticated user's attempt to read, update, or delete a `Favourite` that
exists but is owned by a different user with a forbidden response, distinguishable from the not-found
response returned when the id does not exist at all.

#### Scenario: Read another user's favourite
- **WHEN** an authenticated user requests an existing `Favourite` id owned by a different user
- **THEN** the system rejects the request as forbidden.

#### Scenario: Update another user's favourite
- **WHEN** an authenticated user submits an update for an existing `Favourite` id owned by a different
  user
- **THEN** the system rejects the request as forbidden and does not modify the record.

#### Scenario: Delete another user's favourite
- **WHEN** an authenticated user requests deletion of an existing `Favourite` id owned by a different
  user
- **THEN** the system rejects the request as forbidden and does not delete the record.

#### Scenario: Unauthenticated access is rejected
- **WHEN** an unauthenticated caller requests any `Favourite` endpoint
- **THEN** the system rejects the request according to the configured authentication policy.

### Requirement: A Restaurant has at most one Favourite per user
The system SHALL allow at most one `Favourite` per `(User, Restaurant)` pair. Submitting a create
request for a Restaurant the user has already favourited SHALL update the existing `Favourite` with the
new Rating and Note rather than creating a duplicate record.

#### Scenario: Re-rating an already-favourited restaurant
- **WHEN** an authenticated user submits a `Favourite` create request for a Restaurant they have already
  favourited, with a different Rating
- **THEN** the system updates the existing `Favourite` record with the new Rating (and Note, if
  provided) and returns it with the same id as the original record.

#### Scenario: Different users can each favourite the same restaurant independently
- **WHEN** two different authenticated users each submit a `Favourite` create request for the same
  Restaurant
- **THEN** the system creates one `Favourite` record per user, each independently owned.

### Requirement: Favourite writes use optimistic concurrency for explicit updates
The system SHALL use the `Favourite` concurrency token for explicit update and delete operations
performed by id.

#### Scenario: Update with matching concurrency token
- **WHEN** an authenticated user updates their own `Favourite` by id with a matching If-Match
  concurrency token
- **THEN** the system stores the change and returns the updated `Favourite` with a new concurrency
  token.

#### Scenario: Update with stale concurrency token
- **WHEN** an authenticated user updates their own `Favourite` by id with a stale If-Match concurrency
  token
- **THEN** the system returns a concurrency-conflict response through the standard IMethodResponse
  error mapping.

#### Scenario: Delete without required concurrency token
- **WHEN** an authenticated user deletes their own `Favourite` without a required If-Match concurrency
  token
- **THEN** the system returns a precondition-required response through the standard IMethodResponse
  error mapping.

### Requirement: Deleting a Restaurant cascades to its Favourite records
The system SHALL delete all `Favourite` rows referencing a `Restaurant` when that `Restaurant` is
deleted, across all users.

#### Scenario: Admin deletes a restaurant with existing favourites
- **WHEN** an admin deletes a `Restaurant` that is favourited by one or more users
- **THEN** the system deletes the `Restaurant` and all `Favourite` rows that referenced it.

### Requirement: Favourite follows the established vertical slice
The system SHALL implement `Favourite` through Domain, DTO, Contracts, DataAccess, Application, and Web
layers following the existing AppUser vertical slice pattern, with ownership scoped via
`IBaseEntityUserId` and the current actor resolved from the authenticated request.

#### Scenario: CRUD flow uses service and repository layers
- **WHEN** a `Favourite` API request is handled
- **THEN** the controller maps Web DTOs to Domain models, resolves the current actor from the
  authenticated request, calls the Application service with that actor, and the service uses the
  Favourite repository rather than direct DbContext access.

#### Scenario: Persistence keeps metadata and ownership in DataAccess
- **WHEN** a `Favourite` is stored in PostgreSQL
- **THEN** the EF entity includes metadata, concurrency, and the owning UserId, while the Domain model
  includes only business fields, the owning UserId, and concurrency.
