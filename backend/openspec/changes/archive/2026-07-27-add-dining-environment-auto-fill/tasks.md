## 1. Domain and DTO fields

- [x] 1.1 Add `AutoFillLatitude` (double?), `AutoFillLongitude` (double?), and `AutoFillRadiusMeters` (int?) to the Domain `DiningEnvironment` entity, keeping it a `BaseEntityUserWithConcurrency` with no metadata fields.
- [x] 1.2 Add the same three nullable fields to the DataAccess EF `DiningEnvironment` entity (`BaseEntityUserWithMetaConcurrency`).
- [x] 1.3 Add the three nullable fields to the `DiningEnvironment` Web DTO (create/update input and read output).
- [x] 1.4 Update the Domain↔EF mapper for `DiningEnvironment` to carry all three fields in both directions (never drop a field).
- [x] 1.5 Update the Domain↔Web mapper for `DiningEnvironment` to carry all three fields in both directions (never drop a field).

## 2. Persistence

- [x] 2.1 Configure the three columns in the `DiningEnvironment` EF entity type configuration (nullable, no default) on `AppDbContext`.
- [x] 2.2 Add an `AppDbContext` EF Core migration adding `AutoFillLatitude`, `AutoFillLongitude`, and `AutoFillRadiusMeters` nullable columns to the `dining_environments` table (no new table; do not touch `OfferCacheDbContext`).

## 3. Write-path validation

- [x] 3.1 In `DiningEnvironmentService` create/update, reject a request that sets exactly one of `AutoFillLatitude`/`AutoFillLongitude` with a VALIDATION `IMethodResponse` failure (both-or-neither).
- [x] 3.2 Reject a request that sets `AutoFillRadiusMeters` without both coordinates present with a VALIDATION failure.
- [x] 3.3 Reject a supplied `AutoFillLatitude` outside -90..90 or `AutoFillLongitude` outside -180..180 with a VALIDATION failure.
- [x] 3.4 Reject a supplied `AutoFillRadiusMeters` outside the inclusive range 1..50000 with a VALIDATION failure.
- [x] 3.5 Ensure that when coordinates are set and `AutoFillRadiusMeters` is null, the service persists radius as null (no substituted default written to the row).

## 4. Auto-fill operation

- [x] 4.1 Add an auto-fill result DTO (e.g. `{ added, alreadyPresent, totalMembers }`) under DTO/Web.
- [x] 4.2 Add an `AutoFillAsync(environmentId, actor)` method to the `DiningEnvironmentService` contract and implementation.
- [x] 4.3 In `AutoFillAsync`, load the target environment through the actor-scoped repository/service so a non-existent id returns NOT_FOUND and another user's id returns FORBIDDEN; add no memberships in either case.
- [x] 4.4 Return a VALIDATION failure (mapped to 400) when the loaded environment has a null `AutoFillLatitude` or `AutoFillLongitude`, explaining auto-fill is unavailable without a stored location.
- [x] 4.5 Compute the effective radius as `AutoFillRadiusMeters` when set, else 500 meters (applied only here, not persisted).
- [x] 4.6 Load restaurants and compute haversine (great-circle) distance from the stored origin to each restaurant that has BOTH `Latitude` and `Longitude` set; silently skip restaurants missing either coordinate.
- [x] 4.7 For each in-radius restaurant not already a member, create an `EnvironmentRestaurant` owned by the actor via the membership repository; do not create duplicates and do not remove existing out-of-radius members.
- [x] 4.8 Return the summary DTO with counts of added, already-present, and resulting total memberships.

## 5. Web endpoint

- [x] 5.1 Add `POST /api/v1/dining-environments/{id}/auto-fill` to `DiningEnvironmentsController`, Bearer-authorized, resolving the current actor and calling `AutoFillAsync`.
- [x] 5.2 Map the `IMethodResponse` result to HTTP (VALIDATION→400, FORBIDDEN→403, NOT_FOUND→404) consistent with the other endpoints, returning the summary DTO on success.

## 6. Verification

- [x] 6.1 Build the solution and apply the migration to a dev database; confirm the three columns exist on `dining_environments` and existing rows read as null.
- [x] 6.2 Exercise create/update validation: both-or-neither coordinates, radius-without-coordinates, out-of-range coordinates, out-of-range radius, and null-radius-persists-null.
- [x] 6.3 Exercise auto-fill: nearby restaurants added, missing-coordinate restaurants skipped, default 500 m when radius null, no duplicate memberships, out-of-radius members retained, FORBIDDEN for another user's environment, and 400 when no coordinates are stored.
