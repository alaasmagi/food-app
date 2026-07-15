## 0. Backend prerequisite (cross-repo)

- [x] 0.1 Confirm/implement the companion backend endpoint `GET /api/v1/account/me` returning the current actor's `AppUserDto` (its own openspec change in the backend project). The frontend degrades to safe defaults if it is absent, but prefill needs it.

## 1. Design-system primitive

- [x] 1.1 Port `Select` to `src/components/design-system/forms/Select.vue` from its `.d.ts` + `.prompt.md` + `.card.html` (+ `.jsx`): `label`, `options` (`{ value, label }[]`), `placeholder`, `disabled`, `v-model` (string); floating option list with a checkmark on the selected option, chevron rotate, open/hover/disabled as scoped CSS; close on select, Escape, and outside click; disabled prevents opening
- [x] 1.2 Add smoke tests: `Select` emits `update:modelValue` on choosing an option and closes; shows the placeholder when unmatched; disabled does not open

## 2. API and auth store

- [x] 2.1 Extend `src/api/account.ts`: `getCurrentUser()` -> `GET /api/v1/account/me` (returns `AppUser`) via the shared `apiFetch`; `updateNotificationPreferences(sendNotifications, notificationEnvironmentId)` -> `PATCH /api/v1/account/notification-preferences` (returns the updated `AppUser`)
- [x] 2.2 Extend `src/stores/auth.ts`: a `fetchCurrentUser()` action populating `currentUser` from `getCurrentUser()`, and a `setCurrentUser(user)` used to refresh it after a preferences update (both in-memory only)

## 3. Settings view and routing

- [x] 3.1 Add `src/views/SettingsView.vue` on `/settings`: load the current user and the environments on mount; a `Switch` bound to a local `sendNotifications`; a `Select` bound to `notificationEnvironmentId` with options `[All environments (null), ...environments]`, disabled when the switch is off; map `null <-> "__all__"` sentinel at the Select boundary; fall back to "All environments" when the prefilled id matches no environment; a "Save" `Button` calling `updateNotificationPreferences`, refreshing the auth store via `setCurrentUser`, and showing a success/danger toast; sentence-case copy, no exclamation points/em-dashes/emoji
- [x] 3.2 Register the guarded `/settings` route in `src/router/index.ts` and add a "Settings" `RouterLink` to the shell header in `src/components/layout/AppShell.vue`

## 4. Tests

- [x] 4.1 Add API/store tests: `getCurrentUser` GETs `/account/me`; `updateNotificationPreferences` PATCHes `/account/notification-preferences` with the two fields; the auth store's `fetchCurrentUser`/`setCurrentUser` populate `currentUser`
- [x] 4.2 Add view tests: `SettingsView` prefills from the current user; the environment select is disabled when notifications are off; with no environments only "All environments" is offered; saving calls `updateNotificationPreferences` (sentinel mapped back to null) and shows a success toast

## 5. Verification

- [x] 5.1 Run `vue-tsc`/`vite build` and the Vitest suite; confirm type-check, build, and all tests pass
- [x] 5.2 Grep `src/` for any import/`@import`/relative path into `alaasmagi-design-system/` and confirm there are none
