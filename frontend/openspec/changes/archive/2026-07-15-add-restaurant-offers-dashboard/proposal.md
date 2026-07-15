## Why

Seeing today's lunch offers across the shared restaurant catalog is the core value of the app. This change replaces the empty `DashboardView` placeholder from the auth bootstrap with a real dashboard that lists every restaurant and lazily reveals each one's daily offers.

## What Changes

- Port three design-system primitives into `src/components/design-system/data-display/` from their `.d.ts` + `.prompt.md` + `.card.html` (with `.jsx` for structure only): `Card` (`padding`, `hoverable`), `Badge` (`tone`, `icon`), `Tag` (`selected`, `onRemove`). Any interaction states are CSS, not JS handlers.
- Add `src/types/restaurant.ts`: a `Restaurant` interface matching `RestaurantDto` (id, concurrencyToken, name, city, latitude, longitude, offerTimeText, parkingInfo, openingInfo, hasOffers, isFastFood, offersResourceUrl, offerProviderId) and a `DailyOffer` interface (`offerText`, `offerPrice`).
- Add `src/api/restaurants.ts`: `getRestaurants()` -> `GET /api/v1/restaurants`, `getRestaurantOffers(id)` -> `GET /api/v1/restaurants/{id}/offers`, both through the shared bearer fetch wrapper from the auth change.
- Add `src/stores/restaurants.ts` (Pinia): the restaurant list fetched once and cached in memory, plus a per-restaurant offers cache (`id -> { offers, loading, error, loaded }`) fetched lazily per restaurant, never all at once.
- Add `src/components/restaurant/RestaurantCard.vue`: composed from `Card` + `Badge` (a "Fast food" badge when `isFastFood`; a "No offers today" badge when `hasOffers` is false or the fetched offers list is empty) + `Tag` (city). Shows name, offer time text, parking info, opening info, and a "See offers" `Button` that triggers the lazy fetch.
- Add `src/components/restaurant/OfferList.vue`: renders the fetched `offerText` / `offerPrice` pairs for one restaurant, with a loading state while in flight and an empty state ("No offers available") rather than an error when the source genuinely has nothing today.
- Replace `src/views/DashboardView.vue`: lists all restaurants via `RestaurantCard`, each independently expandable to show its `OfferList`.
- All UI copy follows the design system's content rules (sentence case, no exclamation points, no em-dashes, digits not spelled numbers).

**Correction to the request's assumed offers shape**: the backend `GET /api/v1/restaurants/{id}/offers` returns a bare JSON array of `{ offerText, offerPrice }` (camelCase; `offerPrice` is a nullable string), not a `{ BusinessDate, Offers: [...] }` object. `BusinessDate` is cached server-side but never sent in the response, so the frontend types and store model the array directly and omit `businessDate`.

## Capabilities

### New Capabilities
- `restaurant-offers`: browse the shared restaurant catalog and lazily view each restaurant's daily offers. Covers the typed API layer, the in-memory catalog + per-restaurant offers cache, the `RestaurantCard` and `OfferList` composed components, and the dashboard listing behavior.

### Modified Capabilities
- `design-system-foundation`: ADD the `Card`, `Badge`, and `Tag` primitives (the capability previously covered only tokens, `Icon`, and `Button`).
- `app-shell`: MODIFY the "Dashboard placeholder behind the guard" requirement - the dashboard now renders the restaurant catalog instead of an empty placeholder.

## Impact

- **New source areas**: `src/components/design-system/data-display/`, `src/components/restaurant/`, `src/api/restaurants.ts`, `src/stores/restaurants.ts`, `src/types/restaurant.ts`; `DashboardView.vue` is rewritten.
- **Backend contract**: depends on `GET /api/v1/restaurants` (array of `RestaurantDto`) and `GET /api/v1/restaurants/{id}/offers` (array of `{ offerText, offerPrice }`), both bearer-authorized.
- **Design system**: first port of `Card`, `Badge`, `Tag`; extends the lazy-porting pattern established for `Icon`/`Button`.
- **No new dependencies.**
- **Assumption (stated for apply)**: this dashboard shows the FULL shared catalog, not filtered by any `DiningEnvironment` - environments do not exist in the frontend until the next change.

## Out of Scope

- `DiningEnvironment` / `EnvironmentRestaurant` UI and filtering, favourites, the wheel, admin restaurant management.
