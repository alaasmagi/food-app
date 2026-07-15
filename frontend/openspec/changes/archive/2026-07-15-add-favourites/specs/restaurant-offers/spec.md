## MODIFIED Requirements

### Requirement: Restaurant card

The application SHALL provide `src/components/restaurant/RestaurantCard.vue` composed from the `Card`, `Badge`, and `Tag` primitives. It SHALL show the restaurant name, offer time text, parking info, and opening info; a city `Tag`; a "Fast food" `Badge` when `isFastFood`; a "No offers today" `Badge` when `hasOffers` is false or the fetched offers list is empty; and a "See offers" `Button` that triggers the lazy offers fetch. When a specific dining environment (not "All") is selected, the card SHALL also show an "Add to environment" or "Remove from environment" action reflecting the restaurant's membership in that environment. When a favourite exists for the restaurant the card SHALL show a read-only `RatingStars`, and it SHALL show a "Rate" or "Edit rating" action that opens the favourite editor dialog.

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

#### Scenario: Shows rating when a favourite exists

- **WHEN** a favourite exists for the restaurant
- **THEN** the card shows a read-only `RatingStars` for the favourite's rating, and the action reads "Edit rating"; when no favourite exists the action reads "Rate"

#### Scenario: Opening the favourite editor

- **WHEN** the user activates the "Rate" or "Edit rating" action
- **THEN** the favourite editor dialog opens for that restaurant
