## ADDED Requirements

### Requirement: Global toast host

The application SHALL provide a toast service - a Pinia `toasts` store exposing the active toasts and a `push({ title, description?, tone })` action with per-toast auto-dismiss and manual `dismiss(id)` - and a fixed-position `ToastHost` mounted at the app root that renders the active toasts using the ported `Toast` primitive. Any view SHALL be able to enqueue a transient notification without prop-drilling.

#### Scenario: Enqueue and render

- **WHEN** any code calls the toast store's `push(...)`
- **THEN** a `Toast` for it appears in the fixed-position host

#### Scenario: Dismissal

- **WHEN** a toast's auto-dismiss elapses or its close affordance is activated
- **THEN** that toast is removed from the host, leaving any others in place
