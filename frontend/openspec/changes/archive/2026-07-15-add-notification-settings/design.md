## Context

Users can opt into a daily lunch recommendation email and choose whether it covers one dining environment or all combined. The backend stores these as two `AppUser` fields, `sendNotifications` and `notificationEnvironmentId`, and exposes `PATCH /api/v1/account/notification-preferences` (self-scoped, returns the updated `AppUserDto`). Prior changes established the bearer wrapper, the auth store (with `currentUser` typed but never populated), the environments store, and the ported primitives; `Select` is not yet ported.

The frontend `AppUser` type already includes `sendNotifications` and `notificationEnvironmentId` (added in the auth bootstrap, matching `AppUserDto`), so no type change is needed - only a read path and the settings UI.

## Goals / Non-Goals

**Goals:**
- Port `Select`.
- Add `getCurrentUser()` + `updateNotificationPreferences()` to the account API, and `fetchCurrentUser()`/`setCurrentUser()` to the auth store.
- Build `SettingsView` (switch + environment select + save + toast) on a guarded `/settings` route, with the "environment must exist" rule.
- Add a Settings nav entry.

**Non-Goals:**
- Any change to how the backend computes or sends the email.
- Editing other `AppUser` fields (email, username, locale) - only the two preference fields.
- Persisting `currentUser` across reloads (it is re-fetched, consistent with the in-memory token design).

## Decisions

**A backend `GET /api/v1/account/me` is a hard prerequisite (cross-repo).** There is no endpoint to read the current actor's `AppUser`: `AccountController` has only `GET token` and `PATCH notification-preferences`, and `AppUsersController` GET is not self-scoped (the frontend does not know its own AppUser id; the actor is resolved server-side from the token). Prefilling the form therefore requires a self endpoint. Decision (confirmed with the user): add `GET /api/v1/account/me` returning the current `AppUserDto`, implemented as a companion change in the backend openspec project. The frontend `getCurrentUser()` targets it. Rationale: the settings form must show the user's actual saved values, which is impossible without a read path.

**`notificationEnvironmentId` null is represented by a sentinel in the Select.** The Select's value type is `string`; "All environments" means `null`. The view maps `null <-> "__all__"` (a sentinel) at the Select boundary and converts back to `null` on save. Rationale: keeps the ported Select generic (string values) while modeling the nullable field cleanly.

**Options come only from existing environments, enforcing the "must exist" rule structurally.** The Select options are `[{ value: ALL, label: "All environments" }, ...environments.map(e => ({ value: e.id, label: e.name }))]`. With no environments, only "All environments" is offered, so a non-existent environment cannot be picked. If a prefilled `notificationEnvironmentId` no longer matches any environment (stale), the view falls back to "All environments". Rationale: the rule is guaranteed by construction, not by extra validation.

**The environment select is disabled when notifications are off.** `sendNotifications` gates the select via its `disabled` prop; a disabled off-state select does not change the pending value. Rationale: the environment choice is meaningless when notifications are off, matching the request.

**Save refreshes `currentUser` from the PATCH response.** `updateNotificationPreferences` returns the updated `AppUserDto`; the view passes it to the auth store's `setCurrentUser()` so the store stays the source of truth and any other view reading `currentUser` updates too. Rationale: single source of truth; avoids a second round trip.

**Alternatives considered:**
- *Frontend-only with no read endpoint* (form starts from defaults) - rejected by the user: it cannot show already-saved values, which is misleading.
- *Deriving the AppUser id from the JWT and calling `GET /app-users/{id}`* - rejected: the JWT subject is the Keycloak identity, not guaranteed to equal `AppUser.Id`, and `GET /app-users/{id}` is not self-scoped/authorization-safe for this use.
- *A native `<select>` instead of porting the design-system Select* - rejected: breaks the dark-theme token styling and the design-system consistency rule.

## Risks / Trade-offs

- **Backend `GET /account/me` not yet deployed** -> `getCurrentUser()` 404s and the form cannot prefill. Mitigation: implement the companion backend change first; in the frontend, handle a failed read by falling back to safe defaults (notifications off, All environments) and a non-blocking error, so the page still renders.
- **Stale `notificationEnvironmentId`** (points to a deleted environment) -> no matching option. Mitigation: fall back to "All environments" in the prefill mapping.
- **PATCH concurrency** -> the endpoint is self-scoped with no If-Match; last-write-wins is acceptable for a single user's own preferences. No mitigation needed beyond surfacing errors.
- **Select open/close outside-click** -> a floating list needs to close on outside click and Escape. Mitigation: close on selection, on Escape, and on an outside-click listener while open; keep it keyboard-operable.

## Migration Plan

Additive on the frontend: no existing behavior changes except the shell header (gains a Settings link) and the router (gains `/settings`). Port `Select`; extend `api/account.ts` and `stores/auth.ts`; add `SettingsView.vue`; register the route and nav. The backend companion change (`GET /account/me`) must land for prefill to work; the frontend degrades gracefully without it. Rollback is reverting the frontend change.

## Open Questions

- Exact shape/casing of the `GET /account/me` response - assumed identical to `AppUserDto` (camelCase over the wire); confirm when the backend endpoint is implemented.
- Whether saving should also re-fetch environments (in case names changed) - not needed; the environments store is already loaded on the settings view.
- Whether an unsaved-changes guard is wanted when navigating away - out of scope for now.
