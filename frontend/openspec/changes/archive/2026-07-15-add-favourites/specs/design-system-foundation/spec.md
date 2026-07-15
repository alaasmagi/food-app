## ADDED Requirements

### Requirement: Toast primitive is ported to Vue

The application SHALL provide `src/components/design-system/feedback/Toast.vue` following `Toast.d.ts`: a notification card with a `title`, optional `description`, a `tone` ("info" | "success" | "warning" | "danger"), and a `close` event (in place of React's `onClose`). Each tone SHALL show its corresponding ported `Icon` glyph, and hover/close states SHALL be scoped CSS. The component is the card only; the stack that positions and dismisses toasts is the app shell's concern.

#### Scenario: Renders each tone with its icon

- **WHEN** `Toast` is rendered for each `tone`
- **THEN** it shows the title, optional description, and the tone's icon using `var(--token-name)` values

#### Scenario: Emits close

- **WHEN** the toast's close affordance is activated
- **THEN** it emits `close`
