## MODIFIED Requirements

### Requirement: Placeholder Dashboard screen

The app SHALL provide the Dashboard screen at `app/(tabs)/index.tsx` that renders once the user is authenticated. It SHALL present the shared restaurant catalog with today's offers (see the `restaurant-dashboard` capability), replacing the earlier empty placeholder.

#### Scenario: Dashboard renders after sign-in

- **WHEN** the user completes sign-in
- **THEN** the Dashboard screen renders within the tab shell without error

#### Scenario: Dashboard shows restaurant content

- **WHEN** the Dashboard loads and the restaurants query resolves
- **THEN** the shared restaurant catalog is shown rather than a static placeholder message
