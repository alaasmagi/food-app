## Context

`AppShell.vue` already has the footer layout the reference asks for: `.shell__user` is a flex row with a truncating text span on the left and the 44px "Log out" icon button on the right. The span is bound to `userLabel = currentUser?.email ?? currentUser?.username`, but `auth.currentUser` is only populated by `SettingsView` (`auth.fetchCurrentUser()` on mount), so the row is empty everywhere else. `AppUser` (from `GET /api/v1/account/me`) has `fullName` and `username`; there is no separate first name field.

The design system (`/Users/alaasmagi/Projects/design-system`) has no sidebar shell or user row component. The existing shell styling and the reference screenshot supplied with the request are the visual source.

## Goals / Non-Goals

**Goals:**
- Show the first name in the existing user row on every shell-wrapped route.
- Load the current user from the shell when it is missing.

**Non-Goals:**
- The settings gear icon from the reference screenshot.
- New styles, tokens or design-system components. The existing `.shell__user-email` styling (14px, secondary text, ellipsis) is kept.
- Backend changes (no first name field on `AppUserDto`).
- The mobile app.

## Decisions

- **Derive the first name in the auth store.** Add a `firstName` computed to `stores/auth.ts`: the first word of `currentUser.fullName.trim()`, else `currentUser.username`, else `''`. It sits next to the existing `currentUser` state, is unit-testable in `auth.test.ts`, and needs no new file. Alternative: read `given_name` from the Keycloak token. Rejected because it depends on the realm's client scope mappers, which the app does not control, while `AppUser` is already the store's source for user data.
- **Shell loads the user on mount when missing.** `AppShell` calls `auth.fetchCurrentUser()` in `onMounted` only if `auth.currentUser` is null. The shell mounts once per session, so this is one extra `/account/me` call. The Settings view keeps its own refetch, which refreshes the data after preference changes.
- **Failure leaves the row empty.** A failed load is non-critical for the shell. The rejection is caught in the shell and the row stays empty, matching how `SettingsView` already handles the same call with `Promise.allSettled`. The frontend has no error-reporting integration, so nothing is reported.
- **Rename the class.** `.shell__user-email` becomes `.shell__user-name` since it no longer shows an email. Same declarations.

## Risks / Trade-offs

- [Multi-word first names ("Mari Liis Example") show only "Mari"] → Accepted. `fullName` has no first/last split; the `title` attribute still shows the full name on hover.
- [Name appears after a short delay on first load] → Accepted. The row is empty until `/account/me` resolves; no loading state is designed for it.

## Open Questions

- None blocking. If a proper first name is wanted later, add `firstName` to `AppUserDto` in a backend change.
