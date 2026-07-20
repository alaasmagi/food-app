## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: Environment tab row on the Map

The Map tab SHALL render the `EnvironmentTabs` component so the user can switch the selected environment from the Map, and the marker set SHALL update to reflect the same selected environment used by the Dashboard.

#### Scenario: Tabs shown on the Map and shared selection

- **WHEN** the user changes the selected environment via the Map's `EnvironmentTabs`
- **THEN** the marker set updates to that environment and the same selection is in effect when returning to the Dashboard
