## ADDED Requirements

### Requirement: Auth-gated route structure

The app SHALL use Expo Router with an `(auth)` route group for the login screen and a `(tabs)` route group for the authenticated experience, gating access to `(tabs)` behind the auth state.

#### Scenario: Unauthenticated user sees login

- **WHEN** an unauthenticated user opens the app
- **THEN** the `(auth)/login` screen is shown and the tab shell is not accessible

#### Scenario: Authenticated user sees tab shell

- **WHEN** an authenticated user opens the app
- **THEN** the `(tabs)` navigator is shown and the login screen is not accessible

### Requirement: Login screen

The app SHALL provide a minimal dark login screen at `app/(auth)/login.tsx` with a single "Log in" Button that starts the OAuth flow.

#### Scenario: Login button starts OAuth

- **WHEN** the user taps the "Log in" Button on the login screen
- **THEN** the OAuth PKCE sign-in flow starts

### Requirement: Authenticated tab navigator

The app SHALL provide a tab navigator at `app/(tabs)/_layout.tsx` with Dashboard, Map, Wheel, and Settings tabs, rendered in the dark theme and respecting safe-area insets.

#### Scenario: Tabs render in dark theme

- **WHEN** the authenticated tab shell is displayed
- **THEN** the Dashboard, Map, Wheel, and Settings tabs are visible using dark-theme tokens and safe-area insets are respected on notched devices

#### Scenario: Default tab is Dashboard

- **WHEN** the tab shell first loads after sign-in
- **THEN** the Dashboard tab is the active tab

### Requirement: Placeholder Dashboard screen

The app SHALL provide a placeholder Dashboard screen at `app/(tabs)/index.tsx` that renders once the user is authenticated, proving the authed flow works end to end.

#### Scenario: Dashboard renders after sign-in

- **WHEN** the user completes sign-in
- **THEN** the placeholder Dashboard screen renders within the tab shell without error
