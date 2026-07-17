## MODIFIED Requirements

### Requirement: Dashboard lists the restaurant catalog

The dashboard SHALL present the restaurants from the shared catalog in two switchable views, a "List" view and a "Map" view, selected by a List/Map toggle. Both views SHALL draw from the already-loaded catalog with no extra restaurant fetch. The List view SHALL render restaurants via `RestaurantCard`, each independently expandable to show its `OfferList`, and SHALL show the full catalog under every environment tab, because it doubles as the membership-management UI (the "Add to environment" action lives on non-member cards). The Map view SHALL render restaurants via `RestaurantMap` and SHALL honour the selected environment: under "All" it shows every restaurant, and under a specific environment it shows only that environment's members, filtered client-side against the already-loaded catalog. The dashboard SHALL render `EnvironmentTabs` above the views and a "Manage environments" entry point that opens the environment editor. All UI copy SHALL follow the design system content rules (sentence case, no exclamation points, no em-dashes, digits not spelled numbers).

#### Scenario: Lists all restaurants under "All"

- **WHEN** an authenticated user opens the dashboard with "All" selected and the List view active
- **THEN** the store loads the catalog and a `RestaurantCard` is rendered for each restaurant

#### Scenario: List keeps the full catalog under a specific environment

- **WHEN** the user selects a specific environment tab with the List view active
- **THEN** every restaurant stays visible so member and non-member cards both expose their membership actions, without fetching restaurants again

#### Scenario: Toggle switches between list and map

- **WHEN** the user activates the List/Map toggle
- **THEN** the dashboard shows the List view or the Map view of the same already-loaded catalog, without issuing a new restaurant fetch

#### Scenario: Map honours the selected environment

- **WHEN** the user selects a specific environment tab with the Map view active
- **THEN** the map shows only that environment's member restaurants; selecting "All" shows every restaurant, in both cases from the already-loaded catalog

#### Scenario: Independent expansion

- **WHEN** the user expands one restaurant's offers in the List view
- **THEN** only that restaurant's offers load and expand, leaving other cards unchanged

#### Scenario: Copy follows content rules

- **WHEN** the dashboard and its cards render text
- **THEN** the copy is sentence case with no exclamation points, em-dashes, or emoji, and numbers are digits
