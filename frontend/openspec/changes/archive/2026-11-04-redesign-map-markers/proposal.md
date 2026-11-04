## Why

The restaurant map draws each restaurant as a 16px ring or filled dot with a separate name label. The two states look like radio buttons, the difference between "offers" and "no offers" is colour fill only, and the legend repeats the same radio-like dots. The design system now has a dedicated map design (`MapMarker`, `MapLegend`, `MapDot`, `MapHint` in `design-system/src/design-system/components/Map.tsx`) that this map should use.

## What Changes

- Restaurant markers become the design system's `MapMarker`: a name pill with a tail whose tip sits on the coordinate. Restaurants with offers get the accent pill with the `utensils` icon and a screen-reader suffix; the others get the neutral bordered pill. The marker whose popup is open uses the selected state.
- Where pills would overlap, lower-priority markers collapse to the design system's 12px place dot (`MapDot kind="place"`) until there is room. Restaurants with offers and the selected marker keep their pill first. The collapsed dot still opens the popup.
- The legend becomes `MapLegend`, showing the two real marker styles.
- The user location marker becomes `MapDot kind="user"` (no halo).
- The "closest restaurants" hint becomes `MapHint` with the info icon. Its copy drops the em-dash to follow the content rules.
- The `utensils` icon is added to the ported `Icon`.

Out of scope: the zoom control (`MapZoom`), the popup (`MapPopup`, `MapOffer`), and how `hasOffers` is set. `hasOffers` stays the admin-managed flag.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `restaurant-map`: adds requirements for the marker look and states, collapsing overlapping markers, the legend, the user location marker and the hint.

## Impact

- New ported components: `src/components/design-system/map/MapMarker.vue`, `MapDot.vue`, `MapLegend.vue`, `MapHint.vue`, with smoke tests.
- `src/components/design-system/Icon.vue`: new `utensils` icon.
- `src/components/restaurant/RestaurantMap.vue`: marker, user dot, legend and hint rendering; overlap handling replaces label decluttering.
- `src/components/restaurant/mapMarkers.ts`: pure overlap/collapse helper with unit tests.
- `src/components/restaurant/RestaurantMap.test.ts`: updated.
- No API, dependency or env variable changes.
