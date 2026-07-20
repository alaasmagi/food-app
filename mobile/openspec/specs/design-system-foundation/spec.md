# design-system-foundation Specification

## Purpose

Foundation for porting the alaasmagi design system into React Native: a typed dark-mode-first theme token object plus the first ported primitives (Icon, Button) that read only from those tokens and never reference the design system folder at runtime. (Purpose is brief - refine as the capability grows.)

## Requirements

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

### Requirement: Ported Card component

The app SHALL provide a React Native Card component at `src/components/design-system/data-display/` ported 1:1 from the design system's Card (`Card.d.ts` prop contract, `Card.prompt.md` usage, `card.card.html` visual reference): a `surfaceCard` container with a 1px `borderSubtle` border, `radius.lg` corners, and no shadow (depth from surface color), accepting `children`, a `padding` prop (default 20), and an optional `hoverable`/pressed emphasis for clickable cards.

#### Scenario: Card renders content

- **WHEN** the Card is rendered with children
- **THEN** it displays them in a `surfaceCard` container with a subtle border and `radius.lg` corners, reading all values from theme tokens

### Requirement: Ported Badge component

The app SHALL provide a React Native Badge component at `src/components/design-system/data-display/` ported 1:1 from the design system's Badge (`Badge.d.ts`, `Badge.prompt.md`, `badge.card.html`): an uppercase mono status label with a `tone` prop (`neutral | accent | success | warning | danger`, default `neutral`) mapping to the tone's background/foreground tokens, an optional leading `icon` whose color is set explicitly to the tone foreground.

#### Scenario: Badge tones render

- **WHEN** the Badge is rendered in each tone
- **THEN** it uses that tone's background and foreground tokens with uppercase mono text

#### Scenario: Badge with icon

- **WHEN** a Badge is given an `icon`
- **THEN** the icon renders leading the text using the tone's foreground color

### Requirement: Ported Tag component

The app SHALL provide a React Native Tag component at `src/components/design-system/data-display/` ported 1:1 from the design system's Tag (`Tag.d.ts`, `Tag.prompt.md`, `tag.card.html`): a full-pill chip for user-facing categorization with `children`, a `selected` prop (accent-tinted look, default false), and an optional `onRemove` that renders a trailing pressable `x` icon.

#### Scenario: Tag renders as a pill

- **WHEN** the Tag is rendered
- **THEN** it displays as a `radius.full` pill using body font, with default or accent-tinted `selected` colors from tokens

#### Scenario: Removable tag

- **WHEN** a Tag is given `onRemove` and the user presses its trailing `x`
- **THEN** `onRemove` is invoked
