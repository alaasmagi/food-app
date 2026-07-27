## ADDED Requirements

### Requirement: DiningEnvironment carries the saved auto-fill origin

The mobile `DiningEnvironment` type SHALL include three optional, nullable fields carrying the
backend's saved auto-fill origin: `autoFillLatitude` (number | null), `autoFillLongitude`
(number | null), and `autoFillRadiusMeters` (number | null), matching the camelCase JSON the backend
returns. The environments list query SHALL surface these values unchanged, and they SHALL default to
`null` when the backend returns them as null.

#### Scenario: Stored origin round-trips on read

- **WHEN** the environments query loads an environment that has stored auto-fill values
- **THEN** the cached `DiningEnvironment` exposes `autoFillLatitude`, `autoFillLongitude`, and
  `autoFillRadiusMeters` with the returned values

#### Scenario: Environment without an origin reads as null

- **WHEN** the environments query loads an environment with no stored auto-fill origin
- **THEN** all three auto-fill fields are `null` and no error is surfaced

### Requirement: Create and update round-trip the auto-fill origin

The `EnvironmentInput` write shape SHALL carry the three optional nullable auto-fill fields, and
`createEnvironment` and `updateEnvironment` SHALL send them in the request body when set. Renaming or
otherwise updating an environment SHALL NOT drop an already-stored origin when the caller passes the
existing values through.

#### Scenario: Create with coordinates and radius sends the origin

- **WHEN** the user saves a new environment with coordinates and a radius set in the picker
- **THEN** the create request body includes `autoFillLatitude`, `autoFillLongitude`, and
  `autoFillRadiusMeters` with those values

#### Scenario: Update preserves a stored origin

- **WHEN** the user renames an existing environment that already has a stored origin without changing
  the location
- **THEN** the update request carries the existing auto-fill values so the stored origin is not
  cleared

#### Scenario: Save with no location omits or nulls the origin

- **WHEN** the user saves an environment with no location set in the picker
- **THEN** the request carries the auto-fill fields as null and the environment is stored without an
  origin

### Requirement: Auto-fill API call and mutation hook

The API module SHALL expose `autoFillEnvironment(id)` that issues `POST
/api/v1/dining-environments/{id}/auto-fill` through the shared authenticated `apiFetch`, returns the
parsed summary `{ added, alreadyPresent, totalMembers }` on success, and throws the parsed
ProblemDetails on a non-ok response like the other environment calls. A React Query mutation hook
SHALL wrap it and invalidate the membership query on success so the tabs and per-card membership
re-render from fresh server data.

#### Scenario: Auto-fill posts to the correct path and returns the summary

- **WHEN** `autoFillEnvironment(id)` is called for an environment id
- **THEN** a POST is issued to `/api/v1/dining-environments/{id}/auto-fill` and the parsed
  `{ added, alreadyPresent, totalMembers }` summary is returned

#### Scenario: Non-ok auto-fill response throws

- **WHEN** the auto-fill endpoint responds with a non-ok status
- **THEN** the call throws the parsed ProblemDetails rather than returning a summary

#### Scenario: Membership is refreshed after a successful fill

- **WHEN** the auto-fill mutation succeeds
- **THEN** the membership query is invalidated so newly added restaurants appear without a manual
  refetch

### Requirement: Optional map-based location and radius picker

`EnvironmentEditorDialog` SHALL present an optional location section built on `react-native-maps`
that is seeded from the environment's stored origin. The section SHALL render a dark-styled `MapView`
with a draggable `Marker` for the current point; tapping the map or dragging the marker SHALL set
`autoFillLatitude`/`autoFillLongitude`, and a "clear location" affordance SHALL remove the marker and
null all three fields. A radius `Input` in meters SHALL be shown only once a location is set, with a
`Circle` overlay centred on the marker reflecting the entered radius and previewing 500 m when the
radius is empty. When the radius is empty the section SHALL show a "defaults to 500 m" hint. Copy
SHALL make clear that both location and radius are optional and that auto-fill is unavailable without
a location.

#### Scenario: Placing a point on the map sets coordinates

- **WHEN** the user taps the map or drags the marker in the location section
- **THEN** `autoFillLatitude` and `autoFillLongitude` are set to that point and the marker is shown
  there

#### Scenario: Radius input and circle appear only with a location

- **WHEN** no location is set
- **THEN** the radius input and the circle overlay are hidden; once a location is set they are shown

#### Scenario: Empty radius shows the default hint and previews 500 m

- **WHEN** a location is set and the radius field is empty
- **THEN** a "defaults to 500 m" hint is shown and the circle overlay previews a 500 m radius

#### Scenario: Clearing the location nulls the origin

- **WHEN** the user activates "clear location"
- **THEN** the marker is removed and `autoFillLatitude`, `autoFillLongitude`, and
  `autoFillRadiusMeters` are all set to null

#### Scenario: Optional place search recentres the map

- **WHEN** the user submits an address in the optional search box and a result is found
- **THEN** the map recentres on the first result without routing the request through the
  bearer-token `apiFetch`
- **AND WHEN** the search returns no result or fails
- **THEN** a non-blocking message is shown and the marker and view are left unchanged

### Requirement: Client-side validation mirrors the backend write rules

Before sending a create or update, the editor SHALL enforce a client-side mirror of the backend's
write validation and block the save with an inline message on violation: coordinates SHALL be
both-or-neither (a single coordinate is invalid), a radius SHALL be allowed only when a location is
set, and a supplied radius SHALL be a positive integer within the inclusive range 1..50000.

#### Scenario: One coordinate without the other is blocked

- **WHEN** the picker state has exactly one of latitude or longitude set
- **THEN** the save is blocked with an inline validation message and no request is sent

#### Scenario: Radius without a location is blocked

- **WHEN** a radius is entered but no location is set
- **THEN** the save is blocked with an inline validation message and no request is sent

#### Scenario: Out-of-range radius is blocked

- **WHEN** a location is set and the radius is not a positive integer within 1..50000
- **THEN** the save is blocked with an inline validation message and no request is sent

### Requirement: Fill with nearby restaurants action and summary toast

For any saved environment that has stored coordinates, the editor SHALL show a "Fill with nearby
restaurants" `Button` — both immediately after saving a located environment and when reopening an
existing environment that already has an origin, so the import can be re-run. Activating it SHALL
call the auto-fill hook, refresh membership, and raise a success `Toast` reporting how many
restaurants were added, with a distinct "no new restaurants added" message when `added` is 0. The
action SHALL be guarded against double submits while a fill is in flight, and SHALL NOT appear for an
environment with no stored coordinates.

#### Scenario: Fill button shown only with stored coordinates

- **WHEN** the editor is open for an environment that has stored coordinates
- **THEN** the "Fill with nearby restaurants" button is shown; for an environment with no stored
  coordinates it is not shown

#### Scenario: Filling reports the number added

- **WHEN** the user activates the fill button and the auto-fill call adds one or more restaurants
- **THEN** membership is refreshed and a success toast reports the number added

#### Scenario: Zero added shows a distinct message

- **WHEN** the fill call completes with `added` equal to 0
- **THEN** a distinct "no new restaurants added" toast is shown rather than a count of new additions

#### Scenario: Double submit is prevented

- **WHEN** a fill is already in flight
- **THEN** activating the button again does not issue a second auto-fill request
