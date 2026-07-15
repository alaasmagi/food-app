## Context

The auth bootstrap established the token flow, the shared bearer fetch wrapper (`src/api/client.ts`), the `Icon`/`Button` primitives, and an empty `DashboardView` behind the router guard. This change fills that dashboard with the app's core content: the shared restaurant catalog and each restaurant's daily lunch offers.

The backend exposes two bearer-authorized endpoints:
- `GET /api/v1/restaurants` -> array of `RestaurantDto`.
- `GET /api/v1/restaurants/{id}/offers` -> a raw JSON **array** of offer lines, produced by `OfferFetchService` as `JsonSerializer.Serialize(offers)` and returned via `Content(...)`. The backend caches offers per business date and only refetches when stale, which is why the frontend fetches offers lazily per restaurant rather than eagerly.

## Goals / Non-Goals

**Goals:**
- Port `Card`, `Badge`, `Tag` into `src/` from their four source files, CSS-only interaction states.
- Type the restaurant and offer DTOs to the real backend shapes.
- Cache the catalog once and cache offers lazily per restaurant, tracking per-restaurant loading/error.
- Compose `RestaurantCard` + `OfferList` and render the full catalog in `DashboardView`.

**Non-Goals:**
- Dining-environment filtering, favourites, the wheel, admin restaurant management.
- Map rendering from latitude/longitude (carried in the type for later use, not displayed as a map here).
- Toast-based global error UX (per-restaurant inline error/empty states only; a shared Toast arrives with a later change).
- Sorting, searching, or paginating the catalog.

## Decisions

**Offers response is a bare array of `{ offerText, offerPrice }`, `offerPrice` nullable - the request's assumed `{ BusinessDate, Offers }` shape is wrong.** Verified in `OfferFetchService.GetDailyOffersAsync`: the HTTP body is `JsonSerializer.Serialize(fetchResult.Value ?? [])` (camelCase Web defaults; `OfferLine` = `offerText: string`, `offerPrice: string?`). `BusinessDate` lives only in the server-side cache row and is never sent. So `DailyOffer = { offerText: string; offerPrice: string | null }`, the response type is `DailyOffer[]`, and the store cache entry omits `businessDate`. Rationale: type to what the wire actually returns, not to an assumed envelope. `offerPrice` is a display string (e.g. "4.90 EUR"), not a number - do not parse or format it as currency.

**Lazy per-restaurant offers, keyed cache in the store.** The `restaurants` store holds `list: Restaurant[]` (loaded once) and `offersById: Record<string, OffersEntry>` where `OffersEntry = { offers: DailyOffer[]; loading: boolean; error: string | null; loaded: boolean }`. `loadOffers(id)` no-ops when `loaded` or `loading` is already set, so repeated "See offers" clicks and re-expansions never refetch. Rationale: mirrors the backend's per-restaurant lazy-fetch philosophy and keeps one restaurant's failure isolated from the rest.

**"No offers today" derives from two independent signals.** The badge shows when `hasOffers === false` (catalog-level flag) OR when offers have loaded and the array is empty. Before offers are loaded, only the `hasOffers` flag drives it. Rationale: `hasOffers` is a cheap catalog hint available immediately; the empty-array check refines it after a fetch. The `OfferList` empty state ("No offers available") is a success state, never an error.

**Expansion state is local to the view/card, not the store.** Which cards are expanded is UI state held in `DashboardView`/`RestaurantCard`, not the Pinia store; the store owns only fetched data. Rationale: keeps the store free of view concerns and lets expansion reset on navigation without touching the cache.

**Alternatives considered:**
- *Eagerly fetching all offers after the catalog loads* - rejected: defeats the backend's lazy design, N requests on page load, and most offers are never viewed.
- *Storing offers on the `Restaurant` object* - rejected: couples cache lifecycle to the list and complicates loading/error per row; a separate keyed map is cleaner.
- *A `useRestaurantOffers` composable instead of store actions* - the store already owns caching; a thin composable would just wrap it, so offers logic stays in the store for one source of truth.

## Risks / Trade-offs

- **Offer array item shape beyond `offerText`/`offerPrice`** -> the provider-produced JSON could carry extra fields. Mitigation: type only the two known fields and ignore extras (JSON parse tolerates them); `offerPrice` typed `string | null` for missing prices.
- **Large catalog renders many cards** -> could be heavy if the catalog grows. Mitigation: acceptable for now (no pagination in scope); cards are light and offers load only on demand. Log/revisit if the catalog is large.
- **Badge uppercase vs content rules** -> `Badge` intentionally uppercases, which is the one sanctioned exception. Mitigation: author badge text in sentence case ("Fast food", "No offers today") and let the component's CSS uppercase it; do not hardcode caps.
- **`GET /offers` non-200 (e.g. provider error 5xx)** -> the wrapper surfaces it. Mitigation: `loadOffers` records `error` on the restaurant's entry and `OfferList` shows an inline error only for genuine failures, distinct from the empty-but-successful state.

## Migration Plan

Additive except for `DashboardView.vue`, which is rewritten from the placeholder. Port `Card`/`Badge`/`Tag`; add `types/restaurant.ts`, `api/restaurants.ts`, `stores/restaurants.ts`; add `RestaurantCard.vue` + `OfferList.vue`; rewrite `DashboardView.vue`. Rollback is reverting the change (the placeholder dashboard is restorable from the prior change). No backend or dependency changes.

## Open Questions

- Whether the raw `RestaurantDto.concurrencyToken`/`id` are needed by any write path here - not in this change (read-only), carried in the type for later.
- Whether `offersResourceUrl` should be surfaced as a link on the card - deferred; not requested for this change.
- Confirm at apply time that `GET /api/v1/restaurants` returns a bare array (not an `IMethodResponse<T>` envelope) like the offers endpoint; adjust the api-layer parse if the controller wraps it.
