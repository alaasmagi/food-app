## ADDED Requirements

### Requirement: Unauthenticated read of a public UserWheel
The system SHALL expose `GET /api/v1/public/wheels/{id}` as an unauthenticated endpoint that requires
no `[Authorize]` attribute, no authentication cookie, and no bearer token. When the identified
`UserWheel` exists and its `IsPublic` value is `true`, the system SHALL return that wheel's `Name` and
`RestaurantNames`.

#### Scenario: Public wheel is returned to an anonymous caller
- **WHEN** an anonymous caller (no cookie, no bearer token) requests `GET /api/v1/public/wheels/{id}`
  for a `UserWheel` that exists with `IsPublic == true`
- **THEN** the system returns a 200 response containing that wheel's `Name` and its ordered
  `RestaurantNames` list.

#### Scenario: No authentication is required or consulted
- **WHEN** the endpoint is invoked with no credentials of any kind
- **THEN** the system does not challenge for authentication and does not return 401, but resolves the
  request purely on the wheel's existence and `IsPublic` value.

#### Scenario: RestaurantNames are returned as the frozen stored snapshot
- **WHEN** an anonymous caller reads a public wheel whose `RestaurantNames` were captured at save time
- **THEN** the system returns exactly that stored ordered list of name strings, unaffected by any later
  renaming or deletion of the underlying Restaurant records.

### Requirement: Non-public and non-existent wheels are indistinguishable
The system SHALL return a 404 not-found response when the requested wheel does not exist, and SHALL
also return a 404 not-found response when the wheel exists but its `IsPublic` value is `false`. The
system SHALL NOT return 403 for a non-public wheel and SHALL NOT allow a caller to distinguish a
non-public wheel from a non-existent one, so that wheel ids cannot be enumerated.

#### Scenario: Non-existent wheel returns 404
- **WHEN** an anonymous caller requests `GET /api/v1/public/wheels/{id}` for an id that does not exist
- **THEN** the system returns a 404 not-found response.

#### Scenario: Existing non-public wheel returns 404, not 403
- **WHEN** an anonymous caller requests `GET /api/v1/public/wheels/{id}` for a `UserWheel` that exists
  but has `IsPublic == false`
- **THEN** the system returns a 404 not-found response and never a 403 forbidden response.

#### Scenario: Non-public and non-existent responses are indistinguishable
- **WHEN** an anonymous caller compares the response for an existing non-public wheel id against the
  response for a never-existing wheel id
- **THEN** the two responses are equivalent in status code and body, revealing nothing about which
  wheel ids exist.

### Requirement: Minimal public DTO excludes all owner and identity fields
The system SHALL serialize the public wheel response through a dedicated minimal DTO that carries only
`Name` and `RestaurantNames`. The public response SHALL NOT include `UserId`, `Id`, `ConcurrencyToken`,
or any other `UserWheel` field, and this DTO SHALL be separate from the existing owner-facing UserWheel
Web DTO.

#### Scenario: Owner and identity fields are absent from the response
- **WHEN** an anonymous caller successfully reads a public wheel
- **THEN** the response body contains `Name` and `RestaurantNames` only, and contains no `UserId`, no
  `Id`, no `ConcurrencyToken`, and no other `UserWheel` field.

#### Scenario: Public DTO is distinct from the owner DTO
- **WHEN** the public endpoint and the authenticated owner endpoints serialize the same underlying
  `UserWheel`
- **THEN** the public endpoint uses its own minimal DTO type rather than the owner-facing UserWheel Web
  DTO.

### Requirement: The public endpoint is rate limited more strictly than authenticated endpoints
The system SHALL apply a dedicated rate-limit policy to `GET /api/v1/public/wheels/{id}` using the
existing `ApiRateLimitOptions` configuration pattern. Because this endpoint is unauthenticated and has
no per-user accounting, its configured limit SHALL be stricter than the limit applied to authenticated
endpoints, and requests exceeding it SHALL be rejected with a 429 too-many-requests response.

#### Scenario: Requests over the public limit are rejected
- **WHEN** an anonymous caller exceeds the configured request rate for `GET /api/v1/public/wheels/{id}`
- **THEN** the system rejects the excess requests with a 429 too-many-requests response.

#### Scenario: The public limit is stricter than the authenticated limit
- **WHEN** the public endpoint's rate-limit policy and the authenticated endpoints' rate-limit policy
  are compared
- **THEN** the public endpoint permits fewer requests per window, reflecting the absence of per-user
  accounting.

#### Scenario: The rate limit is configured through the existing pattern
- **WHEN** the public endpoint's rate limit is defined
- **THEN** it is expressed through the existing `ApiRateLimitOptions` pattern rather than a bespoke,
  parallel configuration mechanism.
