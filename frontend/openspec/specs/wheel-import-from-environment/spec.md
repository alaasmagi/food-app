# wheel-import-from-environment Specification

## Purpose
TBD - created by syncing change add-wheel-import-from-environment. Update Purpose after archive.
## Requirements
### Requirement: Import-from-environment control in the wheel editor

The wheel editor dialog SHALL provide an "Import from environment" control: a `Select` listing the
current user's `DiningEnvironment`s by name. The control SHALL be additive UI alongside the existing
manual restaurant checkbox list, which remains fully usable. When the editor opens it SHALL ensure the
data the import depends on is loaded — the user's environments, their membership, and the restaurant
catalog — reusing the stores' cached loaders so an already-loaded dataset is not re-fetched.

#### Scenario: Control lists the user's environments

- **WHEN** the wheel editor is opened
- **THEN** the import control offers one option per environment the user has

#### Scenario: Control coexists with manual selection

- **WHEN** the user has manually checked some restaurants
- **THEN** the import control is available without clearing or disabling the manual checkbox list

#### Scenario: No environments

- **WHEN** the user has no environments
- **THEN** the import control conveys that there is nothing to import rather than presenting an empty,
  actionable select

### Requirement: Additive, de-duplicating import by name

Choosing an environment SHALL add every restaurant currently in that environment to the wheel's
selected set, tracked by restaurant NAME to match `UserWheel.restaurantNames`' frozen-name semantics.
The import SHALL merge into the current selection rather than replace it, and SHALL never add a name
that is already selected a second time. After an import the user SHALL still be able to manually check
or uncheck any restaurant, and MAY import from another environment to merge further.

#### Scenario: Import merges into the current selection

- **WHEN** the wheel already has some restaurants selected and the user imports an environment
- **THEN** the environment's restaurant names are added to the existing selection, and previously
  selected names remain selected

#### Scenario: Import does not duplicate

- **WHEN** an imported environment contains a restaurant already selected on the wheel
- **THEN** that name remains selected once, not duplicated

#### Scenario: Manual editing after import

- **WHEN** the user unchecks a restaurant that was just imported
- **THEN** that name is removed from the selection like any manually toggled restaurant

### Requirement: Skip memberships that no longer resolve

The import SHALL resolve each environment membership's restaurant id to a name through the client's
restaurant catalog and SHALL import only ids that resolve to a current restaurant. A membership whose
restaurant has since been deleted from the catalog (its id no longer resolves) SHALL be skipped
silently without failing the import.

#### Scenario: Deleted restaurant is skipped

- **WHEN** an environment's membership references a restaurant id that is not present in the current
  catalog
- **THEN** that entry is skipped and the remaining resolvable restaurants are still imported

#### Scenario: All memberships resolvable

- **WHEN** every restaurant in the chosen environment resolves to a current catalog entry
- **THEN** all of their names are imported

### Requirement: Import result feedback

An import SHALL report its outcome with a short, non-blocking confirmation stating how many
restaurants were newly added, so an import that adds nothing is not silently ambiguous.

#### Scenario: Some restaurants added

- **WHEN** an import adds one or more new names to the selection
- **THEN** a confirmation reports the number added

#### Scenario: Nothing new to add

- **WHEN** every restaurant in the chosen environment was already selected, or none resolved to a
  current restaurant
- **THEN** the confirmation states that no new restaurants were added rather than implying success
