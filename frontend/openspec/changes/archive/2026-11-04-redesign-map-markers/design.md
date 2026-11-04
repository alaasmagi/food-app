## Context

`RestaurantMap.vue` builds markers as Leaflet `divIcon`s from an HTML string: a 16px dot (`.restaurant-map__marker-dot`) plus a name label next to it. `declutterLabels()` hides labels that overlap after rendering and after zoom. The legend is a hand-made `<ul>` of dots, the hint is a styled `<p>`, and the user position is another `divIcon` with a halo.

The design system (commit `2d21580`) now defines the map pieces in `components/Map.tsx` and `components.css` (lines 270–296): `MapMarker` (Offers × State), `MapLegend`, `MapDot` (`user`, `location`, `place`), `MapHint`, plus `MapZoom`/`MapPopup`, which are out of scope. The ported `Icon.vue` has no `utensils` icon yet.

## Goals / Non-Goals

**Goals:**
- Port `MapMarker`, `MapDot`, `MapLegend` and `MapHint` to Vue and use them on the map.
- Keep one source of truth for marker markup: the same Vue component renders the legend and the Leaflet markers.
- Collapse overlapping markers to place dots.

**Non-Goals:**
- `MapZoom`, `MapPopup`, `MapOffer`, `MapControl`, `MapView`, `MapRadius`, `Rating`.
- Changing how `hasOffers` is determined.
- A token sync with the design system. The frontend token files have a different layout from the design system's; this change only uses tokens that already exist in the frontend.

## Decisions

- **Ported components in `src/components/design-system/map/`.** One folder per design-system category, matching the existing `forms/`, `feedback/` folders. Props are ported 1:1 from `Map.tsx` (`name`, `offers`, `selected`, `x`, `y`, `offersLabel` for `MapMarker`; `kind`, `x`, `y`, `label` for `MapDot`; `offersLabel`, `noOffersLabel` for `MapLegend`; default slot for `MapHint`). `MapMarker`'s `onClick` becomes an optional `click` emit, rendering a `<button>` only when a listener is attached, as in the React reference. CSS is copied from `components.css` into each component's `<style scoped>`, keeping every `var(--token)`. `--font-sans` maps to the frontend's equivalent `--font-body` (same font stack), since the frontend has no `--font-sans`.
- **Leaflet markers are mounted Vue components.** Each marker's `divIcon` gets an `HTMLElement` as `html`, and the component is rendered into it with Vue's `render(h(...), el)`. Changing state (selected, collapsed) re-renders into the same element, and `render(null, el)` unmounts before `clearLayers()` and on component unmount. Alternative: keep building an HTML string with the same `ds-` classes. Rejected because it duplicates the component's markup and breaks the single source of truth.
- **Anchoring.** `divIcon` uses `iconSize: [0, 0]` and an empty `className`. The rendered `MapMarker`/`MapDot` gets `x = 0`, `y = 0`, so its own `--placed` transform (`translate(-50%, -100%)` for markers, `translate(-50%, -50%)` for dots) puts the tail tip or dot centre on the coordinate.
- **Leaflet keeps the interaction.** Map markers render the non-button `MapMarker` (no click listener). Leaflet's marker element already gets focus, keyboard activation and the click handler that opens the popup, so a nested `<button>` would create a second tab stop.
- **Overlap as a pure function.** `mapMarkers.ts` gets `collapsedIds(items)`. It takes `{ id, rect, offers, selected }` entries in list order, sorts them by priority (selected, offers, rest; stable) and returns the ids whose rect intersects an already kept rect. `RestaurantMap` first renders every marker as a full pill, measures the pills with `getBoundingClientRect()`, then re-renders the collapsed ones as `MapDot kind="place"`. This replaces `declutterLabels()` and runs at the same points (after render and on `zoomend`). Collapsed dots are measured at pill size, so a marker only expands again once its full pill fits.
- **Selected marker.** `openPopupFor` re-renders the opened marker as selected (a full pill even if it was collapsed). The `popupclose` handler re-renders it as default and runs the overlap check again.
- **Popup offset.** Leaflet opens the popup above its coordinate, which now covers the pill. `openPopupFor` measures the selected marker's height and sets the popup `offset` to `[0, 7 - height]` (7 is Leaflet's default), so the popup tip lands on top of the pill. The design system's own `MapPopup` (opening below the marker) stays out of scope.
- **Layout of the overlays.** The hint and legend sit in one bottom row (`flex-wrap`, legend pushed right) instead of two absolutely positioned boxes with a hard-coded `right: 220px` gap. The new legend is wider, and this way the hint wraps above it on narrow maps instead of overlapping.
- **Hint copy.** "Showing the closest restaurants — zoom in to see more." becomes "Showing the closest restaurants. Zoom in to see more." The frontend content rules forbid em-dashes in UI copy.
- **Legend labels.** The design system defaults are kept: "Lunch offers today" and "No offers today".

## Risks / Trade-offs

- [Long restaurant names make wide pills] → Accepted. The design has no max width; wide pills simply collapse more often when zoomed out.
- [A collapsed place dot uses the accent colour for every restaurant, so offers aren't visible until you zoom in] → Accepted for now. It follows `MapDot kind="place"` as designed, and offer restaurants get the pills first.
- [Rendering many Vue sub-trees on each viewport fetch] → The map already caps the viewport result set. Markers are small, render-only components with no store access.
- [Measuring after render needs the elements in the DOM] → The overlap check runs after `addTo(markerLayer)`, as `declutterLabels()` already does.

## Open Questions

- None blocking. A follow-up change can port `MapZoom` and `MapPopup`.
