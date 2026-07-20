## ADDED Requirements

### Requirement: Typed theme tokens

The app SHALL define a typed theme object at `src/theme/tokens.ts` ported once from the design system's `tokens/*.css` (colors, fonts, spacing, typography), converting each `--token-name` to a camelCase key with the same literal value. Components SHALL read style values only from this theme object and SHALL NOT import the design system's CSS or reference the `alaasmagi-design-system/` folder at runtime.

#### Scenario: Tokens available to components

- **WHEN** a component needs a color, font, spacing, or typography value
- **THEN** it reads the value from `src/theme/tokens.ts` rather than using an inline literal or importing a design system file

#### Scenario: Dark-mode-first values

- **WHEN** the theme tokens are consumed
- **THEN** they provide the design system's dark default values (the app's only theme)

### Requirement: Ported Icon component

The app SHALL provide a React Native Icon component at `src/components/design-system/` ported from the design system's Icon (`Icon.d.ts` prop contract, `Icon.prompt.md` usage, `icon.card.html` visual reference), rendering with React Native primitives and the dark icon asset set copied into the app's own assets.

#### Scenario: Icon renders a named glyph

- **WHEN** the Icon component is rendered with a valid icon name
- **THEN** it displays the corresponding dark-set icon at the requested size and color from the theme tokens

### Requirement: Ported Button component

The app SHALL provide a React Native Button component at `src/components/design-system/` ported from the design system's Button (`Button.d.ts` prop contract 1:1, `Button.prompt.md` usage, `button.card.html` visual reference), using Pressable with `onPress`, supporting the design system's variants/sizes, and matching the card's visual result with native mechanics.

#### Scenario: Button responds to press

- **WHEN** the user presses an enabled Button
- **THEN** its `onPress` handler is invoked and the pressed state is reflected visually

#### Scenario: Disabled Button does not fire

- **WHEN** a disabled Button is pressed
- **THEN** `onPress` is not invoked

#### Scenario: Button variants render

- **WHEN** the Button is rendered in each supported variant and size
- **THEN** it renders using the corresponding theme tokens matching the design system's visual reference
