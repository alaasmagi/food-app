## MODIFIED Requirements

### Requirement: Minimal app shell layout

The application SHALL provide a minimal dark-theme layout with a header showing the app name, primary navigation links (Dashboard, Wheel, Settings) using Vue Router, and a logout button built from the ported `Button` and `Icon` components. The shell SHALL default to the design system's dark theme with no light-mode toggle. Guarded `/wheel` and `/settings` routes SHALL be registered alongside the dashboard route.

#### Scenario: Header renders app name, nav, and logout

- **WHEN** an authenticated user views any shell-wrapped route
- **THEN** the header shows the app name, navigation links to the dashboard, the wheel, and settings, and a logout button using the ported `Button` and `Icon`

#### Scenario: Navigating to the wheel

- **WHEN** the user activates the "Wheel" nav link
- **THEN** the router navigates to the guarded `/wheel` route

#### Scenario: Navigating to settings

- **WHEN** the user activates the "Settings" nav link
- **THEN** the router navigates to the guarded `/settings` route

#### Scenario: Logout from the header

- **WHEN** the user activates the logout button in the header
- **THEN** the auth store's `logout()` runs, clearing the token and navigating full-page to the backend logout URL

#### Scenario: Dark theme only

- **WHEN** the shell renders
- **THEN** it uses the design system's default dark token values and exposes no light-mode toggle
