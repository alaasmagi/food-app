## Context

The dashboard lists restaurants and supports dining-environment grouping. This change adds a per-user favourite (a 1-5 rating plus an optional note) to each restaurant, independent of environments, surfaced on the restaurant card and edited in a dialog, with save feedback via a toast.

Prior changes established the bearer fetch wrapper, the Pinia + router wiring, and the ported primitives `Icon/Button/Card/Badge/Tag/Tabs/Dialog/Input`. `Toast` is not yet ported, and there is no app-wide notification service.

Backend (bearer-authorized, user-scoped): `/api/v1/favourites` with `GET` (list the user's favourites), `POST` (create), `PUT/{id}` (update, `If-Match`), `DELETE/{id}` (`If-Match`). `FavouriteDto` = `{ id, concurrencyToken, restaurantId, rating (int, [Range(1,5)]), note? (max 1024) }`. There is no upsert endpoint and no get-by-restaurant endpoint - the list carries `restaurantId` per row.

## Goals / Non-Goals

**Goals:**
- Type the favourite DTO; add the API layer; add a `restaurantId -> Favourite` store with create-or-update upsert.
- Build `RatingStars` (read-only + editable) and `FavouriteEditorDialog`, wire a "Rate"/"Edit rating" action into the card.
- Port `Toast` and add a minimal app-wide toast service for save confirmation/error.

**Non-Goals:**
- Deleting favourites (out of scope; only create/update), sorting/filtering by rating, the wheel, notification settings.
- A full toast queue with priorities/positions beyond a single fixed stack.
- Rating half-stars or fractional ratings (integers 1-5 only, per the backend).

## Decisions

**"Upsert" is create-or-update in the store, not an endpoint - correcting the request.** There is no upsert route. `getFavourites()` populates `restaurantId -> Favourite`; `upsert(restaurantId, rating, note)` looks up the existing favourite and calls `updateFavourite(id, ..., concurrencyToken)` (If-Match) or `createFavourite({ restaurantId, rating, note })`, then stores the response by `restaurantId`. Rationale: the store already holds the per-restaurant favourite and its token, which is exactly what create-vs-update needs.

**`RatingStars` renders its own star SVG - the design system has no star.** Neither the ported `IconName` union nor the design system's icon set contains a star glyph, so the request's "use the ported Icon component" cannot hold. `RatingStars` is a feature component that draws a filled/empty star `<svg>` per position, sized via tokens. Rationale: keep the ported `Icon` faithful to its source (no invented glyphs); a rating control is feature-specific anyway.

**Toast is split into the ported card and an app-level service.** `Toast.vue` is the card per its contract (`title`, `description?`, `tone`, `close`). A `toasts` Pinia store holds active toasts with `push(...)`/`dismiss(id)` and per-toast auto-dismiss; a `ToastHost` mounted at the app root (in `App.vue`, so it is available on every route, not only shell-wrapped ones) renders the fixed bottom-right stack. Rationale: the design system explicitly says the card is just the card and the stack is the app's concern; a store-backed service lets any view enqueue without prop-drilling.

**Client-side rating validation mirrors the backend.** The editor blocks save unless the rating is an integer in 1-5 (`Number.isInteger(r) && r >= 1 && r <= 5`), before any API call. Rationale: the backend enforces `[Range(1,5)]`; validating first avoids a guaranteed-fail round trip and gives immediate feedback. The star control only ever emits 1-5, so this mainly guards the "no rating chosen yet" case.

**Auto-dismiss timing lives in the store, seeded via a caller-provided timeout.** `Date.now()`/timers are fine in app code (unlike workflow scripts); the store sets a `setTimeout` per toast to `dismiss(id)`. Rationale: keeps the host purely presentational.

**Alternatives considered:**
- *Extending the ported `Icon` with a `star` glyph* - rejected: the design system has no star; inventing one violates the copy-don't-invent rule. A local SVG in `RatingStars` is honest and self-contained.
- *A `useToast` composable instead of a store* - the store is simpler to share across unrelated views and to test; a composable would wrap it anyway.
- *Storing favourites in the restaurants store* - rejected: favourites are an independent concern (independent of environments and the catalog); a separate store keeps lifecycles clean.
- *Deleting a favourite by clearing the rating* - out of scope; the editor only creates/updates.

## Risks / Trade-offs

- **Concurrency conflict on update (409/428)** -> a stale token. Mitigation: send `If-Match` from the stored token; on failure show a danger toast and keep the dialog open. Full conflict-merge is out of scope.
- **Toast host mounted once, overlapping the Dialog** -> z-index interplay between `Dialog` (z 100) and toasts. Mitigation: give the toast host a higher stacking context so save toasts are visible above the editor dialog.
- **Editable stars keyboard access** -> stars must be operable, not just clickable. Mitigation: render each star as a `<button>` with an accessible label so it is focusable and activatable by keyboard.
- **Rating of 0 / no favourite yet** -> `rating` is 1-5 with no "unrated" value. Mitigation: model "no favourite" as the absence of a store entry (read-only stars hidden), not a rating of 0; the editor starts unset and requires a 1-5 pick to save.

## Migration Plan

Additive except `RestaurantCard.vue` (gains rating display + action) and the app root (mounts `ToastHost`). Port `Toast`; add `types/favourite.ts`, `api/favourites.ts`, `stores/favourites.ts`, `stores/toasts.ts`; add `RatingStars.vue`, `FavouriteEditorDialog.vue`, `ToastHost.vue`; load favourites on dashboard mount. Rollback is reverting the change; the card returns to its pre-favourite form. No backend or dependency changes.

## Open Questions

- Whether an empty note should be sent as `null` or `""` - send `null` for an empty note (the DTO's `Note` is nullable), confirm at apply.
- Whether the toast auto-dismiss duration needs to be configurable per call - default to a single duration now; add an override only if a caller needs it.
- Whether "Edit rating" should also allow removing a favourite - out of scope; only create/update in this change.
