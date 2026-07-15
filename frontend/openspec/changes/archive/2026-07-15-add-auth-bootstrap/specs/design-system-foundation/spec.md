## ADDED Requirements

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
