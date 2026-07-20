# restaurant-map Specification

## Purpose

The Map tab's presentation of the shared restaurant catalog: a dark-styled map that places a marker for each restaurant with valid coordinates, reusing the Dashboard's cached restaurant and offers data, with per-marker callouts that open the restaurant's offers - all without requesting location permission. (Purpose is brief - refine as the capability grows.)

## Requirements

### Requirement: Map tab renders the shared catalog

The Map tab at `app/(tabs)/map.tsx` SHALL render a `RestaurantMap` over the same `useRestaurants()` data the Dashboard uses, so the React Query cache is shared and no additional restaurants fetch is triggered by opening the tab.

#### Scenario: Map uses the cached restaurants

- **WHEN** the user opens the Map tab after the Dashboard has loaded restaurants
- **THEN** the map renders from the cached restaurant list without issuing another restaurants request

#### Scenario: Map loading and error states

- **WHEN** the restaurants query is loading with no cache, or has failed
- **THEN** the Map tab shows a loading indicator or an error state respectively rather than a blank map

### Requirement: Coordinate-filtered markers

`RestaurantMap` SHALL render exactly one marker per restaurant that has both a valid `latitude` and `longitude` AND is included in the currently selected environment, and SHALL silently omit restaurants missing either coordinate. When "All" is selected (the selected-environment store is `null`), every coordinate-bearing restaurant is eligible; when a specific environment is selected, only its member restaurants are eligible. Environment filtering SHALL be client-side against the same cached restaurant and membership data, issuing no additional restaurants request.

#### Scenario: Restaurant with coordinates gets a marker

- **WHEN** a restaurant has both `latitude` and `longitude` and is eligible under the selected environment
- **THEN** a single marker is placed at that location, keyed by the restaurant id

#### Scenario: Restaurant without coordinates is omitted

- **WHEN** a restaurant is missing `latitude` or `longitude` (nullish, non-finite, or an invalid pair)
- **THEN** no marker is rendered for it and no error is surfaced

#### Scenario: Marker filtered out by environment

- **WHEN** a specific environment is selected and a coordinate-bearing restaurant is not a member of it
- **THEN** no marker is rendered for that restaurant, filtered client-side without refetching restaurants

### Requirement: Dark map styling

The map SHALL be rendered in a dark style consistent with the app's dark-mode aesthetic, and its container background SHALL be a dark surface token so tile-load gaps do not flash a light background.

#### Scenario: Map renders dark

- **WHEN** the map is displayed
- **THEN** it uses a dark style (via the platform's dark map mechanism) and a dark container background

### Requirement: Marker callout with See offers

Pressing a marker SHALL show a callout displaying the restaurant name and a "See offers" action.

#### Scenario: Callout shows name and action

- **WHEN** the user presses a restaurant marker
- **THEN** a callout appears with the restaurant name and a "See offers" action

### Requirement: See offers reuses the offers behavior

The "See offers" action SHALL open the pressed restaurant's offers by reusing the existing `OfferList` component and `useRestaurantOffers` hook, sharing the React Query cache used by the Dashboard, and the offers view SHALL be dismissible.

#### Scenario: See offers shows the restaurant's offers

- **WHEN** the user activates "See offers" for a restaurant
- **THEN** that restaurant's offers are shown via `OfferList` (with the same loading, empty "No offers today", and error states) and can be dismissed

#### Scenario: Cached offers reused across surfaces

- **WHEN** a restaurant's offers were already fetched on the Dashboard
- **THEN** activating "See offers" for it on the map shows the cached offers without refetching

### Requirement: No location permission required

Rendering markers SHALL NOT request location permission.

#### Scenario: No permission prompt to view markers

- **WHEN** the user opens the Map tab and views markers
- **THEN** no location permission is requested

### Requirement: Environment tab row on the Map

The Map tab SHALL render the `EnvironmentTabs` component so the user can switch the selected environment from the Map, and the marker set SHALL update to reflect the same selected environment used by the Dashboard.

#### Scenario: Tabs shown on the Map and shared selection

- **WHEN** the user changes the selected environment via the Map's `EnvironmentTabs`
- **THEN** the marker set updates to that environment and the same selection is in effect when returning to the Dashboard
