## ADDED Requirements

### Requirement: Typed wheels API layer

The application SHALL provide `src/api/wheels.ts` routing through the shared bearer fetch wrapper, with a `UserWheel` type matching `UserWheelDto` (id, concurrencyToken, name, restaurantNames, isPublic). It SHALL expose `getWheels()` (`GET /api/v1/user-wheels`), `createWheel(name, restaurantNames, isPublic)` (`POST`), `updateWheel(id, input, concurrencyToken)` (`PUT`, If-Match), and `deleteWheel(id, concurrencyToken)` (`DELETE`, If-Match).

#### Scenario: List wheels

- **WHEN** `getWheels()` is called
- **THEN** it issues a bearer-authorized `GET /api/v1/user-wheels` and resolves to an array of `UserWheel`

#### Scenario: Mutations send If-Match

- **WHEN** `updateWheel` or `deleteWheel` is called
- **THEN** it targets `/api/v1/user-wheels/{id}` with the wheel's concurrency token as `If-Match`

### Requirement: Wheels store

The application SHALL provide a Pinia `wheels` store holding the user's saved wheels list, loaded once, with `createWheel`/`updateWheel`/`deleteWheel` actions that keep the list in sync (sending `If-Match` from the stored token on update and delete).

#### Scenario: Loaded once

- **WHEN** the wheels list is requested and already cached
- **THEN** the store returns the cached list without another request

#### Scenario: Mutations keep the list in sync

- **WHEN** a wheel is created, updated, or deleted
- **THEN** the store's list reflects the change from the API response

### Requirement: Wheel editor dialog

The application SHALL provide `src/components/wheel/WheelEditorDialog.vue` built on `Dialog`, `Input` (name), a searchable `Checkbox` list over the already-loaded restaurant catalog, and a `Switch` for `isPublic`. The saved `restaurantNames` SHALL be a frozen snapshot of the checked restaurants' `name` values (not restaurant ids), matching the backend rule. No separate restaurant fetch SHALL be made.

#### Scenario: Build a wheel from checked restaurants

- **WHEN** the user names a wheel and checks restaurants
- **THEN** the wheel is saved with `restaurantNames` equal to the checked restaurants' names, and `isPublic` from the switch

#### Scenario: Search filters the checkbox list

- **WHEN** the user types in the search input
- **THEN** the checkbox list filters to matching restaurants from the already-loaded catalog, without a network request

#### Scenario: Names are a frozen snapshot

- **WHEN** a wheel is saved
- **THEN** it stores restaurant names, not ids, so later catalog changes do not alter the saved wheel

### Requirement: Wheel spinner

The application SHALL provide `src/components/wheel/WheelSpinner.vue`, a bespoke SVG spinning wheel (not a design-system primitive) that renders one segment per name in `restaurantNames`, styled only with `var(--token-name)` references (no hardcoded colors). Its `spin()` SHALL animate to a randomly chosen name via a CSS transition and then emit the chosen result. Random selection SHALL be client-side over the frozen names, with no backend call.

#### Scenario: Renders a segment per name

- **WHEN** the spinner renders for a wheel
- **THEN** it draws one segment per name in `restaurantNames` using only token colors

#### Scenario: Spin picks and emits a result

- **WHEN** the user spins
- **THEN** the wheel animates and, when it settles, emits the randomly chosen name

#### Scenario: Selection is client-side

- **WHEN** a spin resolves
- **THEN** the chosen name is picked locally with no backend request

### Requirement: Wheel view and route

The application SHALL provide `src/views/WheelView.vue` on a new guarded `/wheel` route: a list of saved wheels (a `Card` per wheel with "Spin", "Edit", and "Delete" actions), where selecting a wheel shows its `WheelSpinner`, and a "New wheel" action opens the editor dialog. All copy SHALL follow the design system content rules.

#### Scenario: Lists saved wheels

- **WHEN** an authenticated user opens `/wheel`
- **THEN** the store loads the wheels and a card is rendered per wheel with spin, edit, and delete actions

#### Scenario: Selecting a wheel shows its spinner

- **WHEN** the user selects a wheel to spin
- **THEN** its `WheelSpinner` is shown for that wheel's names

#### Scenario: New wheel opens the editor

- **WHEN** the user activates "New wheel"
- **THEN** the wheel editor dialog opens
