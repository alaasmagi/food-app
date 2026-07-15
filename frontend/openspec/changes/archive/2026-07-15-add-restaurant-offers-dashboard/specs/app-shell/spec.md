## RENAMED Requirements

- FROM: `### Requirement: Dashboard placeholder behind the guard`
- TO: `### Requirement: Dashboard behind the guard`

## MODIFIED Requirements

### Requirement: Dashboard behind the guard

The application SHALL provide `src/views/DashboardView.vue`, a route protected by the navigation guard. It is no longer an empty placeholder: it renders the restaurant catalog dashboard (behavior specified by the `restaurant-offers` capability). The route remains reachable only by an authenticated user.

#### Scenario: Reachable only when authenticated

- **WHEN** an authenticated user navigates to the dashboard route
- **THEN** the dashboard view renders the restaurant catalog

#### Scenario: Blocked when unauthenticated

- **WHEN** an unauthenticated user attempts to reach the dashboard route and cannot obtain a token
- **THEN** the guard redirects to the login flow instead of rendering the dashboard
