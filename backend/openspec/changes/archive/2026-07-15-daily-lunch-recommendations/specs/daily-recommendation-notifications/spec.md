## MODIFIED Requirements

### Requirement: Daily lunch recommendation delivery is opt-in
The system SHALL model daily lunch recommendation email opt-in as `AppUser.SendNotifications` and SHALL publish daily lunch recommendation events only for users where this flag is true.

#### Scenario: New user is not subscribed by default
- **WHEN** an `AppUser` is created from a Keycloak identity event
- **THEN** `SendNotifications` defaults to false.

#### Scenario: Identity update preserves notification preference
- **WHEN** a Keycloak identity update event updates an existing `AppUser`
- **THEN** the system updates identity-sourced fields without changing `SendNotifications`.

#### Scenario: Opted-in user receives event
- **WHEN** the daily recommendation notification run processes an `AppUser` where `SendNotifications` is true
- **THEN** the system publishes one daily lunch recommendation event for that user.

#### Scenario: Non-opted-in user is skipped
- **WHEN** the daily recommendation notification run processes an `AppUser` where `SendNotifications` is false
- **THEN** the system does not publish a daily lunch recommendation event for that user.

### Requirement: Recommendations aggregate all user environment restaurants
The system SHALL source recommendation restaurants according to the opted-in user's `AppUser.NotificationEnvironmentId`: when it is set, from only that one `DiningEnvironment`'s `EnvironmentRestaurant` memberships; when it is null, from all of the user's `DiningEnvironment` and `EnvironmentRestaurant` memberships combined into one flat list deduplicated by `RestaurantId`.

#### Scenario: Null scope considers restaurants from all environments
- **WHEN** an opted-in user has `NotificationEnvironmentId` null and restaurants in more than one dining environment
- **THEN** the recommendation run considers restaurants from every one of those environments.

#### Scenario: Null scope emits one flat list
- **WHEN** recommendation rows are created for a user with `NotificationEnvironmentId` null and multiple dining environments
- **THEN** the rows are emitted as one flat `recommendationRows` list, not grouped or limited by environment.

#### Scenario: Set scope limits to the chosen environment
- **WHEN** an opted-in user has `NotificationEnvironmentId` set to one of their dining environments
- **THEN** the recommendation run considers only restaurants that are members of that environment.

#### Scenario: Set scope excludes other environments' restaurants
- **WHEN** an opted-in user has `NotificationEnvironmentId` set and also has restaurants in other dining environments
- **THEN** the recommendation run excludes restaurants that are only members of those other environments.

#### Scenario: Duplicate restaurant is emitted once
- **WHEN** the same `RestaurantId` appears in more than one of the user's dining environments that fall within the resolved scope
- **THEN** the system emits at most one recommendation row for that restaurant.

## ADDED Requirements

### Requirement: Notification environment scope must be owned by the user
The system SHALL reject any attempt to set `AppUser.NotificationEnvironmentId` to a `DiningEnvironment` that is not owned by the acting user, SHALL accept a `DiningEnvironment` owned by the acting user, and SHALL accept null to mean "all of the user's environments".

#### Scenario: Set to own environment succeeds
- **WHEN** a user sets their `NotificationEnvironmentId` to a `DiningEnvironment` they own
- **THEN** the system stores the value.

#### Scenario: Set to another user's environment is forbidden
- **WHEN** a user sets their `NotificationEnvironmentId` to an existing `DiningEnvironment` owned by a different user
- **THEN** the system rejects the write as forbidden and does not store the value.

#### Scenario: Set to a nonexistent environment is rejected
- **WHEN** a user sets their `NotificationEnvironmentId` to a `DiningEnvironment` id that does not exist
- **THEN** the system rejects the write through the standard IMethodResponse error mapping and does not store the value.

#### Scenario: Cleared to null succeeds
- **WHEN** a user clears their `NotificationEnvironmentId` to null
- **THEN** the system stores null and the daily email reverts to sourcing from all of the user's environments.
