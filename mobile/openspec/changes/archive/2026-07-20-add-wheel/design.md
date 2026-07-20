## Context

The wheel is the last feature in the web-parity sequence. The backend already exposes `/api/v1/user-wheels` (authenticated CRUD) and `/api/v1/public/wheels/{id}` (public read), and the web frontend consumes both, so the contract is fixed: `UserWheel { id, concurrencyToken, name, restaurantNames: string[], isPublic }`, and a deliberately minimal `PublicUserWheelDto { name, restaurantNames }` that carries no id, token, or isPublic. The critical backend rule is that a wheel stores a **frozen snapshot of restaurant NAME strings**, not ids — so a wheel keeps working even if the catalog changes.

The app already has `apiFetch` (authenticated) and `publicFetch` (unauthenticated, no refresh) in `src/api/client.ts`, React Query wiring, a `ToastProvider`/`useToast()`, and ported `Input`/`Dialog`/`Button`/`Toast`. This change adds the `Switch` and `Checkbox` primitives, the wheels data layer, the editor and spinner, the Wheel tab, and a public deep-link route.

## Goals / Non-Goals

**Goals:**
- Full authenticated wheel CRUD with `If-Match` concurrency, server state in React Query.
- A native, token-styled spinning wheel that picks a name client-side.
- Public sharing: a copyable link and a logged-out-accessible `/w/[id]` route via the unauthenticated path.
- Build `restaurantNames` from the already-cached catalog (no extra fetch), frozen as names.

**Non-Goals:**
- Native share sheets, OG/link previews (out of scope).
- Settings and the earlier features (already shipped).
- Fully provisioning universal-link association for `app.<domain>` (a deployment/domain-ownership step, documented as a prerequisite).

## Decisions

### Public reads go through `publicFetch`, 404 → null
`getPublicWheel(id)` uses the existing unauthenticated `publicFetch` (no bearer, no 401 refresh) so a logged-out visitor can load a shared wheel. It returns `null` on 404 so the shared route can render a friendly "not available" state, and rejects on other non-ok statuses. `PublicWheel` is `{ name, restaurantNames }`, matching the DTO exactly (the web type's extra `id` is redundant since the id is known from the route).

### Auth-gate exemption for `/w/[id]`
The gate in `app/_layout.tsx` currently redirects any unauthenticated user outside `(auth)` to login. The public route adds a third case: `segments[0] === 'w'` is a public route the gate must skip (no redirect, no token fetch). This is the one behavioral change to `app-shell`. Expo Router's file-based routing means `app/w/[id].tsx` also serves the `foodroulette://w/<id>` deep link automatically; the `app.<domain>/w/<id>` universal link additionally needs associated-domains / intent-filter config at deploy time — documented, not coded here.

### Wheel state in React Query; editor composes from the cached catalog
`useWheels()` caches the list; create/update/delete mutations invalidate it. The editor's checkbox list is built from the already-cached `useRestaurants()` data (no new fetch) and filtered client-side by the search box; checking restaurants collects their `name` values into `restaurantNames`. This keeps the frozen-names rule and the "no extra fetch" rule.

### WheelSpinner: rotate an Animated SVG layer, static pointer/hub on top
Mirroring the web spinner's geometry (segments via SVG `Path` arcs, one per name, token-cycled palette), but native: the rotor (segments `G`) lives in an `Animated`-driven rotating layer, while the pointer and hub are static overlays so they don't spin — the same Animated-rotation pattern the ported `Icon` spinner already uses. `spin()` picks `Math.floor(Math.random() * n)` locally, animates a multi-turn rotation landing that segment under the top pointer via `Animated.timing` with an ease-out curve, and on completion reports the name. `Math.random()` is fine here (app runtime, not a workflow script). Spinning requires ≥ 2 names.

### Copy-share-link as a hook using expo-clipboard
`useShareWheelLink()` returns `copyShareLink(wheelId)` that builds `${config.webAppBaseUrl}/w/${wheelId}`, writes it with `expo-clipboard`'s `setStringAsync`, and toasts success — or a danger toast on failure, never throwing. The web version used `window.location.origin`; mobile has no origin, so the base is a new `webAppBaseUrl` config value (default `https://app.alaasmagi.dev`, overridable via `app.json` extra). Reused by both the editor dialog and the Wheel tab cards.

### Switch and Checkbox ports
`Switch` is a `Pressable` row with a track `View` and a thumb `View` positioned by `checked`; `Checkbox` is a `Pressable` box that renders the ported `Icon` `check` when checked. Both take `checked`/`defaultChecked`/`onChange(checked)`/`disabled`/`label`, matching their `.d.ts`.

## Risks / Trade-offs

- [Stale token on update/delete → 409] → Surface via a toast and let the invalidated wheels query refetch the current token; no custom conflict resolution.
- [Universal link not wired at deploy] → The `foodroulette://` scheme works immediately via the route file; the `app.<domain>` link degrades to "open in browser" until associated-domains config lands. Documented as a prerequisite so it is not mistaken for a code bug.
- [Animated rotation vs `useNativeDriver`] → Rotating a transform can use the native driver; SVG group rotation may need `useNativeDriver: false` depending on the platform. If native driver is unavailable for the SVG layer, fall back to a JS-driven timing animation (still smooth for a 3s ease-out) — decided during implementation, no API impact.
- [Public route leaking app chrome] → `app/w/[id].tsx` sits outside `(tabs)`, renders its own minimal screen, and the gate skips it, so no authenticated chrome or redirect appears.
- [Empty/one-name wheels] → Spin is disabled under 2 names with a hint; the editor still allows saving (parity with backend), but the spinner guards the interaction.

## Migration Plan

Additive. New files plus edits to `app/_layout.tsx` (gate exemption), `app/(tabs)/wheel.tsx` (replace placeholder), and `src/config/env.ts` (web app base URL). New dependency `expo-clipboard`. Rollback removes the new files, restores the wheel placeholder, and reverts the gate and config edits. No flag needed.

## Open Questions

- The exact `webAppBaseUrl` domain for share links (defaulting to `https://app.alaasmagi.dev`) — a config value, adjustable without code changes; does not affect the hook or route design.
- Spin animation duration/easing feel — a presentation detail to tune against the web spinner (≈3.2s ease-out), no API impact.
