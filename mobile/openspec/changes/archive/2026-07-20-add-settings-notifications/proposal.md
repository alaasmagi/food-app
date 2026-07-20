## Why

Users want to control the daily recommendation email from the app: whether they receive it at all, and whether it covers one of their dining environments or all restaurants. The web frontend already ships this against the same backend; this brings the Settings screen to mobile.

## What Changes

- Add `src/types/appUser.ts` with an `AppUser` type matching `AppUserDto` (`id`, `concurrencyToken`, `email`, `username`, `fullName`, `locale`, `sendNotifications`, `notificationEnvironmentId: string | null`).
- Add `src/api/account.ts` with `getCurrentUser()` (`GET /api/v1/account/me`) and `updateNotificationPreferences(sendNotifications, notificationEnvironmentId)` (`PATCH /api/v1/account/notification-preferences`), both through the shared `apiFetch`. The update is a PATCH scoped to the authenticated identity — no `If-Match`.
- Add React Query hooks: `useCurrentUser()` (query) and `useUpdateNotificationPreferences()` (mutation that updates the cached current user from the response).
- Port the `Select` design-system form component. `Switch` is already ported (from the wheel change) and reused.
- Replace the placeholder `app/(tabs)/settings.tsx` with the real screen: a `Switch` bound to `sendNotifications`, a `Select` bound to `notificationEnvironmentId` offering a fixed "All environments" (null) option plus one per dining environment (disabled when notifications are off), a "Save" `Button` that persists via the mutation and confirms with a Toast (danger Toast on failure), and the existing log-out action.
- When the user has no dining environments, the `Select` offers only "All environments", so `notificationEnvironmentId` can never point at a non-existent environment.

Out of scope: any change to how the backend computes or sends the email; locale/profile editing; push notifications.

## Capabilities

### New Capabilities

- `notification-settings`: the user's daily-email notification preferences — the account API layer and React Query hooks (`getCurrentUser`, `updateNotificationPreferences`), the ported `Select` primitive, and the Settings screen (notifications switch, environment select with the "All environments" option and empty-environments rule, save-with-toast, and log out).

### Modified Capabilities

- None. The Settings screen is introduced as new requirements within the `notification-settings` capability (as favourites and wheel introduced their screens), and the existing log-out action is retained, so no existing capability's requirements change.

## Impact

- New files: `src/types/appUser.ts`, `src/api/account.ts`, account React Query hooks under `src/hooks/`, and the ported `Select` under `src/components/design-system/forms/`.
- Modified files: `app/(tabs)/settings.tsx` (placeholder → real screen, keeping log out).
- Backend: none. Consumes the existing `/api/v1/account/me` and `/api/v1/account/notification-preferences` endpoints. No new dependencies.
- Environments come from the already-cached `useEnvironments()` query; no extra fetch is introduced for the select.
