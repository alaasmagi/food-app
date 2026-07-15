## ADDED Requirements

### Requirement: A user can manage their own notification preferences
The system SHALL expose a self-scoped account endpoint that lets an authenticated user read and update only their own `AppUser.SendNotifications` and `AppUser.NotificationEnvironmentId`, resolving the target `AppUser` from the current identity rather than from a client-supplied id, and reusing the existing environment-ownership validation for `NotificationEnvironmentId`.

#### Scenario: User updates their own notification preferences
- **WHEN** an authenticated user submits `SendNotifications` and `NotificationEnvironmentId` to the notification-preferences endpoint
- **THEN** the system updates those two fields on the acting user's own `AppUser` and returns the result.

#### Scenario: Target user is the current identity, not a supplied id
- **WHEN** an authenticated user calls the notification-preferences endpoint
- **THEN** the system applies the change to the `AppUser` resolved from the authenticated identity and provides no way to target another user's `AppUser`.

#### Scenario: Setting an unowned environment is rejected
- **WHEN** an authenticated user sets `NotificationEnvironmentId` to a `DiningEnvironment` they do not own
- **THEN** the system rejects the update as forbidden and does not change the preference.

#### Scenario: Clearing the environment to null is accepted
- **WHEN** an authenticated user clears `NotificationEnvironmentId` to null
- **THEN** the system stores null so the daily email reverts to all of the user's environments.

#### Scenario: Unauthenticated request is rejected
- **WHEN** an unauthenticated caller requests the notification-preferences endpoint
- **THEN** the system rejects the request according to the configured authentication policy.
