## MODIFIED Requirements

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
