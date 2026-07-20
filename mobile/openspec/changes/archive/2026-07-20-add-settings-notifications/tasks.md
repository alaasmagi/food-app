## 1. Port the Select primitive

- [x] 1.1 Port `Select` (forms) into `src/components/design-system/forms/Select.tsx`: a Pressable trigger + a `Modal` overlay list, props `label`/`options`/`value`/`defaultValue`/`onChange(value)`/`placeholder`/`disabled`, current option marked with the `check` Icon, disabled selects don't open, styled from tokens
- [x] 1.2 Add smoke tests: opens and reports the chosen value via `onChange`; shows the selected label; disabled does not open
- [x] 1.3 Verify no source imports from `alaasmagi-design-system/`

## 2. Types and API layer

- [x] 2.1 Add `src/types/appUser.ts` with `AppUser` matching `AppUserDto` (`id`, `concurrencyToken`, `email`, `username`, `fullName`, `locale`, `sendNotifications`, `notificationEnvironmentId: string | null`)
- [x] 2.2 Add `src/api/account.ts` with `getCurrentUser()` (`GET /api/v1/account/me`) and `updateNotificationPreferences(sendNotifications, notificationEnvironmentId)` (`PATCH /api/v1/account/notification-preferences`) through `apiFetch`, unwrapping errors
- [x] 2.3 Add an api-layer test mocking `apiFetch`: endpoints, GET vs PATCH, and the PATCH body

## 3. Account hooks

- [x] 3.1 Add `src/hooks/useCurrentUser.ts` (query) with a stable query key
- [x] 3.2 Add `src/hooks/useUpdateNotificationPreferences.ts`: a mutation that writes the returned `AppUser` into the current-user cache on success
- [x] 3.3 Add hook tests mocking the api layer: update writes the response into the cached current user

## 4. Settings screen

- [x] 4.1 Replace `app/(tabs)/settings.tsx` with the real screen: a `Switch` for `sendNotifications`, a `Select` for `notificationEnvironmentId` (fixed "All environments" = null sentinel plus one per `useEnvironments()` environment, disabled when notifications off), a "Save" `Button`, and the existing log-out action; prefill from `useCurrentUser()`
- [x] 4.2 Save maps the "All environments" sentinel back to null, calls `updateNotificationPreferences`, and shows a success Toast (danger Toast on failure, form stays editable)
- [x] 4.3 Add screen tests: prefills switch/select from the current user; save sends the local values (null for "All environments") and toasts success; failure toasts danger; empty environments offers only "All environments"; select disabled when notifications off; log out invokes the auth logout

## 5. Verify

- [x] 5.1 Run the test suite and TypeScript strict typecheck; fix failures
- [x] 5.2 Run `openspec validate add-settings-notifications` and confirm it passes
