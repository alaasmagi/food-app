## ADDED Requirements

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
