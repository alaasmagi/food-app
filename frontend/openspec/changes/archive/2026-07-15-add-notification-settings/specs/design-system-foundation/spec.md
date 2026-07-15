## ADDED Requirements

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
