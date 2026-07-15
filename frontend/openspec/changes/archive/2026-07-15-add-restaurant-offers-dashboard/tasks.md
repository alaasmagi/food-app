## 1. Design-system primitives

- [x] 1.1 Port `Card` to `src/components/design-system/data-display/Card.vue` from its `.d.ts` + `.prompt.md` + `.card.html` (+ `.jsx` for structure): `padding` and `hoverable` props, `<slot />` content, `:hover` treatment (darken surface, brighten border) as scoped CSS using only `var(--token-name)`
- [x] 1.2 Port `Badge` to `src/components/design-system/data-display/Badge.vue`: `tone` ("neutral" | "accent" | "success" | "warning" | "danger") and optional `icon` (`IconName`) rendering the ported `Icon`, uppercase mono treatment via CSS, `<slot />` content
- [x] 1.3 Port `Tag` to `src/components/design-system/data-display/Tag.vue`: `selected` state and optional remove affordance emitting a native `remove` event, `:hover`/selected states as scoped CSS, `<slot />` content
- [x] 1.4 Add smoke tests (Vitest + Vue Test Utils): each `Card`/`Badge`/`Tag` renders without error across its prop variants; `Badge` renders each `tone`; `Tag` emits `remove` when its remove affordance is activated

## 2. Types and API layer

- [x] 2.1 Add `src/types/restaurant.ts`: `Restaurant` interface matching `RestaurantDto` (id, concurrencyToken, name, city, latitude, longitude, offerTimeText, parkingInfo, openingInfo, hasOffers, isFastFood, offersResourceUrl `string | null`, offerProviderId `string | null`) and `DailyOffer` (`offerText: string`, `offerPrice: string | null`)
- [x] 2.2 Add `src/api/restaurants.ts`: `getRestaurants()` -> `GET /api/v1/restaurants` and `getRestaurantOffers(id)` -> `GET /api/v1/restaurants/{id}/offers`, both through the shared `apiFetch` wrapper; parse the offers body as a bare `DailyOffer[]` (no `businessDate` envelope); confirmed both endpoints return bare arrays (`Ok(list)` / `Content(offersJson)`)

## 3. Restaurants store

- [x] 3.1 Add `src/stores/restaurants.ts` (Pinia): `list: Restaurant[]` loaded once and cached; `loadRestaurants()` no-ops when already loaded
- [x] 3.2 Add the per-restaurant offers cache `offersById: Record<string, { offers: DailyOffer[]; loading: boolean; error: string | null; loaded: boolean }>` and `loadOffers(id)` that fetches lazily, no-ops when already `loaded`/`loading`, and records `loading`/`error` per restaurant without affecting others

## 4. Feature components

- [x] 4.1 Add `src/components/restaurant/RestaurantCard.vue` from `Card` + `Badge` + `Tag` + `Button`: shows name, offerTimeText, parkingInfo, openingInfo, a city `Tag`, a "Fast food" `Badge` when `isFastFood`, a "No offers today" `Badge` when `hasOffers` is false or the loaded offers list is empty, and a "See offers" `Button` that calls the store's `loadOffers(id)` and toggles the offer list; expansion state is local to the component
- [x] 4.2 Add `src/components/restaurant/OfferList.vue`: renders `offerText` / `offerPrice` pairs for one restaurant; shows a loading state while `loading`, an inline error only on genuine `error`, and a "No offers available" empty state when loaded with no offers

## 5. Dashboard view

- [x] 5.1 Rewrite `src/views/DashboardView.vue` to load the catalog on mount and render a `RestaurantCard` per restaurant, each independently expandable to show its `OfferList`; full shared catalog, no environment filtering; sentence-case copy, no exclamation points/em-dashes/emoji, digits not spelled numbers

## 6. Tests

- [x] 6.1 Add store tests: catalog fetched once (second `loadRestaurants` issues no request), offers fetched lazily and cached per id (repeat `loadOffers` issues no request), and per-restaurant `loading`/`error` tracking
- [x] 6.2 Add component tests: `RestaurantCard` shows the fast-food and no-offers badges under the right conditions and calls `loadOffers` on "See offers"; `OfferList` shows loading, empty, and populated states

## 7. Verification

- [x] 7.1 Run `vue-tsc`/`vite build` and the Vitest suite; confirm type-check, build, and all tests pass
- [x] 7.2 Grep `src/` for any import/`@import`/relative path into `alaasmagi-design-system/` and confirm there are none
