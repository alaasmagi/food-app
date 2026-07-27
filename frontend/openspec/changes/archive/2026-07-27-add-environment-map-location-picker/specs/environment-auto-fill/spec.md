## ADDED Requirements

### Requirement: Auto-fill fields on the environment DTO

The `DiningEnvironment` frontend type SHALL carry the backend's saved auto-fill origin as three
optional, nullable fields: `autoFillLatitude` (number | null), `autoFillLongitude` (number | null),
and `autoFillRadiusMeters` (number | null). These fields SHALL use the app's camelCase DTO
convention, matching how the backend's `AutoFill*` properties serialize to JSON. The environment
create and update write path SHALL send these fields when set and omit or send null when unset, and
the environments store SHALL round-trip them alongside `name` and `description` so a saved origin is
not silently dropped on rename.

#### Scenario: Environment with a stored origin is read

- **WHEN** the environments list is loaded and an environment has a saved auto-fill origin
- **THEN** its `autoFillLatitude`, `autoFillLongitude`, and `autoFillRadiusMeters` are present on the
  in-store `DiningEnvironment` object

#### Scenario: Environment without an origin is read

- **WHEN** an environment has never had an auto-fill origin set
- **THEN** its three auto-fill fields are null and no location marker is shown for it in the editor

#### Scenario: Renaming does not drop the origin

- **WHEN** the user renames an environment that has a stored origin without touching its location
- **THEN** the update request still carries the existing `autoFillLatitude`, `autoFillLongitude`, and
  `autoFillRadiusMeters` values

### Requirement: Map-based location picker in the environment editor

The environment editor SHALL provide an optional location section per environment containing a small
Leaflet map that reuses the restaurant map's setup: CARTO tiles matched to the active theme
(dark/light), token-styled controls and attribution, the dark-tile brightness lift, and an isolated
stacking context so the map's z-indexes do not paint over the dialog. The section SHALL make clear
that a location is optional and that auto-fill is unavailable until one is set.

#### Scenario: Setting a location by clicking the map

- **WHEN** the user clicks a point on the map
- **THEN** a marker is placed at that point and `autoFillLatitude`/`autoFillLongitude` are set to its
  coordinates

#### Scenario: Adjusting a location by dragging the marker

- **WHEN** the user drags the existing marker to a new point
- **THEN** `autoFillLatitude`/`autoFillLongitude` update to the marker's new coordinates

#### Scenario: Clearing a location

- **WHEN** the user clears the set location
- **THEN** the marker is removed, all three auto-fill fields become null, and the radius input and
  fill button are no longer shown

#### Scenario: Theme change repaints the map

- **WHEN** the app theme changes while the editor map is open
- **THEN** the basemap tiles swap to the matching theme without losing the marker or radius circle

### Requirement: Client-side address search

The location section SHALL provide a search box that geocodes a typed address client-side via the
Nominatim (OpenStreetMap) search service using a plain `fetch`, with no backend involvement and no
API key. On a successful match the map SHALL recentre on the result; the user still confirms the
point by clicking or dragging the marker.

#### Scenario: Searching for an address

- **WHEN** the user types an address and submits the search
- **THEN** the map recentres on the first Nominatim result

#### Scenario: Search returns no results

- **WHEN** a search returns no matches or the request fails
- **THEN** a non-blocking message is shown and the existing marker and map view are left unchanged

### Requirement: Radius input with map circle overlay

The location section SHALL show a radius `Input` in meters only once a location is set. A circle
overlay on the map SHALL reflect the current radius value, centred on the marker. When the radius
input is empty, a hint SHALL state that it defaults to 500 m.

#### Scenario: Radius shown only after a location is set

- **WHEN** no location is set
- **THEN** the radius input and its circle overlay are not shown

#### Scenario: Circle reflects the radius

- **WHEN** the user enters or changes the radius value
- **THEN** the map circle overlay resizes to match the entered radius, centred on the marker

#### Scenario: Empty radius shows the default hint

- **WHEN** a location is set but the radius input is left empty
- **THEN** a "defaults to 500 m" hint is shown and `autoFillRadiusMeters` is saved as null

### Requirement: Client-side validation mirrors backend write rules

Before saving, the editor SHALL enforce the backend's write-path rules to avoid an obviously invalid
request: `autoFillLatitude` and `autoFillLongitude` are both-or-neither; `autoFillRadiusMeters` may
only be set when a location is set; and a supplied radius must be a positive integer within the
backend's accepted range. A violation SHALL surface an inline message and block the save rather than
round-tripping to a guaranteed 400.

#### Scenario: Radius without a location is blocked

- **WHEN** the user enters a radius but has not set a location
- **THEN** the save is blocked with an inline message and no request is sent (in practice the radius
  input is only shown once a location exists, so this guards the programmatic case)

#### Scenario: Out-of-range radius is blocked

- **WHEN** the user enters a radius that is not a positive integer within the accepted range
- **THEN** the save is blocked with an inline message and no request is sent

#### Scenario: Valid location and radius saves

- **WHEN** the user has set a location and a valid (or empty) radius
- **THEN** the save proceeds and the auto-fill fields are persisted through the update request

### Requirement: Fill with nearby restaurants action

The API layer SHALL provide `autoFillEnvironment(id)` posting to
`POST /api/v1/dining-environments/{id}/auto-fill` and returning the summary
`{ added, alreadyPresent, totalMembers }`. When a saved environment has stored coordinates, the
editor SHALL show a "Fill with nearby restaurants" button that calls this function, refreshes that
environment's membership so the new members are reflected in the app, and raises a success `Toast`
reporting how many restaurants were added. The button SHALL be available both immediately after a
location is saved and later on any existing environment that already has stored coordinates, so the
import can be re-run.

#### Scenario: Filling a newly located environment

- **WHEN** the user saves an environment with a location and clicks "Fill with nearby restaurants"
- **THEN** the auto-fill endpoint is called, the environment's membership is refreshed, and a toast
  reports the number of restaurants added

#### Scenario: Re-running fill on an existing environment

- **WHEN** the user opens the editor for an environment that already has stored coordinates
- **THEN** the "Fill with nearby restaurants" button is shown and can be run again to import newly
  eligible restaurants

#### Scenario: Fill reports zero additions

- **WHEN** auto-fill runs and no new restaurants are in range beyond current members
- **THEN** the toast states that no new restaurants were added rather than showing an error

#### Scenario: Fill button hidden without coordinates

- **WHEN** an environment has no stored coordinates
- **THEN** the "Fill with nearby restaurants" button is not shown for it
