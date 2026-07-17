# restaurant-map Specification

## Purpose
TBD - created by syncing change add-restaurant-map. Update Purpose after archive.
## Requirements
### Requirement: Leaflet map dependency and dark tiles

The application SHALL add `leaflet` as a runtime dependency and `@types/leaflet` as a dev dependency, and SHALL import Leaflet's stylesheet (`leaflet/dist/leaflet.css`) once. The map SHALL use a dark raster tile provider (CARTO `dark_all`) rather than the default light OpenStreetMap tiles, and SHALL preserve the required OpenStreetMap and CARTO attribution. Map chrome (tiles, popups, controls, attribution) SHALL be styled with the app's design tokens so it fits the dark-mode-first aesthetic.

#### Scenario: Dark tiles are used

- **WHEN** the map renders its base layer
- **THEN** it loads CARTO `dark_all` tiles, not the default light OpenStreetMap tiles

#### Scenario: Attribution preserved

- **WHEN** the map renders
- **THEN** the OpenStreetMap and CARTO attribution is shown as the tile provider requires

### Requirement: Restaurant map component

The application SHALL provide `src/components/restaurant/RestaurantMap.vue` that renders a Leaflet map from a restaurant set passed to it, without issuing any restaurant fetch of its own. It SHALL render exactly one marker per restaurant that has a usable location. Because the backend types latitude/longitude as non-nullable numbers, an unset location arrives as the 0/0 sentinel; a restaurant SHALL be treated as having no location (and silently excluded, with no error and no placeholder) when either coordinate is non-finite, when both are 0, or when either is out of geographic range. When no restaurant has a location the map SHALL show a fallback view and an empty hint. The map SHALL frame the rendered markers on load. The map instance SHALL be created when the component mounts and destroyed when it unmounts.

#### Scenario: One marker per located restaurant

- **WHEN** the map renders for a set of restaurants
- **THEN** a marker is placed for each restaurant with a usable, in-range, non-zero location

#### Scenario: Restaurants without coordinates are excluded silently

- **WHEN** a restaurant in the set has no usable location (non-finite, 0/0, or out of range)
- **THEN** no marker is created for it and no error is shown

#### Scenario: Frames the visible markers

- **WHEN** the map has one or more markers
- **THEN** the view is fitted to the bounds of those markers

#### Scenario: Fallback when nothing is located

- **WHEN** no restaurant in the set has a usable location
- **THEN** the map shows a fallback view and an empty hint instead of markers

#### Scenario: Map is torn down on unmount

- **WHEN** the map component unmounts
- **THEN** the Leaflet map instance is removed and its listeners released

### Requirement: Marker popup with name and lazy offers

Each marker SHALL open a popup on click showing the restaurant's `name` and a "See offers" action. The "See offers" action SHALL behave the same as the `RestaurantCard` action: it triggers the shared `restaurants` store's lazy per-restaurant offers fetch (once) and reveals that restaurant's `OfferList`. Because it goes through the shared store, offers already loaded elsewhere SHALL be served from cache rather than refetched.

#### Scenario: Popup shows name and action

- **WHEN** the user clicks a marker
- **THEN** a popup opens showing the restaurant name and a "See offers" action

#### Scenario: See offers triggers the lazy fetch

- **WHEN** the user activates "See offers" in a popup
- **THEN** the store fetches that restaurant's offers once and the popup reveals its `OfferList`

#### Scenario: Cached offers are reused

- **WHEN** the restaurant's offers were already loaded (from a card or a prior popup)
- **THEN** the popup shows them from cache without a new request
