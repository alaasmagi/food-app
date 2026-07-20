## Context

The mobile app renders the shared restaurant catalog on the Dashboard (`RestaurantCard`, `useRestaurants()`) and now filters it by dining environment. Favourites are the next feature in the web-parity sequence. The backend already exposes `/api/v1/favourites` with the same DTO shape and concurrency semantics the web frontend consumes, so the contract is fixed: `Favourite { id, concurrencyToken, restaurantId, rating (1-5), note? }`, list via GET, create via POST, explicit update via PUT with `If-Match`. There is no upsert endpoint — the web store decides create-vs-update client-side, and mobile mirrors that.

Two design-system pieces are needed. `Input` and `Dialog` are already ported (from the environments change). `Toast` is not yet ported; it is the first transient-feedback surface the app needs, so this change introduces both the Toast card and a small app-level host to display it.

## Goals / Non-Goals

**Goals:**
- Let a user rate a restaurant 1-5 with an optional note, and see that rating on its card.
- Client-side create-or-update upsert with `If-Match` on update, server state in React Query.
- A reusable toast mechanism (card + host + `useToast()`) to confirm saves and surface errors.
- Favourite behavior independent of environments (works on any card, in any environment or "All").

**Non-Goals:**
- Sorting or filtering restaurants by rating (a later change).
- The wheel and settings.
- Deleting favourites (the API supports it, but the brief scopes to rate/note; no delete UI here).
- A general notifications framework beyond the transient toast stack.

## Decisions

### Upsert is client-side over the cached list
`useUpsertFavourite()` reads the cached favourites (via `favouriteFor(restaurantId)`); if a favourite exists it calls `updateFavourite(id, input, concurrencyToken)` (PUT + `If-Match`), otherwise `createFavourite(input)` (POST). On success it invalidates the favourites query so the card's read-only stars refresh with the new value and token. Alternative considered: rely on the backend's POST-updates-existing behavior for everything — rejected because an explicit PUT with `If-Match` is the correct optimistic-concurrency path for edits and matches the web implementation and the backend's "explicit update by id" requirement.

### Server state in React Query, derived lookup — no bespoke store
Favourites are server data, so they live in React Query (`useFavourites()`), not a ported Pinia store. A `favouriteFor(restaurantId)` helper derives a `restaurantId -> Favourite` view (a memoized map) so each card can answer "am I favourited?" without a request. This matches the environments change's approach (membership map derived off the cached list).

### RatingStars draws its own star glyph
The design-system Icon set has no star, and the web `RatingStars` deliberately self-draws one. Mobile does the same with `react-native-svg` (already a dependency): a filled `Path` for a selected star, an outline (stroke, no fill) otherwise, warning-tone color for filled and a muted border tone for empty. Editable mode wraps each star in a `Pressable` reporting rating n; read-only mode renders plain `View`s and is non-interactive. The brief's "via the ported Icon" is reconciled this way because adding a star to the shared Icon would invent a glyph the design system does not define.

### Toast host as a React context provider at the app root
Toast is transient, so the ported card is paired with a `ToastProvider` mounted in `app/_layout.tsx` (inside `SafeAreaProvider`, alongside the existing providers). It holds an array of active toasts, renders them in a fixed bottom stack that respects safe-area insets, auto-dismisses each after a timeout, and exposes `useToast()` returning a `push({ title, description?, tone })` function. This is the mobile analog of the web's `toasts` Pinia store plus the app-shell stack. Alternative considered: a third-party toast library — rejected to avoid a new dependency and to keep the visual identity on the ported design-system card.

### The favourite surface is separate from the environment action
`RestaurantCard` already has an environment membership action gated on a selected environment. The favourite display (read-only stars) and rate/edit action are always present and independent of environment selection, laid out as their own row so the two concerns do not interfere.

## Risks / Trade-offs

- [Stale concurrency token causes a 409 on update] → Surface the failure via a danger toast and keep the dialog open for retry; the invalidated favourites query refetches the current token. No custom conflict resolution.
- [Toast host not mounted / used outside provider] → `useToast()` throws a clear error if no provider is present; the provider is mounted once at the root so every screen is covered.
- [Timers leaking in tests] → Auto-dismiss uses a cleared timeout on unmount/close; tests can assert push/render without waiting on real timers (fake timers or direct dismiss).
- [Rating 0 (unset) submitted] → The editor's 1-5 integer validation disables Save until a star is chosen, mirroring the backend `[Range(1,5)]`.
- [Card row clutter] → The favourite row and the environment row are distinct; on "All" only the favourite row shows, keeping the card readable.

## Migration Plan

Additive, no data migration. New files plus edits to `RestaurantCard.tsx` and `app/_layout.tsx` (mount `ToastProvider`). Rollback is removing the new files and reverting those two edits; the card returns to its current presentation. No flag needed — cards simply show a "Rate" action until a user rates.

## Open Questions

- Exact placement of the rating row within the card (above vs below the environment action row) — a presentation detail to settle during implementation against the existing card layout; it does not affect the API, hooks, or toast design.
- Toast stack position and timeout duration — defaulting to a bottom, safe-area-aware stack with a few-second auto-dismiss; adjustable against `toast.card.html` without changing the `useToast()` contract.
