# dining-environments Specification

## Purpose
TBD - created by syncing change add-dining-environments. Update Purpose after archive.
## Requirements
### Requirement: Typed environment API layer

The application SHALL provide `src/api/environments.ts` routing every call through the shared bearer fetch wrapper, with hand-written types matching the backend Web DTOs (`DiningEnvironment` <- `DiningEnvironmentDto`, `EnvironmentRestaurant` <- `EnvironmentRestaurantDto`). It SHALL expose `getEnvironments()`, `createEnvironment()`, `updateEnvironment()`, `deleteEnvironment()`, `getEnvironmentRestaurants()`, `addRestaurantToEnvironment(environmentId, restaurantId)`, and `removeRestaurantFromEnvironment(joinId, concurrencyToken)`. Update and both delete operations SHALL send the `If-Match` header from the entity's concurrency token.

#### Scenario: Environments CRUD

- **WHEN** `getEnvironments`, `createEnvironment`, `updateEnvironment`, or `deleteEnvironment` is called
- **THEN** it hits the matching `/api/v1/dining-environments` endpoint through the shared wrapper, sending `If-Match` on update and delete

#### Scenario: Membership is a first-class resource

- **WHEN** a restaurant is added to an environment
- **THEN** `addRestaurantToEnvironment` POSTs `{ environmentId, restaurantId }` to `/api/v1/environment-restaurants` and returns the created join row including its id and concurrency token

#### Scenario: Removal targets the join row with If-Match

- **WHEN** a restaurant is removed from an environment
- **THEN** `removeRestaurantFromEnvironment` issues `DELETE /api/v1/environment-restaurants/{joinId}` with the join row's concurrency token as `If-Match`

### Requirement: Environments store

The application SHALL provide a Pinia `environments` store holding the user's environments list, the currently selected environment id (or null meaning "all restaurants"), and per-environment membership modeled as `restaurantId -> { joinId, concurrencyToken }`. Membership SHALL retain each join row's id and token so a restaurant can be removed by targeting its join row.

#### Scenario: Selecting an environment

- **WHEN** an environment is selected
- **THEN** the store records the selected environment id; selecting "all" sets it to null

#### Scenario: Membership lookup

- **WHEN** the store is asked whether a restaurant belongs to the selected environment
- **THEN** it answers from the per-environment membership map without a network call

#### Scenario: Add updates membership from the created join row

- **WHEN** a restaurant is added to an environment
- **THEN** the store records `restaurantId -> { joinId, concurrencyToken }` from the API response

#### Scenario: Remove clears membership

- **WHEN** a restaurant is removed from an environment
- **THEN** the store deletes that restaurant's membership entry after the join row is deleted

### Requirement: Environment tabs

The application SHALL provide `src/components/environment/EnvironmentTabs.vue` built on the ported `Tabs`, rendering one tab per environment plus a fixed "All" tab. Selecting a tab SHALL set the store's selected environment and drive dashboard filtering client-side against the already-loaded catalog, with no additional restaurant fetch.

#### Scenario: All tab plus one per environment

- **WHEN** the user has environments
- **THEN** the tab row shows an "All" tab followed by one tab per environment

#### Scenario: Selecting a tab filters client-side

- **WHEN** the user selects an environment tab
- **THEN** the store's selected environment updates and the dashboard filters the loaded catalog without fetching restaurants again

### Requirement: Environment editor dialog

The application SHALL provide `src/components/environment/EnvironmentEditorDialog.vue` built on the ported `Dialog` and `Input`, supporting create, rename, and delete of an environment. Delete SHALL require a confirmation step inside the same dialog, never a browser `confirm()`.

#### Scenario: Create an environment

- **WHEN** the user submits a new environment name (and optional description)
- **THEN** `createEnvironment` is called and the new environment appears in the store's list

#### Scenario: Rename an environment

- **WHEN** the user edits an environment's name and saves
- **THEN** `updateEnvironment` is called with the environment's concurrency token as `If-Match`

#### Scenario: Delete requires in-dialog confirmation

- **WHEN** the user chooses to delete an environment
- **THEN** an explicit confirmation step is shown within the dialog before `deleteEnvironment` is called, with no browser `confirm()`

### Requirement: Graceful handling of forbidden environment calls

Environment API calls are user-scoped server-side; the frontend SHALL NOT implement ownership logic but SHALL surface a 403 gracefully rather than crashing.

#### Scenario: Forbidden response

- **WHEN** any environment call returns 403
- **THEN** the failure is surfaced to the user without an unhandled error, leaving the rest of the dashboard usable
