## ADDED Requirements

### Requirement: Restaurant catalog list

The Dashboard SHALL display the full shared restaurant catalog from `useRestaurants()` as a scrollable, virtualized list of restaurant cards, without environment filtering.

#### Scenario: Restaurants render as cards

- **WHEN** the restaurants query resolves successfully
- **THEN** each restaurant is shown as a `RestaurantCard` in a virtualized list

#### Scenario: Loading state

- **WHEN** the restaurants query is loading with no cached data
- **THEN** the Dashboard shows a loading indicator rather than an empty screen

#### Scenario: Empty catalog

- **WHEN** the restaurants query resolves to an empty list
- **THEN** the Dashboard shows an empty state message

#### Scenario: Error state

- **WHEN** the restaurants query fails
- **THEN** the Dashboard shows an error state conveying the failure

### Requirement: Pull-to-refresh

The Dashboard SHALL support pull-to-refresh that refetches the restaurant list.

#### Scenario: Pull to refresh refetches

- **WHEN** the user pulls the list down to refresh
- **THEN** the restaurants query refetches and the refresh indicator reflects the in-flight state

### Requirement: Restaurant card presentation

Each `RestaurantCard` SHALL show the restaurant name, the city as a Tag, and a "Fast food" Badge when `isFastFood` is true. It SHALL show a "No offers today" Badge when offers are known to be absent — either the restaurant's `hasOffers` is false, or an expanded offers query has resolved to an empty array.

#### Scenario: Fast food badge

- **WHEN** a restaurant has `isFastFood` true
- **THEN** its card shows a "Fast food" Badge

#### Scenario: City tag

- **WHEN** a restaurant card renders
- **THEN** the restaurant's city is shown as a Tag

#### Scenario: No offers badge from static hint

- **WHEN** a restaurant has `hasOffers` false
- **THEN** its card shows a "No offers today" Badge without fetching offers

### Requirement: Expandable lazy offers

Each `RestaurantCard` SHALL be expandable, and only on expansion SHALL it fetch that restaurant's offers via `useRestaurantOffers(id)` and render them in an `OfferList` with its own loading, empty, and error states.

#### Scenario: Expanding fetches offers

- **WHEN** the user expands a restaurant card for the first time
- **THEN** that restaurant's offers are fetched and shown as text/price rows in the `OfferList`

#### Scenario: Collapsed cards do not fetch

- **WHEN** a restaurant card is collapsed
- **THEN** no offers request is made for that restaurant

#### Scenario: Offers loading state

- **WHEN** an expanded card's offers query is in flight
- **THEN** the `OfferList` shows a loading indicator

#### Scenario: No offers today

- **WHEN** an expanded card's offers query resolves to an empty array
- **THEN** the `OfferList` shows a "No offers today" empty state

#### Scenario: Offers error state

- **WHEN** an expanded card's offers query fails
- **THEN** the `OfferList` shows an error state
