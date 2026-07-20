# wheel Specification

## Purpose

Saved restaurant-picker wheels and public sharing. This capability covers the wheels API layer and its React Query hooks (list plus create/update/delete with `If-Match` concurrency), the unauthenticated public-wheel API, the wheel editor dialog (a searchable checkbox list that builds a frozen restaurant-name snapshot, a public switch, and a copy-share-link action), the native `WheelSpinner`, the Wheel tab screen, the public shared-wheel deep-link route, the reusable copy-share-link behaviour, and the ported `Switch`/`Checkbox` design-system primitives.

## Requirements

### Requirement: Wheel and public-wheel types

The application SHALL provide `src/types/wheel.ts` with a `UserWheel` interface matching `UserWheelDto` (`id`, `concurrencyToken`, `name`, `restaurantNames: string[]`, `isPublic`) and a minimal `PublicWheel` interface matching `PublicUserWheelDto` (`name`, `restaurantNames`). `restaurantNames` SHALL be a frozen snapshot of restaurant NAME strings, not ids. `PublicWheel` SHALL NOT include `concurrencyToken` or `isPublic`.

#### Scenario: Types mirror the backend DTOs

- **WHEN** a wheel or public-wheel payload is received
- **THEN** it is typed as `UserWheel` (with `concurrencyToken` and `isPublic`) or `PublicWheel` (name and restaurantNames only)

### Requirement: Typed wheels API layer

The application SHALL provide `src/api/wheels.ts` routing every call through the shared authenticated `apiFetch`, exposing `getWheels()` (`GET /api/v1/user-wheels`), `createWheel(input)` (`POST`), `updateWheel(id, input, concurrencyToken)` (`PUT`), and `deleteWheel(id, concurrencyToken)` (`DELETE`). Update and delete SHALL send the wheel's concurrency token as `If-Match`. Non-ok responses SHALL be surfaced as errors rather than crashing.

#### Scenario: List wheels

- **WHEN** `getWheels()` is called
- **THEN** it issues a bearer-authorized `GET /api/v1/user-wheels` and resolves to an array of `UserWheel`

#### Scenario: Mutations send If-Match

- **WHEN** `updateWheel` or `deleteWheel` is called
- **THEN** it targets `/api/v1/user-wheels/{id}` with the wheel's concurrency token as `If-Match`

### Requirement: Public wheel API without authentication

The application SHALL provide `src/api/publicWheels.ts` with `getPublicWheel(id)` calling `GET /api/v1/public/wheels/{id}` on the unauthenticated request path (no `Authorization` header, no 401 refresh/retry), so it works for a logged-out visitor. It SHALL resolve to a `PublicWheel` on 200, report a 404 distinctly (returning `null`) so callers can show a not-found state, and reject on other non-ok responses.

#### Scenario: Fetch a public wheel without a token

- **WHEN** `getPublicWheel(id)` is called
- **THEN** it issues `GET /api/v1/public/wheels/{id}` with no `Authorization` header and no token refresh, and resolves to a `PublicWheel`

#### Scenario: Missing wheel is reported distinctly

- **WHEN** the endpoint responds 404
- **THEN** `getPublicWheel` returns a not-found result rather than throwing a generic error

#### Scenario: Other failures reject

- **WHEN** the endpoint responds with a non-ok status other than 404
- **THEN** `getPublicWheel` rejects so the caller can handle the failure

### Requirement: Wheels query and mutation hooks

The application SHALL provide `useWheels()` wrapping `getWheels()` in React Query (fetched once and cached), plus create, update, and delete mutation hooks that invalidate the wheels query on success so the list stays in sync (sending `If-Match` from the cached token on update and delete). It SHALL also provide a public-wheel query hook wrapping `getPublicWheel(id)` for the shared route.

#### Scenario: Wheels list cached and reused

- **WHEN** the wheels list is already cached
- **THEN** reading it again does not issue another list request

#### Scenario: Mutations invalidate the list

- **WHEN** a wheel is created, updated, or deleted
- **THEN** the wheels query is invalidated so the list reflects the change

### Requirement: Ported Switch and Checkbox primitives

The application SHALL port the `Switch` and `Checkbox` design-system form components into `src/components/design-system/forms/`, re-expressed in React Native primitives with values from `src/theme/tokens.ts` and prop names matching their `.d.ts` contracts (`checked`, `defaultChecked`, `onChange(checked)`, `disabled`, optional `label`). No app source SHALL import from `alaasmagi-design-system/` at runtime.

#### Scenario: Toggle reports its new state

- **WHEN** a `Switch` or `Checkbox` is pressed
- **THEN** it reports the new checked value via `onChange`, and reflects the accent-on / checked visual state

#### Scenario: No runtime dependency on the design system folder

- **WHEN** the app is built
- **THEN** no module imports from `alaasmagi-design-system/`

### Requirement: Wheel editor dialog

The application SHALL provide `src/components/wheel/WheelEditorDialog.tsx` built on `Dialog`, `Input` (name), a searchable `Checkbox` list over the already-loaded restaurant catalog, and a `Switch` for `isPublic`. The saved `restaurantNames` SHALL be a frozen snapshot of the checked restaurants' `name` values (not ids), and no separate restaurant fetch SHALL be made. When editing an already-saved wheel (has an id) whose `isPublic` is on, the dialog SHALL show a "Copy share link" action; a new, not-yet-saved wheel SHALL NOT show it. Create and update SHALL go through the wheels mutations (update sending `If-Match`).

#### Scenario: Build a wheel from checked restaurants

- **WHEN** the user names a wheel and checks restaurants
- **THEN** the wheel is saved with `restaurantNames` equal to the checked restaurants' names and `isPublic` from the switch

#### Scenario: Search filters the checkbox list

- **WHEN** the user types in the search input
- **THEN** the checkbox list filters to matching restaurants from the already-loaded catalog, without a network request

#### Scenario: Names are a frozen snapshot

- **WHEN** a wheel is saved
- **THEN** it stores restaurant names, not ids, so later catalog changes do not alter the saved wheel

#### Scenario: Copy share link for a saved public wheel

- **WHEN** the dialog is editing an existing wheel whose `isPublic` is on
- **THEN** a "Copy share link" action is shown, and activating it copies the wheel's share link and confirms with a toast

#### Scenario: No share action for an unsaved wheel

- **WHEN** the dialog is creating a new wheel that has not been saved yet
- **THEN** no "Copy share link" action is shown, even if the public switch is on

### Requirement: Wheel spinner

The application SHALL provide `src/components/wheel/WheelSpinner.tsx`, a native spinning wheel (`react-native-svg` + `Animated`, not a design-system primitive) that renders one segment per name in `restaurantNames` using only theme-token colors. Its `spin()` SHALL animate to a randomly chosen name and, when it settles, report the chosen name. Selection SHALL be client-side over the frozen names with no backend call, and spinning SHALL require at least 2 names.

#### Scenario: Renders a segment per name

- **WHEN** the spinner renders for a wheel
- **THEN** it draws one segment per name in `restaurantNames` using token colors only

#### Scenario: Spin picks and reports a result

- **WHEN** the user spins a wheel with at least 2 names
- **THEN** the wheel animates and, when it settles, reports the randomly chosen name

#### Scenario: Selection is client-side

- **WHEN** a spin resolves
- **THEN** the chosen name is picked locally with no backend request

#### Scenario: Too few names to spin

- **WHEN** a wheel has fewer than 2 names
- **THEN** the spin action is disabled and a hint to add more restaurants is shown

### Requirement: Wheel tab screen

The application SHALL provide `app/(tabs)/wheel.tsx` (replacing the placeholder): a list of saved wheels from `useWheels()`, a `Card` per wheel with Spin, Edit, and Delete actions, a "New wheel" action opening the editor dialog, and — for each wheel whose `isPublic` is true — a Share action that copies the wheel's link without reopening the editor. Selecting a wheel shows its `WheelSpinner`. Delete SHALL send `If-Match`.

#### Scenario: Lists saved wheels

- **WHEN** an authenticated user opens the Wheel tab
- **THEN** the wheels load and a card is rendered per wheel with spin, edit, and delete actions

#### Scenario: Selecting a wheel shows its spinner

- **WHEN** the user selects a wheel to spin
- **THEN** its `WheelSpinner` is shown for that wheel's names

#### Scenario: New wheel opens the editor

- **WHEN** the user activates "New wheel"
- **THEN** the wheel editor dialog opens

#### Scenario: Public wheel card offers a share action

- **WHEN** a wheel in the list has `isPublic` true
- **THEN** its card shows a share action that copies the wheel's link and confirms with a toast, without opening the editor

#### Scenario: Non-public wheel card has no share action

- **WHEN** a wheel in the list has `isPublic` false
- **THEN** its card shows no share action

### Requirement: Public shared-wheel route

The application SHALL provide `app/w/[id].tsx`, a standalone deep-link route that is exempt from the auth gate and renders outside the tab shell. It SHALL load the wheel via `getPublicWheel`, show the wheel's name and a `WheelSpinner` fed the wheel's `restaurantNames`, and on a not-found (404) result SHALL show "This wheel isn't available" rather than a generic error or a login redirect. The `foodroulette://w/<id>` deep link SHALL resolve to this route.

#### Scenario: Logged-out visitor opens a shared wheel

- **WHEN** an unauthenticated visitor navigates to `w/[id]` for an existing public wheel
- **THEN** the screen shows the wheel name and a `WheelSpinner` for its names, without requiring login

#### Scenario: Not-found shows a friendly message

- **WHEN** the wheel cannot be found (404)
- **THEN** the screen shows "This wheel isn't available" instead of a generic error or login redirect

### Requirement: Copy share-link behaviour

The application SHALL provide a reusable share-link behaviour (`src/hooks/useShareWheelLink.ts`) exposing a copy action that builds the link as the configured web app base URL + `/w/` + the wheel id, writes it to the clipboard via `expo-clipboard`, and on success pushes a "Link copied" success toast. On a clipboard failure it SHALL surface a danger toast rather than throwing. This behaviour SHALL be reused by the wheel editor dialog and the wheel tab screen.

#### Scenario: Copy writes the configured link and confirms

- **WHEN** the copy action runs for a wheel id
- **THEN** it writes `<webAppBaseUrl>/w/<id>` to the clipboard and pushes a "Link copied" success toast

#### Scenario: Clipboard failure is surfaced, not thrown

- **WHEN** writing to the clipboard rejects
- **THEN** a danger toast is shown and no error propagates to the caller
</content>
</invoke>
