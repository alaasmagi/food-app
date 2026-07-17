## Context

Wheels already carry `isPublic` and are managed under the `user-wheel` capability: `WheelView.vue` lists wheels as cards, `WheelEditorDialog.vue` edits them with a `Switch` bound to a local `isPublic` ref, and `WheelSpinner.vue` renders a wheel from just `names: string[]`. The router (`src/router/index.ts`) is eager-imported and guards every route except those with `meta.public` (only `/login` today); `App.vue` also uses `meta.public` to render a route without the authenticated `AppShell`, and `ToastHost` is always mounted. The shared fetch wrapper `apiFetch` (`src/api/client.ts`) attaches a bearer token and retries once on 401; `account.ts#fetchToken` is the existing precedent for a request that deliberately bypasses it with a raw `fetch`. Toasts are a Pinia store (`useToastsStore().push({ title, description?, tone })`). There is no clipboard helper and no `composables/` directory yet. The `Icon` component's `IconName` union has no link/share/copy glyph.

## Goals / Non-Goals

**Goals:**
- A logged-out visitor can open `/w/:id` and see the wheel's name and a working spinner.
- Public wheel data loads without any auth (no bearer, no token refresh), and a missing/removed wheel shows a friendly not-found message.
- Users can copy a share link for a public wheel both from the editor dialog and from the wheel list, without reopening the editor.

**Non-Goals:**
- Social share buttons, link previews / OG meta tags, and analytics on share views (explicitly out of scope).
- Any backend or DTO change; server-side rendering.
- Making non-public wheels shareable, or exposing `isPublic`/`concurrencyToken` in the public DTO.

## Decisions

### Public API bypasses `apiFetch`, mirroring `fetchToken`
`src/api/publicWheels.ts#getPublicWheel(id)` calls raw `fetch(\`${API_BASE_URL}/api/v1/public/wheels/${id}\`)` with no `Authorization` header and no 401 retry, because the caller may be unauthenticated and a bearer/refresh cycle would be wrong on a public page. It returns a `PublicWheel` (`{ id, name, restaurantNames }`) on 200. A 404 is reported distinctly (return `null`) so the view can show its specific not-found copy; other non-ok statuses throw. This matches the existing raw-`fetch` precedent rather than inventing a new pattern. Alternative considered: add a "skip auth" flag to `apiFetch` — rejected as it complicates the shared wrapper for one caller and risks leaking the bearer to a public endpoint.

### `PublicWheel` is a distinct, minimal type
A new `PublicWheel` interface (`id`, `name`, `restaurantNames`) lives alongside `UserWheel` in `src/types/wheel.ts`. It intentionally omits `concurrencyToken` and `isPublic`: the public endpoint should expose only what the view needs, and the type documents that. `WheelSpinner` needs only `restaurantNames`, so this is sufficient to render.

### Public route via `meta.public`, reusing the existing mechanism
The route is `{ path: '/w/:id', name: 'shared-wheel', component: SharedWheelView, meta: { public: true } }`. The proposal describes "a list of routes excluded from the guard", but the codebase's actual mechanism is the `meta.public` flag read by `authGuard`; using it means the guard skips auth and `App.vue` renders the view chrome-free for free, with `ToastHost` still available for the copy toast. No guard code changes are needed beyond the new route.

### One share-link composable, used in three places
`src/composables/useShareWheelLink.ts` exposes `copyShareLink(wheelId)` that builds `\`${window.location.origin}/w/${wheelId}\``, calls `navigator.clipboard.writeText`, and on success pushes a `{ title: 'Link copied', tone: 'success' }` toast; on failure pushes a danger toast. Using `window.location.origin` yields the correct deployed origin (app.<domain> in prod, localhost in dev) without hardcoding a domain. The editor dialog and the wheel card both call this, satisfying the "reuse logic across 2+ components" rule. Building the URL is also unit-testable in isolation.

### Share affordances are gated on public + saved
In `WheelEditorDialog`, the "Copy share link" button renders only when `props.wheel?.id` exists and the current `isPublic` is true — a new unsaved wheel has no id, so the link would be meaningless until saved (the card action covers the post-save case). In `WheelView`, the share action renders per card only when `wheel.isPublic`. Both call `copyShareLink(wheel.id)`.

### Add a `link` icon to `Icon.vue`
The share affordances need an icon and none fits. Add a `link` entry to the `IconName` union and `PATHS` map in `Icon.vue`, porting the glyph from the design system's Icon source (a standard 24x24 stroke link icon) to stay consistent with the ported icon set. The editor uses it as `<Button icon="link">Copy share link</Button>`; the card uses an icon-only `<Button icon="link" variant="ghost" size="sm" aria-label="Copy share link" />`.

## Risks / Trade-offs

- [`navigator.clipboard` is unavailable in insecure contexts or older browsers, and rejects] → the composable catches the failure and shows a danger toast ("Could not copy link") instead of throwing; the deployed app is HTTPS so the happy path holds. Tests stub `navigator.clipboard.writeText`.
- [A public wheel could be un-published between share and open] → `getPublicWheel` treating 404 as a first-class not-found state means the visitor sees "This wheel isn't available", not a crash or a login redirect.
- [The public route must never trip the auth guard] → covered by `meta.public` and asserted with a guard test mirroring the existing `/login` public-route test, so a regression that drops the flag is caught.
- [Icon added here is not (yet) in the app's ported set] → port from the design system's own Icon source rather than inventing a path, keeping the visual set authoritative.

## Open Questions

- None blocking. The public endpoint shape is assumed to be `{ id, name, restaurantNames }`; if the backend returns more or different casing, the `PublicWheel` type is the single place to adjust.
