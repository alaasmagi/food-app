## Why

Users need to opt into the daily lunch recommendation email and choose whether it covers one dining environment or all of them combined. This adds a settings view for the two preference fields (`sendNotifications`, `notificationEnvironmentId`) and the read/write path to back it.

## What Changes

- Port the `Select` primitive into `src/components/design-system/forms/Select.vue` (label, `options`, `placeholder`, `disabled`, `v-model`) - **it was assumed already ported but is not; it is included here.**
- Extend `src/api/account.ts`: `getCurrentUser()` calling `GET /api/v1/account/me` (returns the current `AppUserDto`), and `updateNotificationPreferences(sendNotifications, notificationEnvironmentId)` calling `PATCH /api/v1/account/notification-preferences` (returns the updated `AppUserDto`).
- Extend `src/stores/auth.ts`: a `fetchCurrentUser()` action that populates `currentUser` from `getCurrentUser()`, and a `setCurrentUser()` used to refresh it after a successful preferences update. `currentUser` already types `sendNotifications` and `notificationEnvironmentId` (matching `AppUserDto`), so no type change is needed.
- Add `src/views/SettingsView.vue` on a new guarded `/settings` route: a `Switch` for `sendNotifications`, and a `Select` for `notificationEnvironmentId` listing the user's dining environments plus a fixed "All environments" option (value = null), disabled when `sendNotifications` is off; a "Save" `Button` with `Toast` confirmation.
- Router: register the `/settings` route (behind the existing guard) and add a "Settings" nav entry in the app shell header.
- Client-side rule: if the user has no dining environments, the `Select` shows only "All environments" and `notificationEnvironmentId` cannot be set to anything else. The list only ever offers environments that actually exist, so the user cannot pick a non-existent one.

**Prerequisite (backend, cross-repo)**: this depends on a new backend endpoint `GET /api/v1/account/me` returning the current actor's `AppUserDto`. It does not exist yet - the backend has only `GET /account/token` and `PATCH /account/notification-preferences`. Adding `GET /account/me` is a companion change in the backend's own openspec project. Without it, `getCurrentUser()` cannot prefill the form's current values.

## Capabilities

### New Capabilities
- `notification-settings`: reading and updating the user's notification preferences (`sendNotifications`, `notificationEnvironmentId`) on a settings view, including the client-side "environment must exist" rule and toast-confirmed save.

### Modified Capabilities
- `design-system-foundation`: ADD the `Select` primitive.
- `frontend-auth`: MODIFY "Auth store holds session state in memory only" - `currentUser` is now populated via a `fetchCurrentUser()` action (from `GET /account/me`) and refreshed after a preferences update, rather than remaining null.
- `app-shell`: MODIFY "Minimal app shell layout" - the header nav gains a "Settings" link and a guarded `/settings` route is registered.

## Impact

- **New source areas**: `src/components/design-system/forms/Select.vue`, `src/views/SettingsView.vue`. `src/api/account.ts`, `src/stores/auth.ts`, the router, and the app-shell header are modified.
- **Backend contract**: `PATCH /api/v1/account/notification-preferences` (body `{ sendNotifications, notificationEnvironmentId }`, returns `AppUserDto`; self-scoped, no If-Match), and the new `GET /api/v1/account/me` (returns `AppUserDto`).
- **Reuses** the environments store (from `dining-environments`) to build the environment options; loads it on the settings view.
- **No new dependencies.**
- **Cross-repo dependency**: requires the backend `GET /account/me` endpoint (companion backend change).

## Out of Scope

- Any change to how the backend computes or sends the recommendation email itself. This change only lets the user set the two preference fields.
