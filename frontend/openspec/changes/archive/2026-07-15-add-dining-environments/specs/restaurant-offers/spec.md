## MODIFIED Requirements

### Requirement: Restaurant card

The application SHALL provide `src/components/restaurant/RestaurantCard.vue` composed from the `Card`, `Badge`, and `Tag` primitives. It SHALL show the restaurant name, offer time text, parking info, and opening info; a city `Tag`; a "Fast food" `Badge` when `isFastFood`; a "No offers today" `Badge` when `hasOffers` is false or the fetched offers list is empty; and a "See offers" `Button` that triggers the lazy offers fetch. When a specific dining environment (not "All") is selected, the card SHALL also show an "Add to environment" or "Remove from environment" action reflecting the restaurant's membership in that environment.

#### Scenario: Renders restaurant details

- **WHEN** a `RestaurantCard` renders for a restaurant
- **THEN** it shows the name, offer time text, parking info, opening info, and a city tag

#### Scenario: Fast food badge

- **WHEN** the restaurant's `isFastFood` is true
- **THEN** a "Fast food" badge is shown

#### Scenario: No offers badge

- **WHEN** the restaurant's `hasOffers` is false, or its fetched offers list is empty
- **THEN** a "No offers today" badge is shown

#### Scenario: See offers triggers the lazy fetch

- **WHEN** the user activates the "See offers" button
- **THEN** the store fetches that restaurant's offers (once) and the card reveals its offer list

#### Scenario: Membership action only under a specific environment

- **WHEN** a specific environment (not "All") is selected
- **THEN** the card shows an "Add to environment" action when the restaurant is not a member, or "Remove from environment" when it is; under "All" no such action is shown

#### Scenario: Toggling membership

- **WHEN** the user activates the add or remove action
- **THEN** the environments store adds or removes the restaurant's membership in the selected environment and the action label updates accordingly

### Requirement: Dashboard lists the restaurant catalog

The dashboard SHALL list the restaurants from the shared catalog via `RestaurantCard`, each independently expandable to show its `OfferList`. It SHALL render `EnvironmentTabs` above the list and a "Manage environments" entry point that opens the environment editor. When "All" is selected the full catalog is shown; when a specific environment is selected the list is filtered client-side to that environment's members against the already-loaded catalog, with no extra restaurant fetch. All UI copy SHALL follow the design system content rules (sentence case, no exclamation points, no em-dashes, digits not spelled numbers).

#### Scenario: Lists all restaurants under "All"

- **WHEN** an authenticated user opens the dashboard with "All" selected
- **THEN** the store loads the catalog and a `RestaurantCard` is rendered for each restaurant

#### Scenario: Filters by selected environment

- **WHEN** the user selects a specific environment tab
- **THEN** the list is filtered to that environment's member restaurants from the already-loaded catalog, without fetching restaurants again

#### Scenario: Independent expansion

- **WHEN** the user expands one restaurant's offers
- **THEN** only that restaurant's offers load and expand, leaving other cards unchanged

#### Scenario: Copy follows content rules

- **WHEN** the dashboard and its cards render text
- **THEN** the copy is sentence case with no exclamation points, em-dashes, or emoji, and numbers are digits
