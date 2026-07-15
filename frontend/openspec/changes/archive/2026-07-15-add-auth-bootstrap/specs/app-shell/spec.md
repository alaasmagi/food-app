## ADDED Requirements

### Requirement: Router guards protected routes

The application SHALL configure Vue Router with a navigation guard that, before entering a protected route, silently calls `fetchToken()` when the auth store is empty. If the user is still unauthenticated after that attempt, the guard SHALL redirect to the in-app login view, from which the backend login flow is initiated by a full-page navigation.

#### Scenario: Empty store triggers silent token fetch

- **WHEN** navigation to a protected route begins and the auth store has no token
- **THEN** the guard calls `fetchToken()` before deciding whether to allow entry

#### Scenario: Authenticated user proceeds

- **WHEN** the guard runs and the auth store is authenticated
- **THEN** navigation to the protected route proceeds

#### Scenario: Unauthenticated user redirected to login

- **WHEN** the guard runs, the silent token fetch does not authenticate the user
- **THEN** the guard redirects to the in-app login view instead of entering the protected route

### Requirement: Login view

The application SHALL provide `src/views/LoginView.vue`, shown when the user is unauthenticated, containing a single "Log in" `Button` that triggers the login navigation to the backend login flow with the current URL as `returnUrl`.

#### Scenario: Login button starts the flow

- **WHEN** the user clicks the "Log in" button on the login view
- **THEN** the browser navigates full-page to `https://api.<domain>/account/login?returnUrl=<current-url>`

#### Scenario: Copy follows content rules

- **WHEN** the login view renders its button and text
- **THEN** the copy is sentence case with no exclamation points, em-dashes, or emoji

### Requirement: Dashboard placeholder behind the guard

The application SHALL provide `src/views/DashboardView.vue`, an empty placeholder route protected by the navigation guard, sufficient only to prove the auth flow reaches an authenticated view. Actual dashboard content is out of scope for this change.

#### Scenario: Reachable only when authenticated

- **WHEN** an authenticated user navigates to the dashboard route
- **THEN** the placeholder view renders

#### Scenario: Blocked when unauthenticated

- **WHEN** an unauthenticated user attempts to reach the dashboard route and cannot obtain a token
- **THEN** the guard redirects to the login flow instead of rendering the dashboard

### Requirement: Minimal app shell layout

The application SHALL provide a minimal dark-theme layout with a header showing the app name and a logout button built from the ported `Button` and `Icon` components. The shell SHALL default to the design system's dark theme with no light-mode toggle.

#### Scenario: Header renders app name and logout

- **WHEN** an authenticated user views any shell-wrapped route
- **THEN** the header shows the app name and a logout button using the ported `Button` and `Icon`

#### Scenario: Logout from the header

- **WHEN** the user activates the logout button in the header
- **THEN** the auth store's `logout()` runs, clearing the token and navigating full-page to the backend logout URL

#### Scenario: Dark theme only

- **WHEN** the shell renders
- **THEN** it uses the design system's default dark token values and exposes no light-mode toggle
