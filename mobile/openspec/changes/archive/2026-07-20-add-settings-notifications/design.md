## Context

Settings is the final screen in the web-parity sequence. The backend exposes `GET /api/v1/account/me` (returns the current `AppUser`) and `PATCH /api/v1/account/notification-preferences` (`{ sendNotifications, notificationEnvironmentId }` → updated `AppUser`), both scoped to the authenticated identity — the web frontend already consumes them. The mobile app already has `apiFetch`, React Query, a `ToastProvider`/`useToast()`, ported `Switch`/`Button`, a `useEnvironments()` query, and a working log-out action (`useAuth().logout`) on the current placeholder Settings screen. This change adds the account data layer, ports `Select`, and turns the placeholder into the real screen.

## Goals / Non-Goals

**Goals:**
- Read and update the two notification-preference fields, with server state in React Query.
- An environment `Select` that can only ever hold "All environments" or a real environment id.
- Reuse the already-cached environments; no extra fetch for the select.
- Keep the existing log-out action on the screen.

**Non-Goals:**
- Any change to how the backend computes or sends the email.
- Editing locale, email, username, or other profile fields.
- Push notifications or a native notification-permission flow.

## Decisions

### Account state in React Query; mutation writes back the cache
`useCurrentUser()` caches `GET /account/me`. `useUpdateNotificationPreferences()` PATCHes and, on success, writes the returned `AppUser` straight into the current-user cache via `setQueryData` (rather than invalidating + refetching) since the response is the full updated user — the screen reflects the saved state immediately. The PATCH carries no `If-Match`: the backend resolves the target user from the bearer identity and takes the two fields as-is, matching the controller.

### Null environment modeled with a sentinel string in the Select
`Select` (ported from a component whose values are strings) needs a string value, but `notificationEnvironmentId` is `string | null`. The screen maps null ↔ a reserved sentinel (`'__all__'`, the same pattern `EnvironmentTabs` used) so "All environments" is a normal option; on save it converts the sentinel back to `null`. Options are `[{ value: ALL, label: 'All environments' }, ...environments.map(e => ({ value: e.id, label: e.name }))]`. With no environments, only the "All environments" option exists, so an invalid id can't be chosen — satisfying the empty-environments rule structurally.

### Select as a Pressable trigger + Modal overlay
The web `Select` is a button that toggles an absolutely-positioned dropdown. On React Native there is no absolute page overlay that escapes parent clipping, so the port uses a `Modal` (like the ported `Dialog`) with a backdrop that dismisses on outside press and a list of option rows, the current one marked with a `check` Icon. Disabled selects don't open. This keeps options tappable above everything without z-index fighting.

### Guarding the environment select
The select is disabled when `sendNotifications` is off (a prop on the ported `Select`). Local screen state holds `sendNotifications` and the selected environment value; both seed from `useCurrentUser()` once loaded and on subsequent user-cache changes. Save sends the local state.

## Risks / Trade-offs

- [Selected environment was deleted since the user last saved] → The select only lists current environments plus "All"; if the saved `notificationEnvironmentId` no longer matches an option, the screen falls back to showing "All environments" (the backend also nulls a notification scope when its environment is deleted, per the dining-environment spec), so the UI never shows a dangling id.
- [Save failure] → Surface a danger toast and leave the form editable (no optimistic write); the cached user is only updated on success.
- [Stale current-user cache after external change] → Acceptable; the screen is self-contained and writes back the authoritative response on each save. `useCurrentUser` can still refetch on mount per React Query defaults.
- [Toggling notifications off then saving] → The environment value is retained in local state but the select is disabled; the saved `notificationEnvironmentId` is whatever is currently selected (mapped from the sentinel), matching the web behavior.

## Migration Plan

Additive apart from replacing the Settings placeholder. New files plus the `app/(tabs)/settings.tsx` rewrite (keeping the log-out action). Rollback restores the placeholder and removes the new files. No new dependency, no backend or config change, no flag.

## Open Questions

- Whether to show read-only profile info (email/username) alongside the toggles — omitted for now to stay in scope; easy to add later without affecting the API or the preference controls.
