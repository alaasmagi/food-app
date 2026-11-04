## ADDED Requirements

### Requirement: Restaurant markers use the design system marker

Each restaurant marker on the map SHALL be rendered with the ported design-system `MapMarker`: a pill showing the restaurant name, with a tail whose tip sits on the restaurant's coordinate. A restaurant whose `hasOffers` is true SHALL use the offers style (accent pill with the `utensils` icon and a visually hidden ", lunch offers today" suffix). A restaurant whose `hasOffers` is false SHALL use the plain style (neutral bordered pill, no icon). The marker whose popup is open SHALL use the selected state, and SHALL return to the default state when the popup closes.

#### Scenario: Restaurant with offers

- **WHEN** the map renders a restaurant whose `hasOffers` is true
- **THEN** its marker is the offers pill with the `utensils` icon and the restaurant name, and its accessible text includes ", lunch offers today"

#### Scenario: Restaurant without offers

- **WHEN** the map renders a restaurant whose `hasOffers` is false
- **THEN** its marker is the plain pill with the restaurant name and no icon

#### Scenario: Selected while the popup is open

- **WHEN** the user opens a marker's popup
- **THEN** that marker shows the selected state until the popup closes

### Requirement: Overlapping markers collapse to place dots

When marker pills would overlap on screen, the map SHALL keep full pills in priority order and render each remaining marker as the design-system place dot (`MapDot kind="place"`) at its coordinate. Priority SHALL be: the selected marker first, then restaurants with offers, then the rest, each group in list order. The check SHALL run again after markers are rendered and after every zoom. A collapsed dot SHALL keep the restaurant name as its accessible name and SHALL open the same popup on click.

#### Scenario: Two pills would overlap

- **WHEN** a restaurant without offers would overlap the pill of a restaurant with offers
- **THEN** the restaurant with offers keeps its pill and the other is shown as a place dot

#### Scenario: Zooming in makes room

- **WHEN** the user zooms in until a collapsed marker's pill no longer overlaps any kept pill
- **THEN** that marker is shown as a full pill again

#### Scenario: Collapsed dot opens the popup

- **WHEN** the user clicks a collapsed place dot
- **THEN** the restaurant's popup opens and its marker is shown as a selected pill

### Requirement: Map legend uses the design system legend

The map SHALL show the ported design-system `MapLegend` in its bottom-right corner, displaying an offers marker labelled "Lunch offers today" and a plain marker labelled "No offers today".

#### Scenario: Legend shows both marker styles

- **WHEN** the map renders
- **THEN** the legend shows an offers marker with the `utensils` icon labelled "Lunch offers today" and a plain marker labelled "No offers today"

### Requirement: User location uses the design system dot

When the user's position is known, the map SHALL mark it with the ported design-system `MapDot kind="user"`, labelled "Your location". It SHALL not be interactive.

#### Scenario: Position known

- **WHEN** geolocation returns the user's position
- **THEN** the map shows a user dot labelled "Your location" at that position

### Requirement: Truncation hint uses the design system hint

When the map shows only the closest restaurants, it SHALL show the ported design-system `MapHint` (info icon) in its bottom-left corner with the text "Showing the closest restaurants. Zoom in to see more."

#### Scenario: Result set is truncated

- **WHEN** the restaurant set for the viewport is truncated
- **THEN** the map shows the hint with the info icon and the text "Showing the closest restaurants. Zoom in to see more."
