# dining-environments Specification

## Purpose

Dining environments are user-owned groupings of restaurants used to filter the Dashboard and Map. This capability covers the environment API layer and its React Query hooks, the selected-environment client store, the environment tabs and editor dialog, restaurant membership add/remove, and the ported Tabs/Dialog/Input design-system primitives that these surfaces are built on.

## Requirements

### Requirement: Environment and membership types

The application SHALL provide `src/types/environment.ts` with hand-written TypeScript interfaces matching the backend Web DTOs: `DiningEnvironment` (with `id`, `concurrencyToken`, `name`, and nullable `description`) and `EnvironmentRestaurant` (with `id`, `concurrencyToken`, `environmentId`, and `restaurantId`). Membership SHALL be modeled as the first-class `EnvironmentRestaurant` join row so a restaurant is added or removed by creating or deleting one of these, keyed by its own id.

#### Scenario: Types mirror the backend DTOs

- **WHEN** an environment or membership payload is received from the backend
- **THEN** it is typed as `DiningEnvironment` or `EnvironmentRestaurant` with camelCase fields including `concurrencyToken`, with `description` nullable

### Requirement: Typed environment API layer

The application SHALL provide `src/api/environments.ts` routing every call through the shared authenticated `apiFetch`, exposing `getEnvironments()`, `createEnvironment(input)`, `updateEnvironment(id, input, concurrencyToken)`, `deleteEnvironment(id, concurrencyToken)`, `getEnvironmentRestaurants()`, `addRestaurantToEnvironment(environmentId, restaurantId)`, and `removeRestaurantFromEnvironment(joinId, concurrencyToken)`. Update and both delete operations SHALL send the `If-Match` header from the entity's concurrency token, and error responses SHALL be surfaced via the shared error handling rather than crashing.

#### Scenario: Environments CRUD through the shared wrapper

- **WHEN** `getEnvironments`, `createEnvironment`, `updateEnvironment`, or `deleteEnvironment` is called
- **THEN** it hits the matching `/api/v1/dining-environments` endpoint through `apiFetch`, sending `If-Match` on update and delete

#### Scenario: Membership is a first-class resource

- **WHEN** a restaurant is added to an environment
- **THEN** `addRestaurantToEnvironment` POSTs `{ environmentId, restaurantId }` to `/api/v1/environment-restaurants` and returns the created join row including its id and concurrency token

#### Scenario: Removal targets the join row with If-Match

- **WHEN** a restaurant is removed from an environment
- **THEN** `removeRestaurantFromEnvironment` issues `DELETE /api/v1/environment-restaurants/{joinId}` with the join row's concurrency token as `If-Match`

### Requirement: Environment React Query hooks

The application SHALL wrap the environment api layer in React Query hooks: `useEnvironments()` and `useEnvironmentRestaurants()` query hooks (server state is the React Query cache, not a hand-rolled store), plus mutation hooks for create, update, delete, add-membership, and remove-membership. Each mutation SHALL invalidate the affected query keys on success so the tabs and membership state reflect the change without a manual refetch.

#### Scenario: Lists come from React Query

- **WHEN** environments or memberships are needed by a component
- **THEN** they are read from `useEnvironments()` / `useEnvironmentRestaurants()`, caching the result so opening the Map after the Dashboard does not refetch

#### Scenario: Mutations invalidate their queries

- **WHEN** a create, update, delete, add-membership, or remove-membership mutation succeeds
- **THEN** the corresponding environments and/or memberships query is invalidated so the UI reflects the new state

#### Scenario: Forbidden response handled gracefully

- **WHEN** any environment query or mutation returns 403
- **THEN** the failure is surfaced to the user without an unhandled crash, leaving the rest of the screen usable

### Requirement: Selected-environment client store

The application SHALL provide a minimal Zustand store holding the currently selected environment id, where `null` means "All". This is pure client state, not server data. The store SHALL expose the selected id and an action to set it.

#### Scenario: Selecting an environment

- **WHEN** an environment is selected
- **THEN** the store records that environment id; selecting "All" sets it to `null`

#### Scenario: Selection drives filtering, not fetching

- **WHEN** the selected environment changes
- **THEN** only the client-side filtering of the already-loaded catalog changes; no restaurants request is issued as a result

### Requirement: Environment tabs

The application SHALL provide `src/components/environment/EnvironmentTabs.tsx` built on the ported `Tabs` primitive, rendering a fixed "All" tab followed by one tab per environment from `useEnvironments()`. Selecting a tab SHALL set the selected-environment store, and SHALL offer an affordance to open the environment editor dialog.

#### Scenario: All tab plus one per environment

- **WHEN** the user has environments
- **THEN** the tab row shows an "All" tab followed by one tab per environment

#### Scenario: Selecting a tab updates the store

- **WHEN** the user selects an environment tab
- **THEN** the selected-environment store updates to that environment's id, or to `null` for "All"

#### Scenario: Editing is reachable from the tabs

- **WHEN** the user activates the editor affordance in the tab row
- **THEN** the environment editor dialog opens

### Requirement: Environment editor dialog

The application SHALL provide `src/components/environment/EnvironmentEditorDialog.tsx` built on the ported `Dialog` and `Input` primitives, supporting create, rename, and delete of an environment. Delete SHALL require an explicit confirmation step inside the same dialog, never a native `Alert`/`confirm`-style shortcut that bypasses the dialog.

#### Scenario: Create an environment

- **WHEN** the user submits a new environment name (and optional description)
- **THEN** the create mutation is called and, on success, the new environment appears in the tab row

#### Scenario: Rename an environment

- **WHEN** the user edits an environment's name and saves
- **THEN** the update mutation is called with the environment's concurrency token as `If-Match`

#### Scenario: Delete requires in-dialog confirmation

- **WHEN** the user chooses to delete an environment
- **THEN** an explicit confirmation step is shown within the dialog before the delete mutation is called, with no native `Alert`/`confirm` shortcut

### Requirement: Restaurant membership action on the card

`RestaurantCard` SHALL show an "Add to environment" or "Remove from environment" action only when a specific environment (not "All") is selected. The action SHALL reflect the restaurant's current membership in the selected environment and toggle it via the add/remove mutations, removing by targeting the restaurant's join row id and concurrency token.

#### Scenario: Action hidden on All

- **WHEN** the selected environment is "All" (`null`)
- **THEN** no membership action is shown on any restaurant card

#### Scenario: Add when not a member

- **WHEN** a specific environment is selected and the restaurant is not in it
- **THEN** the card shows an "Add to environment" action that, when activated, adds the restaurant to that environment

#### Scenario: Remove when a member

- **WHEN** a specific environment is selected and the restaurant is already in it
- **THEN** the card shows a "Remove from environment" action that, when activated, removes the restaurant's membership using its join row id and concurrency token

### Requirement: Ported Tabs, Dialog, and Input primitives

The application SHALL port the `Tabs` (navigation), `Dialog` (feedback), and `Input` (forms) design-system components into `src/components/design-system/`, each derived from its own `.d.ts`, `.prompt.md`, and `.card.html` sources and re-expressed in React Native primitives with values from `src/theme/tokens.ts`. No app source SHALL import from the `alaasmagi-design-system/` folder at runtime.

#### Scenario: Primitives render natively

- **WHEN** `Tabs`, `Dialog`, or `Input` is rendered
- **THEN** it uses React Native primitives (View, Text, Pressable, Modal, TextInput) styled from token values, with prop names matching the design-system `.d.ts` contract

#### Scenario: No runtime dependency on the design system folder

- **WHEN** the app is built
- **THEN** no module imports from `alaasmagi-design-system/`
