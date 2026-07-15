## ADDED Requirements

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
