## Why

The sidebar footer has a user row next to the "Log out" button, but it renders empty on every page except Settings: the shell reads `auth.currentUser`, which is only loaded by `SettingsView`. Users can't see who they are signed in as. The reference layout (user name on the left, log out icon on the right) asks for the user's first name there.

## What Changes

- The sidebar user row shows the signed-in user's first name to the left of the "Log out" button, on every shell-wrapped route.
- The first name is the first word of the current user's `fullName`, falling back to `username` when `fullName` is empty.
- The shell loads the current user when it is not loaded yet, so the name does not depend on visiting Settings first.
- The row no longer shows the email address.

Out of scope: the settings gear icon shown in the reference screenshot (Settings stays in the main navigation), the mobile app, and any backend change.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `app-shell`: adds a requirement for the sidebar user row to show the signed-in user's first name next to the log out button.

## Impact

- Affected code: `src/components/layout/AppShell.vue` (label source, loading the current user), a new pure helper for deriving the first name, and its unit tests.
- No API, dependency or env variable changes. Uses the existing `GET /api/v1/account/me` via `auth.fetchCurrentUser()`.
