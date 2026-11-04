## 1. Auth store

- [x] 1.1 Add a `firstName` computed to `src/stores/auth.ts` (first word of trimmed `currentUser.fullName`, else `currentUser.username`, else `''`) and export it from the store
- [x] 1.2 Add `firstName` unit tests to `src/stores/auth.test.ts`: no user, two-word full name, single-word full name, extra whitespace, empty full name falls back to username

## 2. App shell

- [x] 2.1 In `src/components/layout/AppShell.vue`, replace `userLabel` with `auth.firstName`, set the span `title` to the full name, and rename `.shell__user-email` to `.shell__user-name` (same declarations)
- [x] 2.2 In `AppShell.vue`, call `auth.fetchCurrentUser()` in `onMounted` only when `auth.currentUser` is null, catching a rejection so the row stays empty
- [x] 2.3 Add an `AppShell` component test: shows the first name next to "Log out", fetches the user once when missing, skips the fetch when already loaded, stays empty and keeps "Log out" working when the fetch rejects

## 3. Verify

- [x] 3.1 Run `npm run type-check` and `npm test`, both pass
- [x] 3.2 Check in the running app that the first name shows on Dashboard, Places and Wheel without visiting Settings first, in light and dark mode and in the opened mobile menu
