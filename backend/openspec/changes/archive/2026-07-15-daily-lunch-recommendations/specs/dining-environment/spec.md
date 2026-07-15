## ADDED Requirements

### Requirement: Deleting a DiningEnvironment clears referencing notification scope
The system SHALL set `AppUser.NotificationEnvironmentId` to null for any `AppUser` whose `NotificationEnvironmentId` references a `DiningEnvironment` that is being deleted, and SHALL NOT block or fail the deletion because of that reference.

#### Scenario: Delete referenced environment clears the scope
- **WHEN** a `DiningEnvironment` is deleted and an `AppUser` has `NotificationEnvironmentId` equal to that environment's id
- **THEN** the system sets that `AppUser.NotificationEnvironmentId` to null.

#### Scenario: Delete does not fail because of a notification reference
- **WHEN** a user deletes a `DiningEnvironment` that is referenced by an `AppUser.NotificationEnvironmentId`
- **THEN** the system completes the deletion successfully rather than returning a foreign-key or reference error.

#### Scenario: Unreferenced environment deletion leaves other scopes intact
- **WHEN** a `DiningEnvironment` is deleted and no `AppUser.NotificationEnvironmentId` references it
- **THEN** the system does not change any `AppUser.NotificationEnvironmentId` value.
