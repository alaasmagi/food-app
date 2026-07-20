# app-shell Specification

## Purpose

Expo Router navigation shell with an auth-gated `(auth)` login route group and a `(tabs)` authenticated navigator (Dashboard, Map, Wheel, Settings), rendered dark-mode-first with safe-area handling. (Purpose is brief - refine as the capability grows.)

## Requirements

### Requirement: Auth-gated route structure

The app SHALL use Expo Router with an `(auth)` route group for the login screen and a `(tabs)` route group for the authenticated experience, gating access to `(tabs)` behind the auth state. The app SHALL additionally serve a public route `w/[id]` that is exempt from the auth gate: a logged-out visitor opening a shared-wheel link SHALL NOT be redirected to login, while `(tabs)` remains gated.

#### Scenario: Unauthenticated user sees login

- **WHEN** an unauthenticated user opens the app on a gated route
- **THEN** the `(auth)/login` screen is shown and the tab shell is not accessible

#### Scenario: Authenticated user sees tab shell

- **WHEN** an authenticated user opens the app
- **THEN** the `(tabs)` navigator is shown and the login screen is not accessible

#### Scenario: Public shared-wheel route bypasses the gate

- **WHEN** an unauthenticated visitor opens the `w/[id]` route
- **THEN** the auth gate allows it without redirecting to login, and the shared-wheel screen renders outside the tab shell

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

The app SHALL provide the Dashboard screen at `app/(tabs)/index.tsx` that renders once the user is authenticated. It SHALL present the shared restaurant catalog with today's offers (see the `restaurant-dashboard` capability), replacing the earlier empty placeholder.

#### Scenario: Dashboard renders after sign-in

- **WHEN** the user completes sign-in
- **THEN** the Dashboard screen renders within the tab shell without error

#### Scenario: Dashboard shows restaurant content

- **WHEN** the Dashboard loads and the restaurants query resolves
- **THEN** the shared restaurant catalog is shown rather than a static placeholder message
