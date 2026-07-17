## MODIFIED Requirements

### Requirement: Wheel editor dialog

The application SHALL provide `src/components/wheel/WheelEditorDialog.vue` built on `Dialog`, `Input` (name), a searchable `Checkbox` list over the already-loaded restaurant catalog, and a `Switch` for `isPublic`. The saved `restaurantNames` SHALL be a frozen snapshot of the checked restaurants' `name` values (not restaurant ids), matching the backend rule. No separate restaurant fetch SHALL be made. When the wheel being edited already exists (has an id) and its `isPublic` is on, the dialog SHALL show a "Copy share link" action next to the `Switch` that invokes the shared copy-share-link behaviour for that wheel; a new, not-yet-saved wheel SHALL NOT show the action.

#### Scenario: Build a wheel from checked restaurants

- **WHEN** the user names a wheel and checks restaurants
- **THEN** the wheel is saved with `restaurantNames` equal to the checked restaurants' names, and `isPublic` from the switch

#### Scenario: Search filters the checkbox list

- **WHEN** the user types in the search input
- **THEN** the checkbox list filters to matching restaurants from the already-loaded catalog, without a network request

#### Scenario: Names are a frozen snapshot

- **WHEN** a wheel is saved
- **THEN** it stores restaurant names, not ids, so later catalog changes do not alter the saved wheel

#### Scenario: Copy share link for a saved public wheel

- **WHEN** the dialog is editing an existing wheel whose `isPublic` is on
- **THEN** a "Copy share link" action is shown next to the public switch, and activating it copies the wheel's share link and confirms with a toast

#### Scenario: No share action for an unsaved wheel

- **WHEN** the dialog is creating a new wheel that has not been saved yet
- **THEN** no "Copy share link" action is shown, even if the public switch is on

### Requirement: Wheel view and route

The application SHALL provide `src/views/WheelView.vue` on a new guarded `/wheel` route: a list of saved wheels (a `Card` per wheel with "Spin", "Edit", and "Delete" actions), where selecting a wheel shows its `WheelSpinner`, and a "New wheel" action opens the editor dialog. Each wheel whose `isPublic` is true SHALL additionally show a share action on its card that invokes the shared copy-share-link behaviour, so a user can copy the link without reopening the editor. All copy SHALL follow the design system content rules.

#### Scenario: Lists saved wheels

- **WHEN** an authenticated user opens `/wheel`
- **THEN** the store loads the wheels and a card is rendered per wheel with spin, edit, and delete actions

#### Scenario: Selecting a wheel shows its spinner

- **WHEN** the user selects a wheel to spin
- **THEN** its `WheelSpinner` is shown for that wheel's names

#### Scenario: New wheel opens the editor

- **WHEN** the user activates "New wheel"
- **THEN** the wheel editor dialog opens

#### Scenario: Public wheel card offers a share action

- **WHEN** a wheel in the list has `isPublic` true
- **THEN** its card shows a share action that copies the wheel's share link and confirms with a toast, without opening the editor

#### Scenario: Non-public wheel card has no share action

- **WHEN** a wheel in the list has `isPublic` false
- **THEN** its card shows no share action
