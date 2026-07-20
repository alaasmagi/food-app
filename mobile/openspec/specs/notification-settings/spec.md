# notification-settings Specification

## Purpose

Manage the user's daily-email notification preferences: the account API layer and React Query hooks (`getCurrentUser`, `updateNotificationPreferences`), the ported `Select` primitive, and the Settings screen (notifications switch, environment select with the "All environments" option and the empty-environments rule, save-with-toast, and log out).

## Requirements

### Requirement: AppUser type

The application SHALL provide `src/types/appUser.ts` with an `AppUser` interface matching the backend `AppUserDto`: `id`, `concurrencyToken`, `email`, `username`, `fullName`, `locale`, `sendNotifications`, and `notificationEnvironmentId: string | null`.

#### Scenario: Type mirrors the backend DTO

- **WHEN** an account payload is received from the backend
- **THEN** it is typed as `AppUser` with camelCase fields, including `sendNotifications` and a nullable `notificationEnvironmentId`

### Requirement: Notification preferences API

The application SHALL provide `src/api/account.ts` with `getCurrentUser()` calling `GET /api/v1/account/me` (returns the current `AppUser`) and `updateNotificationPreferences(sendNotifications, notificationEnvironmentId)` calling `PATCH /api/v1/account/notification-preferences` (returns the updated `AppUser`). Both SHALL go through the shared authenticated `apiFetch`, and non-ok responses SHALL be surfaced as errors rather than crashing.

#### Scenario: Read the current user

- **WHEN** `getCurrentUser()` is called
- **THEN** it issues a bearer-authorized `GET /api/v1/account/me` and resolves to the current `AppUser`, including `sendNotifications` and `notificationEnvironmentId`

#### Scenario: Update preferences

- **WHEN** `updateNotificationPreferences(sendNotifications, notificationEnvironmentId)` is called
- **THEN** it PATCHes `/api/v1/account/notification-preferences` with those fields and resolves to the updated `AppUser`

### Requirement: Account React Query hooks

The application SHALL provide `useCurrentUser()` wrapping `getCurrentUser()` in React Query, and `useUpdateNotificationPreferences()` wrapping the update. On success the mutation SHALL update the cached current user from the response so the Settings screen reflects the saved state without a manual refetch.

#### Scenario: Current user cached

- **WHEN** the current user is already cached
- **THEN** reading it again does not issue another request

#### Scenario: Save refreshes the cached user

- **WHEN** the update mutation succeeds
- **THEN** the cached current user is updated from the response

#### Scenario: Forbidden or failed response handled gracefully

- **WHEN** an account query or mutation fails
- **THEN** the failure is surfaced without an unhandled crash, leaving the screen usable

### Requirement: Ported Select primitive

The application SHALL port the `Select` design-system form component into `src/components/design-system/forms/Select.tsx`, re-expressed in React Native primitives with values from `src/theme/tokens.ts` and prop names matching `Select.d.ts` (`label`, `options`, `value`, `defaultValue`, `onChange(value)`, `placeholder`, `disabled`). It SHALL present the options in a dismissible native overlay and mark the current selection. No app source SHALL import from `alaasmagi-design-system/` at runtime.

#### Scenario: Select shows options and reports the chosen value

- **WHEN** the user opens the select and picks an option
- **THEN** the trigger shows that option's label and `onChange` is called with its value

#### Scenario: Disabled select does not open

- **WHEN** the select is disabled
- **THEN** it does not open an options overlay

#### Scenario: No runtime dependency on the design system folder

- **WHEN** the app is built
- **THEN** no module imports from `alaasmagi-design-system/`

### Requirement: Settings screen

The application SHALL replace the placeholder `app/(tabs)/settings.tsx` with a screen bound to the current user: a `Switch` for `sendNotifications`, a `Select` for `notificationEnvironmentId`, a "Save" `Button`, and the existing log-out action. On load it SHALL prefill from `useCurrentUser()`; on save it SHALL call `updateNotificationPreferences`, and confirm success with a Toast or surface a failure with a danger Toast leaving the form editable.

#### Scenario: Prefill from the current user

- **WHEN** the settings screen loads
- **THEN** the switch and select reflect the current user's `sendNotifications` and `notificationEnvironmentId`

#### Scenario: Save updates preferences and confirms

- **WHEN** the user changes the settings and saves
- **THEN** `updateNotificationPreferences` is called and a success toast is shown

#### Scenario: Save failure surfaced

- **WHEN** the update request fails
- **THEN** a danger toast is shown and the form remains editable

#### Scenario: Log out remains available

- **WHEN** the user activates log out
- **THEN** the session is ended, returning the app to the login flow

### Requirement: Environment select reflects only existing environments

The `notificationEnvironmentId` `Select` SHALL offer a fixed "All environments" option (representing null) plus one option per dining environment the user has, sourced from the already-cached `useEnvironments()` query. When the user has no environments, only "All environments" SHALL be available, so `notificationEnvironmentId` cannot be set to a non-existent environment. The select SHALL be disabled when `sendNotifications` is off.

#### Scenario: All environments plus one per environment

- **WHEN** the user has dining environments
- **THEN** the select offers "All environments" (null) followed by one option per environment

#### Scenario: No environments

- **WHEN** the user has no dining environments
- **THEN** the select offers only "All environments" and no other value can be chosen

#### Scenario: Disabled when notifications are off

- **WHEN** `sendNotifications` is off
- **THEN** the environment select is disabled

#### Scenario: Saved value maps null to and from "All environments"

- **WHEN** "All environments" is selected and saved
- **THEN** `updateNotificationPreferences` is called with `notificationEnvironmentId` equal to null
