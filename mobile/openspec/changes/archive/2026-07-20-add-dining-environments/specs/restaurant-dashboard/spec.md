## MODIFIED Requirements

### Requirement: Restaurant catalog list

The Dashboard SHALL display the shared restaurant catalog from `useRestaurants()` as a scrollable, virtualized list of restaurant cards, filtered by the currently selected environment. When "All" is selected (the selected-environment store is `null`), the full catalog is shown; when a specific environment is selected, only the restaurants that are members of that environment are shown. Filtering SHALL be performed client-side against the already-loaded catalog and membership data, without issuing another restaurants request.

#### Scenario: Restaurants render as cards

- **WHEN** the restaurants query resolves successfully and "All" is selected
- **THEN** each restaurant is shown as a `RestaurantCard` in a virtualized list

#### Scenario: Filtered to the selected environment

- **WHEN** a specific environment is selected
- **THEN** only restaurants that are members of that environment are shown, filtered client-side without refetching restaurants

#### Scenario: Loading state

- **WHEN** the restaurants query is loading with no cached data
- **THEN** the Dashboard shows a loading indicator rather than an empty screen

#### Scenario: Empty catalog

- **WHEN** the restaurants query resolves to an empty list
- **THEN** the Dashboard shows an empty state message

#### Scenario: Empty environment

- **WHEN** a specific environment is selected and it has no member restaurants
- **THEN** the Dashboard shows an empty state message rather than a blank list

#### Scenario: Error state

- **WHEN** the restaurants query fails
- **THEN** the Dashboard shows an error state conveying the failure

## ADDED Requirements

### Requirement: Environment tab row on the Dashboard

The Dashboard SHALL render the `EnvironmentTabs` component above the restaurant list, so the user can switch the selected environment and open the environment editor from the Dashboard.

#### Scenario: Tabs shown above the list

- **WHEN** the Dashboard renders
- **THEN** the `EnvironmentTabs` row is shown above the restaurant list, reflecting the currently selected environment
