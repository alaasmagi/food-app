# daily-recommendation-notifications Specification

## Purpose
TBD - created by archiving change add-daily-recommendation-notification-service. Update Purpose after archive.
## Requirements
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

### Requirement: Daily lunch recommendation event uses the food email contract
The system SHALL publish a `DailyLunchRecommendationEvent` using food-app-specific DTO records whose serialized contract is exactly `type`, `source`, `action`, `timestamp`, and `content`.

#### Scenario: Event envelope fields are fixed
- **WHEN** a daily lunch recommendation event is created
- **THEN** `type` is `email`, `source` is `food`, and `action` is `daily.lunch.recommendation`.

#### Scenario: Event content fields match email hub contract
- **WHEN** a daily lunch recommendation event is serialized
- **THEN** `content` contains `email`, `fullName`, `locale`, `currency`, `recommendationRows`, and `linkToUserWheel`.

#### Scenario: Row fields match email hub contract
- **WHEN** a recommendation row is serialized
- **THEN** it contains `restaurantName`, `offers`, `offerTimes`, and `link`.

#### Scenario: Offer line fields match email hub contract
- **WHEN** an offer line is serialized
- **THEN** it contains `offerText` and `offerPrice`.

#### Scenario: Food DTOs are not Keycloak DTOs
- **WHEN** the daily lunch recommendation DTO records are implemented
- **THEN** they live in the food-app messaging DTO area and do not reuse `Base.Keycloak.Events` DTOs.

#### Scenario: Action is defined locally
- **WHEN** the daily lunch recommendation action is referenced
- **THEN** the code uses a local `daily.lunch.recommendation` action constant following the same naming convention as `DefaultMessageActions`.

### Requirement: Recommendation content uses AppUser recipient data
The system SHALL populate daily lunch recommendation recipient fields from the opted-in `AppUser` and notification options.

#### Scenario: Recipient fields are mapped
- **WHEN** the system builds `DailyLunchRecommendationContent` for an opted-in user
- **THEN** `email`, `fullName`, and `locale` match the user's `AppUser` values.

#### Scenario: Currency comes from notification options
- **WHEN** the system builds `DailyLunchRecommendationContent`
- **THEN** `currency` is populated from configured daily recommendation notification options.

#### Scenario: User with no current recommendation rows still gets an event
- **WHEN** an opted-in user has no restaurants with current offers after filtering
- **THEN** the system publishes the event with an empty `recommendationRows` array.

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

### Requirement: Recommendation rows include only current offer restaurants
The system SHALL include recommendation rows only for restaurants where `Restaurant.HasOffers == true` and current offers are available from a fresh cache row or a fetchable provider/cache refresh path.

#### Scenario: Restaurant without offers is excluded
- **WHEN** a user's environment contains a restaurant where `HasOffers` is false
- **THEN** the system excludes that restaurant from `recommendationRows`.

#### Scenario: Fresh cache row is included
- **WHEN** a user's offer-capable restaurant has a fresh offer cache row for the current UTC business date and TTL
- **THEN** the system may build the recommendation row from that cached offer data.

#### Scenario: Fetchable stale cache may be refreshed
- **WHEN** a user's offer-capable restaurant has a missing or stale cache row and a fetchable provider source
- **THEN** the system requests current offers through the offer fetch service and uses the successful result.

#### Scenario: Nonfetchable stale cache is excluded
- **WHEN** a user's offer-capable restaurant has no fresh cache row and no fetchable provider source
- **THEN** the system excludes that restaurant from `recommendationRows`.

#### Scenario: Empty current offers are excluded
- **WHEN** current offer data for a restaurant is empty
- **THEN** the system excludes that restaurant from `recommendationRows` instead of creating an empty row.

#### Scenario: Offer fetch failure excludes only that restaurant
- **WHEN** fetching current offers for one candidate restaurant fails
- **THEN** the system excludes that restaurant and continues building the user's remaining recommendation rows.

### Requirement: Offer price text is passed through unchanged
The system SHALL map offer prices from the offer provider/cache source to `offerPrice` without reformatting, normalization, currency symbol stripping, or trimming.

#### Scenario: Price text is copied exactly
- **WHEN** a current offer has `DailyOfferItem.PriceText` equal to a non-null string
- **THEN** the matching `OfferLine.offerPrice` is exactly the same string.

#### Scenario: Null price remains null
- **WHEN** a current offer has `DailyOfferItem.PriceText` equal to null
- **THEN** the matching `OfferLine.offerPrice` is null.

#### Scenario: Offer text is copied from normalized offer item
- **WHEN** a current offer has `DailyOfferItem.Text`
- **THEN** the matching `OfferLine.offerText` is the same text value.

### Requirement: Recommendation links are plain app deep links
The system SHALL populate row links and `linkToUserWheel` with normal application deep links that rely on the existing Keycloak OIDC session flow.

#### Scenario: Restaurant row link is app link
- **WHEN** a recommendation row is built for a restaurant
- **THEN** `link` points to that restaurant's normal application page.

#### Scenario: Wheel link is app link
- **WHEN** recommendation content is built
- **THEN** `linkToUserWheel` points to the user's normal wheel page.

#### Scenario: Keycloak action tokens are not generated
- **WHEN** daily lunch recommendation links are built
- **THEN** the system does not call the Keycloak Admin API and does not generate action-token or magic-login links.

### Requirement: Daily recommendation trigger is configurable
The system SHALL invoke `DailyRecommendationNotificationService` from a hosted daily morning trigger whose run time and time zone are configurable.

#### Scenario: Default morning schedule is defined
- **WHEN** no daily recommendation schedule configuration is provided
- **THEN** the trigger uses 08:00 in the Europe/Tallinn time zone.

#### Scenario: Schedule can be configured
- **WHEN** daily recommendation schedule configuration provides a run time or time zone
- **THEN** the hosted trigger uses those configured values.

#### Scenario: Trigger invokes service once per scheduled occurrence
- **WHEN** the configured scheduled occurrence is reached
- **THEN** the hosted trigger creates an application scope and invokes the daily recommendation notification service once for that occurrence.

#### Scenario: Trigger time is not hardcoded in loop
- **WHEN** the hosted trigger computes its next run
- **THEN** it reads the run time and time zone from daily recommendation schedule options rather than inline constants in the hosted service loop.

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
