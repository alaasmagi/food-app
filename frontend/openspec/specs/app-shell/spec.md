# app-shell Specification

## Purpose
TBD - created by archiving change add-auth-bootstrap. Update Purpose after archive.
## Requirements
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

### Requirement: Dashboard behind the guard

The application SHALL provide `src/views/DashboardView.vue`, a route protected by the navigation guard. It is no longer an empty placeholder: it renders the restaurant catalog dashboard (behavior specified by the `restaurant-offers` capability). The route remains reachable only by an authenticated user.

#### Scenario: Reachable only when authenticated

- **WHEN** an authenticated user navigates to the dashboard route
- **THEN** the dashboard view renders the restaurant catalog

#### Scenario: Blocked when unauthenticated

- **WHEN** an unauthenticated user attempts to reach the dashboard route and cannot obtain a token
- **THEN** the guard redirects to the login flow instead of rendering the dashboard

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

### Requirement: Global toast host

The application SHALL provide a toast service - a Pinia `toasts` store exposing the active toasts and a `push({ title, description?, tone })` action with per-toast auto-dismiss and manual `dismiss(id)` - and a fixed-position `ToastHost` mounted at the app root that renders the active toasts using the ported `Toast` primitive. Any view SHALL be able to enqueue a transient notification without prop-drilling.

#### Scenario: Enqueue and render

- **WHEN** any code calls the toast store's `push(...)`
- **THEN** a `Toast` for it appears in the fixed-position host

#### Scenario: Dismissal

- **WHEN** a toast's auto-dismiss elapses or its close affordance is activated
- **THEN** that toast is removed from the host, leaving any others in place

### Requirement: Sidebar user row shows the first name

The app shell sidebar footer SHALL show the signed-in user's first name in the user row, to the left of the "Log out" button, on every shell-wrapped route. The first name SHALL be the first whitespace-separated word of the current user's `fullName`; when `fullName` is empty or whitespace only, the row SHALL show the user's `username`. When the current user has not been loaded yet, the shell SHALL load it through the auth store's `fetchCurrentUser()`. If loading fails, the row SHALL stay empty and the "Log out" button SHALL keep working.

#### Scenario: First name shown next to log out

- **WHEN** an authenticated user whose `fullName` is "Aleksander Example" views any shell-wrapped route
- **THEN** the sidebar user row shows "Aleksander" to the left of the "Log out" button

#### Scenario: Name shown without visiting Settings first

- **WHEN** the shell mounts and the auth store has no current user
- **THEN** the shell calls `fetchCurrentUser()` once and shows the first name after it resolves

#### Scenario: Already loaded user is not refetched

- **WHEN** the shell mounts and the auth store already has a current user
- **THEN** the shell does not call `fetchCurrentUser()` and shows that user's first name

#### Scenario: Fallback to username

- **WHEN** the current user's `fullName` is empty
- **THEN** the user row shows the user's `username`

#### Scenario: Loading the user fails

- **WHEN** `fetchCurrentUser()` rejects
- **THEN** the user row is empty and the "Log out" button still logs the user out

