## ADDED Requirements

### Requirement: DiningEnvironment carries an optional saved auto-fill origin
The system SHALL persist and return each `DiningEnvironment` with three optional, nullable auto-fill
fields: `AutoFillLatitude` (double), `AutoFillLongitude` (double), and `AutoFillRadiusMeters` (int).
These fields SHALL be carried through the Domain model, the DataAccess EF entity, the Web DTO, and
both mappers without being dropped, and SHALL default to null when not supplied.

#### Scenario: Create environment without auto-fill fields
- **WHEN** an authenticated user creates a `DiningEnvironment` with a Name and no auto-fill fields
- **THEN** the system stores the environment with `AutoFillLatitude`, `AutoFillLongitude`, and
  `AutoFillRadiusMeters` all null and returns them as null.

#### Scenario: Create environment with coordinates and radius
- **WHEN** an authenticated user creates a `DiningEnvironment` with `AutoFillLatitude`,
  `AutoFillLongitude`, and `AutoFillRadiusMeters` all set to valid values
- **THEN** the system stores all three values unchanged and returns them on read.

#### Scenario: Auto-fill fields round-trip on read
- **WHEN** an authenticated user reads a `DiningEnvironment` that has stored auto-fill values
- **THEN** the returned Web DTO includes the stored `AutoFillLatitude`, `AutoFillLongitude`, and
  `AutoFillRadiusMeters` values.

### Requirement: Auto-fill coordinates are both-or-neither on the write path
The system SHALL reject a `DiningEnvironment` create or update request that supplies exactly one of
`AutoFillLatitude` or `AutoFillLongitude` without the other, returning a validation error through the
standard IMethodResponse error mapping, and SHALL NOT persist a partial coordinate pair.

#### Scenario: Latitude without longitude is rejected
- **WHEN** an authenticated user submits a `DiningEnvironment` write with `AutoFillLatitude` set and
  `AutoFillLongitude` null
- **THEN** the system rejects the request with a validation error and does not persist the change.

#### Scenario: Longitude without latitude is rejected
- **WHEN** an authenticated user submits a `DiningEnvironment` write with `AutoFillLongitude` set and
  `AutoFillLatitude` null
- **THEN** the system rejects the request with a validation error and does not persist the change.

#### Scenario: Both coordinates null is accepted
- **WHEN** an authenticated user submits a `DiningEnvironment` write with both `AutoFillLatitude` and
  `AutoFillLongitude` null
- **THEN** the system accepts the request with respect to the coordinate-pair rule.

### Requirement: Auto-fill radius requires coordinates and stays within bounds
The system SHALL reject a `DiningEnvironment` create or update request that supplies
`AutoFillRadiusMeters` without both coordinates set, and SHALL reject a supplied `AutoFillRadiusMeters`
that is not a positive integer within the inclusive range 1..50000 meters, returning a validation error
through the standard IMethodResponse error mapping. When coordinates are supplied and
`AutoFillRadiusMeters` is null, the system SHALL persist the radius as null and SHALL NOT write a
substitute default value to the row.

#### Scenario: Radius without coordinates is rejected
- **WHEN** an authenticated user submits a `DiningEnvironment` write with `AutoFillRadiusMeters` set
  and either coordinate null
- **THEN** the system rejects the request with a validation error and does not persist the change.

#### Scenario: Radius below the minimum is rejected
- **WHEN** an authenticated user submits a `DiningEnvironment` write with valid coordinates and
  `AutoFillRadiusMeters` less than 1
- **THEN** the system rejects the request with a validation error.

#### Scenario: Radius above the cap is rejected
- **WHEN** an authenticated user submits a `DiningEnvironment` write with valid coordinates and
  `AutoFillRadiusMeters` greater than 50000
- **THEN** the system rejects the request with a validation error.

#### Scenario: Coordinates without radius persist a null radius
- **WHEN** an authenticated user submits a `DiningEnvironment` write with valid coordinates and
  `AutoFillRadiusMeters` null
- **THEN** the system persists the environment with `AutoFillRadiusMeters` stored as null rather than a
  substituted default value.

### Requirement: Auto-fill coordinates must be geographically valid
The system SHALL reject a `DiningEnvironment` create or update request whose supplied
`AutoFillLatitude` is outside the inclusive range -90..90 or whose supplied `AutoFillLongitude` is
outside the inclusive range -180..180, returning a validation error through the standard IMethodResponse
error mapping.

#### Scenario: Out-of-range latitude is rejected
- **WHEN** an authenticated user submits a `DiningEnvironment` write with `AutoFillLatitude` outside
  -90..90 and a valid `AutoFillLongitude`
- **THEN** the system rejects the request with a validation error.

#### Scenario: Out-of-range longitude is rejected
- **WHEN** an authenticated user submits a `DiningEnvironment` write with `AutoFillLongitude` outside
  -180..180 and a valid `AutoFillLatitude`
- **THEN** the system rejects the request with a validation error.

### Requirement: Proximity auto-fill adds in-radius restaurants to an owned environment
The system SHALL expose `POST /api/v1/dining-environments/{id}/auto-fill`, authorized and owner-scoped,
that reads the target `DiningEnvironment`'s stored auto-fill origin and adds every `Restaurant` within
the radius as an `EnvironmentRestaurant` membership. The system SHALL compute great-circle (haversine)
distance from `(AutoFillLatitude, AutoFillLongitude)` to each `Restaurant`'s stored coordinates
(`Restaurant.Latitude` and `Restaurant.Longitude` are always present), and SHALL use an effective radius
of `AutoFillRadiusMeters` when set or 500 meters when `AutoFillRadiusMeters` is null. The operation SHALL
be additive only: it SHALL add each in-radius restaurant that is not already a member without creating
duplicates, and SHALL NOT remove existing members that fall outside the radius.

#### Scenario: Auto-fill adds nearby restaurants
- **WHEN** an authenticated user calls auto-fill on their own `DiningEnvironment` that has stored
  coordinates and one or more in-radius restaurants that are not yet members
- **THEN** the system creates an `EnvironmentRestaurant` membership for each in-radius restaurant not
  already present, owned by that user.

#### Scenario: Default radius applies when none is stored
- **WHEN** an authenticated user calls auto-fill on their own `DiningEnvironment` that has stored
  coordinates and a null `AutoFillRadiusMeters`
- **THEN** the system uses an effective radius of 500 meters to select in-radius restaurants.

#### Scenario: Existing members are not duplicated
- **WHEN** auto-fill selects an in-radius restaurant that is already a member of the target environment
- **THEN** the system does not create a second `EnvironmentRestaurant` for that restaurant.

#### Scenario: Out-of-radius existing members are retained
- **WHEN** auto-fill runs on an environment that already has a member restaurant located outside the
  radius
- **THEN** the system leaves that existing membership in place and does not remove it.

#### Scenario: Auto-fill returns a summary of the result
- **WHEN** auto-fill completes on an owned environment with stored coordinates
- **THEN** the system returns a summary including the number of memberships added, the number already
  present, and the resulting membership count.

### Requirement: Auto-fill requires stored coordinates
The system SHALL reject an auto-fill request against a `DiningEnvironment` that has a null
`AutoFillLatitude` or a null `AutoFillLongitude` with a validation error (HTTP 400) explaining that
auto-fill is unavailable without a stored location, and SHALL NOT add any memberships.

#### Scenario: Auto-fill without stored coordinates is rejected
- **WHEN** an authenticated user calls auto-fill on their own `DiningEnvironment` whose
  `AutoFillLatitude` or `AutoFillLongitude` is null
- **THEN** the system returns a validation error indicating auto-fill is unavailable without a location
  and adds no memberships.

### Requirement: Auto-fill is owner-scoped
The system SHALL reject an auto-fill request targeting a `DiningEnvironment` owned by a different user
with a forbidden response, distinguishable from the not-found response returned when the id does not
exist at all, and SHALL NOT add any memberships to the other user's environment.

#### Scenario: Auto-fill another user's environment is forbidden
- **WHEN** an authenticated user calls auto-fill on an existing `DiningEnvironment` id owned by a
  different user
- **THEN** the system rejects the request as forbidden and adds no memberships.

#### Scenario: Auto-fill a non-existent environment is not found
- **WHEN** an authenticated user calls auto-fill on a `DiningEnvironment` id that does not exist for
  any user
- **THEN** the system returns a not-found response through the standard IMethodResponse error mapping.

#### Scenario: Unauthenticated auto-fill is rejected
- **WHEN** an unauthenticated caller invokes the auto-fill endpoint
- **THEN** the system rejects the request according to the configured authentication policy.
