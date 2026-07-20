## ADDED Requirements

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
