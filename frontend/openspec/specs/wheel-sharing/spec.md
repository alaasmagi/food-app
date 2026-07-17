# wheel-sharing Specification

## Purpose
TBD - created by syncing change add-wheel-sharing. Update Purpose after archive.
## Requirements
### Requirement: Public wheel API without authentication

The application SHALL provide `src/api/publicWheels.ts` with `getPublicWheel(id)` calling `GET /api/v1/public/wheels/{id}`. This call SHALL bypass the authenticated `apiFetch` wrapper: it SHALL use a raw `fetch` with no `Authorization` header and no 401 token-refresh retry, so it works for a logged-out visitor. It SHALL resolve to a `PublicWheel` (`id`, `name`, `restaurantNames`) on success, report a 404 distinctly (so callers can show a not-found state), and reject on other non-ok responses. The `PublicWheel` type SHALL NOT include `concurrencyToken` or `isPublic`.

#### Scenario: Fetch a public wheel without a token

- **WHEN** `getPublicWheel(id)` is called
- **THEN** it issues a `GET /api/v1/public/wheels/{id}` with no `Authorization` header and does not attempt a token refresh, and resolves to a `PublicWheel`

#### Scenario: Missing wheel is reported distinctly

- **WHEN** the endpoint responds 404
- **THEN** `getPublicWheel` reports a not-found result to the caller rather than throwing a generic error

#### Scenario: Other failures reject

- **WHEN** the endpoint responds with a non-ok status other than 404
- **THEN** `getPublicWheel` rejects so the caller can handle the failure

### Requirement: Public shared-wheel view and route

The application SHALL provide `src/views/SharedWheelView.vue` on a public route `/w/:id` that is exempt from the auth navigation guard. The route SHALL be marked with `meta.public` so the guard skips authentication and the view renders without the authenticated app chrome. The view SHALL load the wheel via `getPublicWheel`, show the wheel's name and the existing `WheelSpinner` fed the wheel's `restaurantNames`, and on a not-found result SHALL show a simple "This wheel isn't available" message rather than a generic error page. All copy SHALL follow the design system content rules.

#### Scenario: Logged-out visitor opens a shared wheel

- **WHEN** an unauthenticated visitor navigates to `/w/:id` for an existing public wheel
- **THEN** the auth guard allows the route, and the view shows the wheel name and a `WheelSpinner` for its names

#### Scenario: Not-found shows a friendly message

- **WHEN** the wheel cannot be found (404)
- **THEN** the view shows "This wheel isn't available" instead of a generic error page or a login redirect

#### Scenario: Public route bypasses the guard

- **WHEN** the auth guard evaluates the `/w/:id` route
- **THEN** it allows navigation without attempting a token fetch, because the route is `meta.public`

### Requirement: Copy share-link behaviour

The application SHALL provide a reusable share-link behaviour (a composable, e.g. `src/composables/useShareWheelLink.ts`) exposing a copy action that builds the link as `window.location.origin` + `/w/` + the wheel id, writes it to the clipboard via `navigator.clipboard`, and on success pushes a "Link copied" success toast. On a clipboard failure it SHALL surface a danger toast rather than throwing. This behaviour SHALL be reused by the wheel editor dialog and the wheel view.

#### Scenario: Copy writes the origin-based link and confirms

- **WHEN** the copy action runs for a wheel id
- **THEN** it writes `window.location.origin + '/w/' + id` to the clipboard and pushes a "Link copied" success toast

#### Scenario: Clipboard failure is surfaced, not thrown

- **WHEN** writing to the clipboard rejects
- **THEN** a danger toast is shown and no error propagates to the caller
