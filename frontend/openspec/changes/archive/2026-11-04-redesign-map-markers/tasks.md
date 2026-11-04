## 1. Design-system ports

- [x] 1.1 Add the `utensils` icon to `src/components/design-system/Icon.vue` (`IconName` union and path, copied from the design system's `icons.ts`)
- [x] 1.2 Port `MapMarker.vue` to `src/components/design-system/map/` from `Map.tsx` and `components.css` (offers/plain, selected, placed via `x`/`y`, optional `click` emit rendering a button, visually hidden offers suffix)
- [x] 1.3 Port `MapDot.vue` (`user`, `location`, `place`; optional `label`) and `MapHint.vue` (info icon + slot)
- [x] 1.4 Port `MapLegend.vue` built from two `MapMarker`s with the design system default labels
- [x] 1.5 Add smoke tests for each ported map component covering every variant and state, plus the button vs span rendering of `MapMarker`

## 2. Overlap helper

- [x] 2.1 Add `collapsedIds(items)` to `src/components/restaurant/mapMarkers.ts` (priority: selected, offers, rest; stable; returns ids overlapping a kept rect)
- [x] 2.2 Unit-test `collapsedIds`: no overlap, offers beats plain, selected beats offers, list order within a group, chains of three

## 3. Restaurant map

- [x] 3.1 Render restaurant markers as `MapMarker` mounted into each `divIcon` element (`iconSize: [0, 0]`, `x = 0`, `y = 0`), unmounting before `clearLayers()` and on unmount
- [x] 3.2 Replace `declutterLabels()` with the measure-then-collapse pass using `collapsedIds` and `MapDot kind="place"`, after render and on `zoomend`
- [x] 3.3 Show the opened marker as selected while its popup is open and reset it on `popupclose`
- [x] 3.4 Render the user position as `MapDot kind="user"` labelled "Your location"
- [x] 3.5 Replace the legend `<ul>` with `MapLegend` and the hint `<p>` with `MapHint` ("Showing the closest restaurants. Zoom in to see more."), keeping their positions
- [x] 3.6 Remove the old marker, label, legend, hint and user-dot styles that are no longer used
- [x] 3.7 Update `RestaurantMap.test.ts`: marker icons receive an element, legend shows both marker styles, hint text, user dot

## 4. Verify

- [x] 4.1 Run `npm run type-check` and `npm test`, both pass
- [x] 4.2 Check in the running app: offer and plain pills, selected state, collapsing while zooming out and expanding while zooming in, clicking a collapsed dot, legend, hint and user dot, in light and dark mode
