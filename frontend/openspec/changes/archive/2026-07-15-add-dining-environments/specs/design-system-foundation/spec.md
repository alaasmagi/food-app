## ADDED Requirements

### Requirement: Tabs primitive is ported to Vue

The application SHALL provide `src/components/design-system/navigation/Tabs.vue` following `Tabs.d.ts`: an underlined tab row taking a `tabs` array of `{ value, label }` with an accent indicator on the active tab. Selection SHALL use the Vue `v-model` idiom (`modelValue` + `update:modelValue`) in place of React's `value`/`onChange`, and the active-indicator/hover states SHALL be scoped CSS.

#### Scenario: Renders a tab per item

- **WHEN** `Tabs` is given a `tabs` array
- **THEN** it renders one tab per item using its `label`, marking the active one

#### Scenario: Selection via v-model

- **WHEN** the user activates a tab
- **THEN** the component emits `update:modelValue` with that tab's `value`

### Requirement: Dialog primitive is ported to Vue

The application SHALL provide `src/components/design-system/feedback/Dialog.vue` following `Dialog.d.ts`: a modal with overlay, optional `title`, default slot body, and a `footer` slot for actions, controlled by an `open` prop and a `close` event (in place of React's `onClose`). The open/close transition SHALL use a Vue `<Transition>` or CSS, not JS handlers.

#### Scenario: Open and close

- **WHEN** `Dialog` has `open` true
- **THEN** the overlay, title, body slot, and footer slot render; when the overlay or a close affordance is activated it emits `close`

#### Scenario: Hidden when closed

- **WHEN** `open` is false
- **THEN** the dialog content is not rendered

### Requirement: Input primitive is ported to Vue

The application SHALL provide `src/components/design-system/forms/Input.vue` following `Input.d.ts`: a text field supporting `label`, `placeholder`, `icon`, `hint`, `error`, `disabled`, `size` ("sm" | "md"), and `multiline`/`rows` (rendering a `<textarea>`), bound with `v-model` in place of React's `value`/`onChange`. Focus, error, and disabled states SHALL be scoped CSS; `error` overrides `hint`.

#### Scenario: Binds with v-model

- **WHEN** the user types into the field
- **THEN** the component emits `update:modelValue` with the current value

#### Scenario: Multiline renders a textarea

- **WHEN** `multiline` is set
- **THEN** a `<textarea>` is rendered instead of an `<input>`

#### Scenario: Error overrides hint

- **WHEN** both `hint` and `error` are provided
- **THEN** the error message is shown and the field takes the danger treatment via scoped CSS
