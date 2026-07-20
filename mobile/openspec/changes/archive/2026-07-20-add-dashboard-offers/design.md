## Context

Auth and the app shell shipped in `add-oauth-app-shell`; the Dashboard is still a placeholder. This change turns it into the real feature — the shared restaurant catalog with today's offers — and, because it is the first change to fetch backend data, it stands up the React Query server-state layer the whole app will use.

Backend contracts (confirmed against `backend/` and cross-checked against the Vue frontend's `src/types/restaurant.ts`; the API emits camelCase JSON):

- **Restaurant** (`GET /api/v1/restaurants` → bare `Restaurant[]`): `id`, `concurrencyToken`, `name`, `city`, `latitude`, `longitude`, `offerTimeText`, `parkingInfo`, `openingInfo`, `hasOffers` (bool), `isFastFood` (bool), `offersResourceUrl` (string | null), `offerProviderId` (string | null). Every string except `offersResourceUrl` is server-side required, so treat them as non-null on GET; `offersResourceUrl` and `offerProviderId` are nullable.
- **Offer** (`GET /api/v1/restaurants/{id}/offers` → bare `OfferLine[]`): only `offerText` (string) and `offerPrice` (string | null). `offerPrice` is a **display string** (e.g. "4.90 EUR"), not a number — there is no currency, date, or restaurant-id field on the offer.
- **No wire envelope**: the controller unwraps its internal `IMethodResponse<T>`. On success the body is the bare DTO/array; on error it is RFC 7807 **ProblemDetails** (`title` = error code, `detail` = message, `status`). This corrects the project's generic "handle `IMethodResponse<T>`" note — that shape never reaches the client.
- **Offers are lazy per restaurant**: the list/page endpoints never embed offers; offers come only from the separate `/{id}/offers` call.
- **"Fast food"** is the boolean `isFastFood`. **"No offers today"** is an empty `[]` from the offers endpoint; the restaurant's `hasOffers` boolean is only a static "does this place do offers at all" hint, not a today signal.

The `apiFetch` helper (bearer + 401 refresh/retry) already exists. Card/Badge/Tag prop contracts and token mappings were captured from the design system for a 1:1 port.

## Goals / Non-Goals

**Goals:**

- Stand up React Query (`QueryClientProvider` in the root layout) as the server-state source of truth.
- Typed `Restaurant` and `Offer` interfaces and a `restaurants` API module going through `apiFetch`, with `useRestaurants()` and lazy `useRestaurantOffers(id)` hooks.
- Port Card, Badge, Tag into `design-system/data-display/`.
- A real Dashboard: refreshable scrollable list of `RestaurantCard`s, each expandable to fetch and show its `OfferList`, with loading/empty/error states.

**Non-Goals:**

- Map, environments, favourites, wheel, settings.
- Environment filtering — the Dashboard shows the full shared catalog.
- Pagination/search (`/restaurants/page` exists but the Dashboard uses the full `GET /restaurants` list for now).
- Mutations/concurrency round-trips — this change is read-only, so `concurrencyToken` is carried on the type but not yet sent back.
- Offline persistence of the query cache.

## Decisions

### React Query as the server-state layer; Zustand stays for client state

Per project rules, server data lives in React Query's cache, not a hand-rolled store. This change adds `@tanstack/react-query` and a single `QueryClient` provided at the app root. Query keys: `['restaurants']` for the list, `['restaurants', id, 'offers']` for a restaurant's offers. **Alternative considered:** fetching in `useEffect` + local state. Rejected — no caching, refetch, or dedupe, and it contradicts the established architecture.

### Offers fetched lazily, gated on card expansion

`useRestaurantOffers(id)` is disabled until its card is expanded (`enabled: expanded`), so we only hit `/{id}/offers` for restaurants the user opens — matching the backend's lazy design and avoiding N offer requests on list load. Each expanded card owns its own query; React Query dedupes and caches per id, so re-expanding is instant. **Alternative considered:** prefetch all offers with the list. Rejected — wasteful and not how the backend is meant to be used.

### Bare-payload + ProblemDetails parsing in the API module, not a fake envelope

Since there is no wire envelope, the `restaurants` module reads `response.ok` from `apiFetch`: on ok it parses the bare JSON (`Restaurant[]` / `Offer[]`); on non-ok it parses ProblemDetails and throws a typed error carrying `title`/`detail`/`status`, which React Query surfaces as the query error. A small `parseProblemDetails` helper centralizes this. **Alternative considered:** pretending an `IMethodResponse` wrapper exists. Rejected — it does not reach the client and would misparse every response.

### "Fast food" and "No offers today" badge semantics

`RestaurantCard` renders a **Badge** `tone="neutral"` reading "Fast food" when `isFastFood`. For offers: the empty state is authoritative only after a fetch, so a "No offers today" Badge shows when either the restaurant's `hasOffers` is `false` (known statically — no offers at all) or an expanded offers query has resolved to an empty array. The city renders as a **Tag**. This keeps the collapsed card honest (it never claims "no offers today" from data it hasn't fetched) while still flagging restaurants that structurally have none. **Alternative considered:** force an offers fetch per card to decide the badge. Rejected — defeats lazy loading.

### Component boundaries

`RestaurantCard` (presentational: Card + Badge + Tag + expand affordance, receives the restaurant and an `expanded`/`onToggle`) composes `OfferList` (owns the `useRestaurantOffers` query, renders rows/loading/empty/error). The Dashboard screen owns the list, expansion state (a `Set<string>` of expanded ids), and pull-to-refresh (`refetch` of the restaurants query). Screens stay thin; data logic lives in hooks. **Alternative considered:** the screen holding all offer queries. Rejected — expansion-scoped queries belong with the component that renders them.

### List rendering with FlatList + pull-to-refresh

The Dashboard uses `FlatList` (not `ScrollView`) for the restaurant list so long catalogs virtualize, with `RefreshControl` wired to the restaurants query's `refetch`/`isRefetching`. **Alternative considered:** `ScrollView` + `.map`. Rejected — the shared catalog can be large.

## Risks / Trade-offs

- **Design system authors colors in OKLCH; Badge/Tag icon color uses web `currentColor`** → In RN the ported `Icon` defaults to `textPrimary`, which is wrong for colored tones. Mitigation: pass the tone/text foreground explicitly to `Icon`'s `color` prop in Badge and Tag (captured in the port notes).
- **`offerPrice` is a free-form display string** → Parsing/aligning it as a number would break (values like "4.90 EUR" or null). Mitigation: render it verbatim as text; never parse.
- **"No offers today" ambiguity** → Showing it purely from `hasOffers` could mislead on a day a normally-offering place has none, and showing it only after fetch misses collapsed cards. Mitigation: the two-source rule above (static `hasOffers === false`, or a resolved-empty fetch); the OfferList empty state is the authoritative per-day signal.
- **Full-catalog fetch could be large** → `GET /restaurants` returns everything. Mitigation: FlatList virtualization now; `/restaurants/page` search/pagination is available for a later change if needed, logged as a non-goal here.
- **React Query provider placement** → Must wrap the routed tree but sit under the auth/safe-area providers already in `app/_layout.tsx`. Mitigation: add `QueryClientProvider` inside `SafeAreaProvider`, around `AuthProvider`/navigator, with a module-level `QueryClient`.

## Migration Plan

Additive; replaces one placeholder screen. Sequence: add `@tanstack/react-query` → wrap root in `QueryClientProvider` → add types → add `restaurants` API module + hooks → port Card/Badge/Tag → build `RestaurantCard`/`OfferList` → replace `app/(tabs)/index.tsx` → tests. Rollback: revert the change; the placeholder Dashboard returns and no external state is touched.

## Open Questions

- Should the Dashboard eventually switch to the paged/search endpoint (`/restaurants/page`)? Deferred; the full list is fine at current catalog size.
- Sort order for the restaurant list (alphabetical, by city, by hasOffers)? Assumed backend/insertion order for now unless a product preference surfaces.
- Should a "No offers today" restaurant be visually de-emphasized or filtered out? Assumed shown normally with the badge; filtering is a later product decision.
