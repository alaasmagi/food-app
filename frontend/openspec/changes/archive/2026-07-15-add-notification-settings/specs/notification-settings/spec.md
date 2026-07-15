## ADDED Requirements

### Requirement: Notification preferences API

The application SHALL extend `src/api/account.ts` with `getCurrentUser()` calling `GET /api/v1/account/me` (returns the current `AppUser`) and `updateNotificationPreferences(sendNotifications, notificationEnvironmentId)` calling `PATCH /api/v1/account/notification-preferences` (returns the updated `AppUser`). Both SHALL go through the shared bearer fetch wrapper.

#### Scenario: Read the current user

- **WHEN** `getCurrentUser()` is called
- **THEN** it issues a bearer-authorized `GET /api/v1/account/me` and resolves to the current `AppUser`, including `sendNotifications` and `notificationEnvironmentId`

#### Scenario: Update preferences

- **WHEN** `updateNotificationPreferences(sendNotifications, notificationEnvironmentId)` is called
- **THEN** it PATCHes `/api/v1/account/notification-preferences` with those fields and resolves to the updated `AppUser`

### Requirement: Settings view

The application SHALL provide `src/views/SettingsView.vue` on a guarded `/settings` route with a `Switch` bound to `sendNotifications` and a `Select` bound to `notificationEnvironmentId`, plus a "Save" `Button`. On load it SHALL prefill from the current user; on save it SHALL call `updateNotificationPreferences`, refresh the auth store's `currentUser` from the response, and show a success toast (a danger toast on failure). All copy SHALL follow the design system content rules.

#### Scenario: Prefill from the current user

- **WHEN** the settings view loads
- **THEN** the switch and select reflect the current user's `sendNotifications` and `notificationEnvironmentId`

#### Scenario: Save updates preferences and confirms

- **WHEN** the user changes the settings and saves
- **THEN** `updateNotificationPreferences` is called, the auth store's `currentUser` is refreshed from the response, and a success toast is shown

#### Scenario: Save failure surfaced

- **WHEN** the update request fails
- **THEN** a danger toast is shown and the form remains editable

### Requirement: Environment select reflects only existing environments

The `notificationEnvironmentId` `Select` SHALL offer a fixed "All environments" option (value null) plus one option per dining environment the user has. When the user has no environments, only "All environments" SHALL be available, so `notificationEnvironmentId` cannot be set to a non-existent environment. The select SHALL be disabled when `sendNotifications` is off.

#### Scenario: All environments plus one per environment

- **WHEN** the user has dining environments
- **THEN** the select offers "All environments" (null) followed by one option per environment

#### Scenario: No environments

- **WHEN** the user has no dining environments
- **THEN** the select offers only "All environments" and no other value can be chosen

#### Scenario: Disabled when notifications are off

- **WHEN** `sendNotifications` is off
- **THEN** the environment select is disabled
