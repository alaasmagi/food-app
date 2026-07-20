## Why

The wheel is FoodRoulette's signature feature: a user saves a named picker over a frozen list of restaurant names, spins it to pick where to eat, and can share a public wheel by link so anyone (logged out) can spin it. The web frontend already ships this against the same backend; this brings it to mobile.

## What Changes

- Port two design-system form primitives: `Switch` (isPublic toggle) and `Checkbox` (restaurant selection list). `Input`, `Dialog`, `Button`, and `Toast` are already ported and reused.
- Add `src/types/wheel.ts` with `UserWheel` (`id`, `concurrencyToken`, `name`, `restaurantNames: string[]`, `isPublic`) matching `UserWheelDto`, and a minimal `PublicWheel` (`name`, `restaurantNames`) matching `PublicUserWheelDto`.
- Add `src/api/wheels.ts` with `getWheels()`, `createWheel(input)`, `updateWheel(id, input, concurrencyToken)`, `deleteWheel(id, concurrencyToken)` through the shared `apiFetch` against `/api/v1/user-wheels`; update and delete send `If-Match`.
- Add `src/api/publicWheels.ts` with `getPublicWheel(id)` calling `GET /api/v1/public/wheels/{id}` on the existing unauthenticated request path (`publicFetch`, no bearer, no 401 refresh); it resolves to a `PublicWheel` on 200, reports 404 distinctly (returns `null`), and rejects on other failures.
- Add React Query hooks: `useWheels()` (list) plus create / update / delete mutations that invalidate the wheels list, and a public-wheel query hook for the shared route.
- Add a reusable copy-share-link behaviour (`useShareWheelLink`) that builds `https://app.<domain>/w/<id>`, copies it via `expo-clipboard`, and confirms with a success toast (or a danger toast on failure). The `<domain>` base comes from app config, not hard-coded.
- Add `src/components/wheel/WheelEditorDialog.tsx`: name `Input`, a searchable `Checkbox` list over the already-loaded restaurant catalog to build `restaurantNames` (a frozen snapshot of restaurant NAME strings, not ids, per the backend rule — no separate restaurant fetch), and an `isPublic` `Switch`. When editing an already-saved wheel whose `isPublic` is on, it shows a "Copy share link" action; an unsaved wheel does not.
- Add `src/components/wheel/WheelSpinner.tsx`: a native spinning wheel (`react-native-svg` + `Animated`), one segment per name, whose `spin()` lands on a randomly chosen name (client-side, no backend call) and reports the result. Built from theme tokens only.
- Add `app/(tabs)/wheel.tsx`: a list of saved wheels (a `Card` per wheel with Spin / Edit / Delete, plus a Share action when the wheel is public), a "New wheel" action opening the editor, and selecting a wheel shows its `WheelSpinner`.
- Add `app/w/[id].tsx`: a standalone deep-link route, NOT behind auth, that loads a public wheel via `getPublicWheel` and shows its name + `WheelSpinner`; a 404 shows "This wheel isn't available".
- Exempt the public `/w/[id]` route from the auth gate in `app/_layout.tsx` so a logged-out visitor is not redirected to login. The `foodroulette://w/<id>` deep link is served by the file-based route; the universal/app link to `app.<domain>/w/<id>` is documented as a deployment/config prerequisite.

Out of scope: native social share sheets, link previews/OG metadata, and settings.

## Capabilities

### New Capabilities

- `wheel`: saved restaurant-picker wheels and public sharing — the wheels API layer and React Query hooks (list + create/update/delete with `If-Match`), the unauthenticated public-wheel API, the wheel editor dialog (searchable checkbox list building a frozen name snapshot, public switch, copy-share-link), the native `WheelSpinner`, the Wheel tab screen, the public shared-wheel deep-link route, the reusable copy-share-link behaviour, and the ported `Switch`/`Checkbox` primitives.

### Modified Capabilities

- `app-shell`: the auth gate changes to exempt the public shared-wheel route `/w/[id]` — a logged-out visitor opening a shared wheel is not redirected to login, while `(tabs)` stays gated. Only the "Auth-gated route structure" requirement changes.

## Impact

- New files: `src/types/wheel.ts`, `src/api/wheels.ts`, `src/api/publicWheels.ts`, wheels React Query hooks under `src/hooks/`, `src/hooks/useShareWheelLink.ts`, `src/components/wheel/WheelEditorDialog.tsx`, `src/components/wheel/WheelSpinner.tsx`, `app/(tabs)/wheel.tsx` (replacing the placeholder), `app/w/[id].tsx`, and ported `Switch`/`Checkbox` under `src/components/design-system/forms/`.
- Modified files: `app/_layout.tsx` (auth-gate exemption for `/w/[id]`), and `src/config/env.ts` (add the web app base URL for share links).
- New dependency: `expo-clipboard` (copy share link). Stars/wheel draw via the already-present `react-native-svg`.
- Backend: none. Consumes the existing `/api/v1/user-wheels` and `/api/v1/public/wheels/{id}` endpoints. Universal-link association (`app.<domain>`) is a deployment config prerequisite, not a code change here.
