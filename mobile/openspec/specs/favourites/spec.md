# favourites Specification

## Purpose

Per-user restaurant ratings and notes: the favourites API layer and React Query hooks (list + create-or-update upsert with `If-Match`), the `RatingStars` control, the favourite editor dialog, the `RestaurantCard` rating display and action, and the ported Toast primitive with its app-level host used to confirm saves and surface errors.

## Requirements

### Requirement: Favourite type

The application SHALL provide `src/types/favourite.ts` with a hand-written `Favourite` interface matching the backend Web DTO: `id`, `concurrencyToken`, `restaurantId`, `rating` (integer 1-5), and nullable `note`.

#### Scenario: Type mirrors the backend DTO

- **WHEN** a favourite payload is received from the backend
- **THEN** it is typed as `Favourite` with camelCase fields including `concurrencyToken` and a nullable `note`

### Requirement: Typed favourites API layer

The application SHALL provide `src/api/favourites.ts` routing every call through the shared authenticated `apiFetch`, exposing `getFavourites()`, `createFavourite(input)`, and `updateFavourite(id, input, concurrencyToken)`. Update SHALL send the `If-Match` header from the favourite's concurrency token. There is no dedicated upsert endpoint. Non-ok responses SHALL be surfaced as errors (including the user-scoped 403 case) rather than crashing.

#### Scenario: List favourites

- **WHEN** `getFavourites()` is called
- **THEN** it issues a bearer-authorized `GET /api/v1/favourites` and resolves to an array of `Favourite`

#### Scenario: Create and update

- **WHEN** `createFavourite` or `updateFavourite` is called
- **THEN** it POSTs to `/api/v1/favourites` or PUTs to `/api/v1/favourites/{id}` with the favourite's concurrency token as `If-Match` on update

### Requirement: Favourites query hook with per-restaurant lookup

The application SHALL provide `useFavourites()` wrapping `getFavourites()` in React Query (server state is the cache, fetched once and reused), plus a `favouriteFor(restaurantId)` derivation answering whether a restaurant has a favourite and, if so, which one, without a network call.

#### Scenario: Fetched once and reused

- **WHEN** favourites are already cached
- **THEN** reading them again does not issue another list request

#### Scenario: Lookup by restaurant

- **WHEN** `favouriteFor(restaurantId)` is asked for a restaurant
- **THEN** it returns that restaurant's cached favourite, or nothing when the restaurant has no favourite

### Requirement: Create-or-update upsert mutation

The application SHALL provide a `useUpsertFavourite()` mutation that, given a `restaurantId`, `rating`, and `note`, creates a new favourite when none exists for that restaurant, or updates the existing one sending its concurrency token as `If-Match`. On success it SHALL invalidate the favourites query so the cached list and the card's rating display reflect the change.

#### Scenario: Upsert creates when absent

- **WHEN** the mutation runs for a restaurant with no existing favourite
- **THEN** `createFavourite` is called and the favourites query is invalidated

#### Scenario: Upsert updates when present

- **WHEN** the mutation runs for a restaurant that already has a favourite
- **THEN** `updateFavourite` is called with the existing favourite's concurrency token as `If-Match`, and the favourites query is invalidated

#### Scenario: Forbidden response handled gracefully

- **WHEN** any favourites query or mutation returns 403
- **THEN** the failure is surfaced without an unhandled crash, leaving the rest of the screen usable

### Requirement: Rating stars control

The application SHALL provide `src/components/favourite/RatingStars.tsx` rendering 5 stars, with a read-only display mode and an editable press-to-set mode selected by a prop. It SHALL render its own star glyph (the design-system Icon set has no star), a filled star for a selected value and an outline star otherwise. In editable mode, activating the nth star SHALL report a rating of n.

#### Scenario: Read-only display

- **WHEN** `RatingStars` renders a rating in read-only mode
- **THEN** it shows that many filled stars and is not interactive

#### Scenario: Editable selection

- **WHEN** the control is editable and the user activates the nth star
- **THEN** it reports the rating value n

### Requirement: Favourite editor dialog

The application SHALL provide `src/components/favourite/FavouriteEditorDialog.tsx` built on the ported `Dialog`, editable `RatingStars`, `Input` (note), and `Button` (save/cancel). It SHALL seed its fields from the restaurant's existing favourite when opened, validate the rating as an integer in 1-5 before calling the API (mirroring the backend), upsert via `useUpsertFavourite()`, and confirm a successful save or surface a save error via a toast.

#### Scenario: Save a valid favourite

- **WHEN** the user picks a rating in 1-5 and saves
- **THEN** the favourite is upserted, a success toast is shown, and the dialog closes

#### Scenario: Client-side rating validation

- **WHEN** the rating is not an integer in 1-5
- **THEN** the save is blocked client-side without an API call

#### Scenario: Save error surfaced

- **WHEN** the upsert request fails
- **THEN** a danger toast is shown and the dialog remains open for a retry

#### Scenario: Editing seeds the current values

- **WHEN** the dialog opens for a restaurant that already has a favourite
- **THEN** the rating and note fields are pre-filled from that favourite

### Requirement: Restaurant card favourite display and action

`RestaurantCard` SHALL show a read-only `RatingStars` reflecting the restaurant's favourite when one exists, and SHALL always offer an action to rate the restaurant: labelled "Rate" when there is no favourite yet and "Edit rating" when one exists. Activating the action SHALL open the `FavouriteEditorDialog` for that restaurant. This favourite surface is independent of the environment membership action.

#### Scenario: Read-only stars when favourited

- **WHEN** a restaurant has a favourite
- **THEN** its card shows a read-only `RatingStars` for that rating and an "Edit rating" action

#### Scenario: Rate action when not favourited

- **WHEN** a restaurant has no favourite
- **THEN** its card shows a "Rate" action and no rating stars

#### Scenario: Action opens the editor

- **WHEN** the user activates the rate/edit action
- **THEN** the `FavouriteEditorDialog` opens for that restaurant

### Requirement: Ported Toast primitive with an app-level host

The application SHALL port the `Toast` design-system component (feedback) into `src/components/design-system/feedback/`, re-expressed in React Native primitives with values from `src/theme/tokens.ts` and prop names matching the `Toast.d.ts` contract (`title`, optional `description`, `tone` of info/success/warning/danger, optional close). It SHALL provide a toast host/provider mounted at the app root that renders a fixed-position, safe-area-aware stack, and a `useToast()` hook to push toasts that auto-dismiss. No app source SHALL import from the `alaasmagi-design-system/` folder at runtime.

#### Scenario: Toast renders per tone

- **WHEN** a toast is pushed with a given tone
- **THEN** a Toast card renders with that tone's icon and color, its title, and optional description

#### Scenario: Pushed toast appears and dismisses

- **WHEN** `useToast()` pushes a toast
- **THEN** it appears in the app-root stack and is removed after its timeout or when closed

#### Scenario: No runtime dependency on the design system folder

- **WHEN** the app is built
- **THEN** no module imports from `alaasmagi-design-system/`
