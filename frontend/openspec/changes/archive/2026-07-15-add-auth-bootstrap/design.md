## Context

This is the first change in a greenfield Vue 3 SPA that currently holds only Vite starter scaffolding (`App.vue`, `HelloWorld.vue`, `style.css`). The frontend consumes an existing ASP.NET Core backend and never talks to Keycloak directly: authentication is fully brokered by the backend through a transient cookie that is exchanged for a bearer token. Every later feature depends on that token being available, so this change establishes the auth flow plus the minimum app shell and the first two design-system primitives needed to render it.

The design system lives at `alaasmagi-design-system/` (resolved on this machine to `/Users/alaasmagi/Projects/alaasmagi-design-system`, one directory above the frontend). It is a framework-agnostic token + React-reference system, not a Vue library, and is a temporary authoring reference that will be deleted. Nothing under `src/` may reference it at build or runtime; every token and component must be physically copied into `src/`.

## Goals / Non-Goals

**Goals:**
- Prove the backend-brokered auth flow end to end: silent token bootstrap, bearer-attaching fetch wrapper, 401 silent refresh, and full-page login/logout.
- Stand up Vue Router, Pinia, and a minimal dark-theme shell with a login view and a placeholder dashboard behind a guard.
- Port `Icon` and `Button` into `src/` from their `.d.ts` + `.prompt.md` + `.card.html` (+ `.jsx` for structure only), and copy the token CSS verbatim. Set the lazy-porting pattern for later changes.

**Non-Goals:**
- Any feature content: restaurant browsing, offers, environments, favourites, the wheel.
- Porting any other design-system component (Input, Card, Toast, etc.) or the full `IMethodResponse<T>` toast-error UX (the wrapper handles 401 refresh now; richer error surfacing arrives with the first feature that needs Toast).
- Light-mode toggle, token persistence, proactive pre-expiry refresh scheduling.
- Admin-only route gating (the `hasRole` helper exists but no admin route is added yet).

## Decisions

**Token in memory only, re-established on startup.** The auth store keeps the token in a plain reactive value, never in web storage. On app startup and whenever the store is empty at a guard, `fetchToken()` re-establishes it from the still-valid backend cookie. Rationale: matches the project's auth rules and avoids token theft from storage; the cost (a token exchange on every hard reload) is acceptable and invisible to the user.

**Silent 401 refresh lives in the shared wrapper, not in each caller.** `src/api/client.ts` owns the single-retry-on-401 logic so no feature module re-implements it. The token-exchange call in `account.ts` deliberately bypasses the wrapper (it uses `credentials: "include"` and must not recurse into the refresh path). Rationale: one uniform place to reason about auth failures; prevents infinite refresh loops.

**Backend base URL / parent domain comes from a Vite env var.** Login, logout, and token URLs are built from a configured base (e.g. `VITE_API_BASE_URL` -> `https://api.<domain>`). Rationale: the frontend and backend deploy separately under the same parent domain; hardcoding the host would break across environments. `import.meta.env` is the standard Vite mechanism.

**Design-system porting: copy, don't reference; CSS states, not JS.** `Icon.vue` and `Button.vue` are authored from the four source files, keeping every `var(--token-name)` intact and re-implementing `:hover`/`:active`/`:focus-visible` in `<style scoped>`. React `children` becomes `<slot />`, `onClick` becomes native `@click`. Rationale: enforces the config's hard rule that `src/` never depends on `alaasmagi-design-system/`, and keeps the visual result pixel-matched while shedding React idioms.

**Alternatives considered:**
- *Persisting the token in sessionStorage for reload survival* — rejected: violates the auth rules and adds an XSS exfiltration surface; the silent re-fetch achieves the same UX.
- *An Axios instance with interceptors instead of a fetch wrapper* — rejected: adds a dependency for behavior a thin `fetch` wrapper covers; the only cross-cutting concerns are the bearer header and the 401 retry.
- *A Vue Router route guard that redirects to an in-app `/login` for everything* — the login view exists, but the guard performs a full-page navigation to the backend login flow (not an SPA route) because auth is backend-brokered; the in-app `LoginView` is the fallback surface shown when unauthenticated, whose button initiates that same full-page navigation.

## Risks / Trade-offs

- **Icon size default mismatch** → `Icon.d.ts` documents a default `size` of 16, while the project context mandates a "24x24 stroke-icon rendering approach". Mitigation: preserve the `IconName` union and 24x24 viewBox/stroke rendering exactly as the config requires, and treat the rendered pixel `size` prop default as a porting detail to confirm against `icons.card.html` during apply; do not let the `.d.ts` 16 silently override the 24x24 mandate.
- **Guard + async token fetch races** → the guard awaits `fetchToken()` before deciding, so concurrent navigations could trigger overlapping exchanges. Mitigation: have `fetchToken()` de-duplicate in-flight requests (share a single pending promise) so parallel guards and the 401 retry path collapse to one network call.
- **Full-page logout loses SPA state** → intentional; logout is a hard navigation and the in-memory token is cleared first so a leaked token cannot outlive the redirect.
- **Design system folder path** → config says "at the frontend project root" but it actually resolves one level up (`/Users/alaasmagi/Projects/alaasmagi-design-system`). Mitigation: tasks reference the resolved absolute path for the copy step; since files are copied into `src/`, the source location does not affect the built app.
- **Env var missing in a deploy** → if `VITE_API_BASE_URL` is unset, login/token URLs are malformed. Mitigation: read it once in a small config module and fail loud in dev if absent.

## Migration Plan

Additive only; no existing behavior to preserve. Steps: add `pinia` + `vue-router` deps; copy token CSS into `src/assets/tokens/` and import once in `main.ts`; port `Icon` and `Button`; add the store, api layer, router + guard, views, and shell; replace the starter `App.vue`/`HelloWorld.vue`/`style.css`. Rollback is reverting the change (the starter scaffolding is recreatable from Vite defaults).

## Open Questions

- App name string for the header — placeholder until product naming is confirmed; does not block the flow.
- Exact backend `AppUser`/token DTO field names (`accessToken`, `expiresAtUtc`, role claim shape) — confirm against the backend Web DTOs during apply so `src/types/` matches 1:1.
- Whether proactive pre-expiry refresh (using `expiresAtUtc`) is wanted now or deferred — current scope only refreshes reactively on 401.
