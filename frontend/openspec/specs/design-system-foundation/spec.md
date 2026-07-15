# design-system-foundation Specification

## Purpose
TBD - created by archiving change add-auth-bootstrap. Update Purpose after archive.
## Requirements
### Requirement: Design tokens are imported once at startup

The application SHALL copy the design system's `styles.css` and `tokens/*.css` (fonts, colors, typography, spacing) verbatim into `src/assets/tokens/` and import them exactly once from `main.ts`. No file in `src/` SHALL import, `@import`, or relative-path into `alaasmagi-design-system/`.

#### Scenario: Tokens available application-wide

- **WHEN** the app boots and `main.ts` has run
- **THEN** the design system's CSS custom properties (e.g. `--text-primary`, spacing and typography variables) are defined on the document and usable by any component via `var(--token-name)`

#### Scenario: No runtime reference to the authoring source

- **WHEN** the source tree is inspected for imports or `@import` statements
- **THEN** no path resolves into `alaasmagi-design-system/`; every token and component used at runtime lives under `src/`

### Requirement: Icon primitive is ported to Vue

The application SHALL provide `src/components/design-system/Icon.vue` that preserves the `IconName` union type from `Icon.d.ts` and renders each glyph as a 24x24 stroke-based icon. The component SHALL accept `name`, `size`, `strokeWidth`, and `color` props matching the `.d.ts` contract, defaulting `color` to `currentColor` so the glyph inherits parent text color.

#### Scenario: Renders a named glyph

- **WHEN** `Icon` is rendered with a `name` that is a member of `IconName`
- **THEN** the corresponding stroke glyph renders as an inline SVG that inherits the parent color unless `color` is set

#### Scenario: Spinner animates for loading states

- **WHEN** `Icon` is rendered with `name="spinner"`
- **THEN** the glyph self-animates (rotation) without any JavaScript timer

#### Scenario: Every icon name renders without error

- **WHEN** each member of the `IconName` union is passed as `name`
- **THEN** the component renders without throwing

### Requirement: Button primitive is ported to Vue

The application SHALL provide `src/components/design-system/forms/Button.vue` following the `Button.d.ts` prop contract: `variant` ("primary" | "secondary" | "ghost" | "danger"), `size` ("sm" | "md" | "lg"), `icon` (an `IconName`), `iconPosition` ("left" | "right"), `loading`, `disabled`, `fullWidth`, and `type`. Hover, press, and focus states SHALL be implemented as scoped CSS (`:hover`, `:active`, `:focus-visible`), not JavaScript event handlers. Slot content SHALL be used in place of React `children`, and clicks SHALL be exposed via native Vue `@click`.

#### Scenario: Renders each variant and size

- **WHEN** `Button` is rendered for each combination of `variant` and `size`
- **THEN** it renders without error using only `var(--token-name)` values for its styling

#### Scenario: Loading state replaces the icon and blocks interaction

- **WHEN** `Button` is rendered with `loading` true
- **THEN** a spinner is shown in place of the icon and the button does not emit click events

#### Scenario: Icon position honored

- **WHEN** `Button` is given an `icon` and `iconPosition="right"`
- **THEN** the icon renders after the slot content; with `iconPosition="left"` (the default) it renders before

#### Scenario: Interaction states are CSS-only

- **WHEN** the button is hovered, pressed, or focused
- **THEN** its visual state changes via scoped CSS pseudo-classes with no JS mouse/focus handlers driving the styling

### Requirement: Card primitive is ported to Vue

The application SHALL provide `src/components/design-system/data-display/Card.vue` following `Card.d.ts`: a neutral surface container one step brighter than the app background with a thin border and no shadow, accepting `padding` and `hoverable` props and default slot content. When `hoverable` is set, the hover treatment (darken surface, brighten border) SHALL be implemented as scoped CSS, not JS handlers.

#### Scenario: Renders slot content in a surface container

- **WHEN** `Card` is rendered with slot content
- **THEN** the content appears inside a bordered surface using `var(--token-name)` values

#### Scenario: Hover treatment is CSS-only

- **WHEN** `Card` has `hoverable` set and is hovered
- **THEN** its surface/border change via scoped `:hover` CSS with no JS mouse handlers

### Requirement: Badge primitive is ported to Vue

The application SHALL provide `src/components/design-system/data-display/Badge.vue` following `Badge.d.ts`: a small uppercase mono status label accepting `tone` ("neutral" | "accent" | "success" | "warning" | "danger"), an optional `icon` (an `IconName`), and default slot content. The built-in uppercase treatment is the one permitted exception to the sentence-case content rule.

#### Scenario: Renders each tone

- **WHEN** `Badge` is rendered for each `tone`
- **THEN** it renders without error using only `var(--token-name)` values

#### Scenario: Optional icon

- **WHEN** `Badge` is given an `icon`
- **THEN** the corresponding `Icon` glyph renders alongside the label

### Requirement: Tag primitive is ported to Vue

The application SHALL provide `src/components/design-system/data-display/Tag.vue` following `Tag.d.ts`: a pill-shaped chip for user-facing categorization accepting a `selected` state and an optional remove affordance, with default slot content. A remove action SHALL be exposed via a native Vue event, and the `selected` and hover states SHALL be scoped CSS.

#### Scenario: Renders a chip

- **WHEN** `Tag` is rendered with slot content
- **THEN** a pill chip renders using `var(--token-name)` values

#### Scenario: Selected look

- **WHEN** `Tag` has `selected` set
- **THEN** it shows the accent-tinted selected treatment via scoped CSS

#### Scenario: Removable chip emits on remove

- **WHEN** the tag exposes a remove affordance and it is activated
- **THEN** a native remove event is emitted for the parent to handle

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

### Requirement: Toast primitive is ported to Vue

The application SHALL provide `src/components/design-system/feedback/Toast.vue` following `Toast.d.ts`: a notification card with a `title`, optional `description`, a `tone` ("info" | "success" | "warning" | "danger"), and a `close` event (in place of React's `onClose`). Each tone SHALL show its corresponding ported `Icon` glyph, and hover/close states SHALL be scoped CSS. The component is the card only; the stack that positions and dismisses toasts is the app shell's concern.

#### Scenario: Renders each tone with its icon

- **WHEN** `Toast` is rendered for each `tone`
- **THEN** it shows the title, optional description, and the tone's icon using `var(--token-name)` values

#### Scenario: Emits close

- **WHEN** the toast's close affordance is activated
- **THEN** it emits `close`

### Requirement: Switch primitive is ported to Vue

The application SHALL provide `src/components/design-system/forms/Switch.vue` following `Switch.d.ts`: a toggle for a single on/off setting with an accent track when on, taking a `label` and `disabled`, bound with `v-model` (boolean) in place of React's `checked`/`onChange`. Track/thumb and disabled states SHALL be scoped CSS.

#### Scenario: Toggles via v-model

- **WHEN** the user activates the switch
- **THEN** it emits `update:modelValue` with the new boolean

#### Scenario: Disabled switch

- **WHEN** the switch is disabled
- **THEN** it does not toggle and shows the muted treatment

### Requirement: Checkbox primitive is ported to Vue

The application SHALL provide `src/components/design-system/forms/Checkbox.vue` following `Checkbox.d.ts`: a boolean toggle with an accent-filled checked state, taking a `label` and `disabled`, bound with `v-model` (boolean) in place of React's `checked`/`onChange`. Checked/hover/disabled states SHALL be scoped CSS.

#### Scenario: Toggles via v-model

- **WHEN** the user activates the checkbox
- **THEN** it emits `update:modelValue` with the new boolean

#### Scenario: Checked state

- **WHEN** the checkbox is checked
- **THEN** it shows the accent-filled checked treatment

### Requirement: Select primitive is ported to Vue

The application SHALL provide `src/components/design-system/forms/Select.vue` following `Select.d.ts`: a custom dropdown taking `label`, `options` (`{ value, label }[]`), `placeholder`, and `disabled`, bound with `v-model` (string) in place of React's `value`/`onChange`. Clicking opens a floating option list; the selected option shows a checkmark. Open/hover/disabled states SHALL be scoped CSS, and `disabled` SHALL prevent opening.

#### Scenario: Selects via v-model

- **WHEN** the user opens the select and chooses an option
- **THEN** it emits `update:modelValue` with that option's value and closes the list

#### Scenario: Placeholder when nothing is selected

- **WHEN** no option matches the current value
- **THEN** the trigger shows the placeholder text

#### Scenario: Disabled does not open

- **WHEN** the select is disabled and activated
- **THEN** the option list does not open
