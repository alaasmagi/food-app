## Why

The FoodRoulette mobile app is greenfield and every feature it will ship (offers, map, environments, favourites, wheel, settings) reads from the authenticated backend REST API. Nothing can call that API without a working sign-in, so native OAuth plus the navigational shell it gates is the foundational first change every later change depends on.

## What Changes

- Add native OAuth 2.0 Authorization Code + PKCE against the food-app Keycloak realm using expo-auth-session: open the authorize URL in the system browser, receive the `foodroulette://` redirect, and exchange the code for tokens (no client secret in the app).
- Store the access and refresh tokens in expo-secure-store (iOS Keychain / Android Keystore); expose an auth context/provider with `isAuthenticated`, `login()`, `logout()`, and the current access token.
- Add a Zustand auth store for in-app auth state that mirrors secure-store and drives navigation gating.
- Add `src/api/client.ts`, a shared request helper that attaches `Authorization: Bearer <access token>` and performs one silent refresh + retry on a 401, then logs out (clears secure-store, routes to login) if the refresh fails.
- Port the Icon and Button design-system components into `src/components/design-system/`, and create `src/theme/tokens.ts` from the design system's `tokens/*.css` (colors, fonts, spacing, typography) as a typed theme object.
- Add `app/(auth)/login.tsx`: a minimal dark login screen with a single "Log in" Button that starts the OAuth flow.
- Add `app/(tabs)/_layout.tsx`: the authenticated tab navigator shell (Dashboard, Map, Wheel, Settings), dark theme, safe-area aware, gated behind the auth state.
- Add `app/(tabs)/index.tsx`: an empty placeholder Dashboard screen proving the authed flow works end to end.
- Bootstrap the Expo (managed workflow) TypeScript app project itself (Expo Router, required dependencies, `foodroulette://` scheme registration).

Out of scope: any actual feature content (offers, map, environments, favourites, wheel, settings). Those are handled by later changes.

## Capabilities

### New Capabilities
- `authentication`: native OAuth PKCE flow against Keycloak, secure token storage, the auth context/provider and Zustand store, and the shared API request helper with bearer attachment plus silent refresh-and-retry on 401.
- `app-shell`: the Expo Router route structure — the `(auth)` login route and the auth-gated `(tabs)` navigator (Dashboard, Map, Wheel, Settings) with a placeholder Dashboard — plus dark theme and safe-area handling.
- `design-system-foundation`: the ported design tokens (`src/theme/tokens.ts`) and the first two ported RN components, Icon and Button, that later screens compose from.

### Modified Capabilities
<!-- None. This is the first change; no existing specs. -->

## Impact

- New Expo/React Native TypeScript project scaffolded under `mobile/` (`app/`, `src/`, project config, `foodroulette://` scheme).
- New dependencies: expo-router, expo-auth-session, expo-web-browser, expo-secure-store, zustand, react-native-safe-area-context (and the Expo/React Native baseline).
- External prerequisite (not a code change in this repo): the food-app Keycloak realm must expose a public client for the mobile app with PKCE (S256) required and the `foodroulette://*` redirect URI allowed, issuing tokens with `aud = food-api`. Documented in design.md.
- No backend or web frontend code changes.
