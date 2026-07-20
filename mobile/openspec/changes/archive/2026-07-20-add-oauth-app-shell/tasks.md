## 1. Project bootstrap

- [x] 1.1 Scaffold an Expo (managed workflow) app in `mobile/` with TypeScript strict mode and Expo Router file-based routing
- [x] 1.2 Register the `foodroulette://` scheme in `app.json`/`app.config` and confirm deep links resolve on iOS and Android
- [x] 1.3 Add dependencies: expo-router, expo-auth-session, expo-web-browser, expo-secure-store, zustand, react-native-safe-area-context, react-native-svg (and configure the required Expo plugins)
- [x] 1.4 Add config/env plumbing for Keycloak values (authority `https://identity.alaasmagi.dev/realms/food-app`, client id, redirect `foodroulette://*`) and the API base `https://food-api.alaasmagi.dev`, read at runtime rather than hard-coded
- [x] 1.5 Add Jest + React Native Testing Library and a passing sample test to confirm the test harness runs

## 2. Design tokens

- [x] 2.1 Port `tokens/*.css` into `src/theme/tokens.ts` as typed `const` objects (colors, fonts, spacing, radius, typography, motion), converting each `--token-name` to a camelCase key
- [x] 2.2 Convert every OKLCH color to its hex/rgba equivalent, exposing the resolved dark semantic aliases (`surface*`, `text*`, `action*`, `border*`, `status*`) components consume
- [x] 2.3 Register the Figtree and JetBrains Mono font families (expo-font / google-fonts) so token font values resolve

## 3. Design-system components

- [x] 3.1 Port the Icon component into `src/components/design-system/` using react-native-svg, reusing the `Icon.jsx` `PATHS` glyph map (authoritative name union, not the stale `.d.ts`), with `name`, `size`, `strokeWidth`, `color` props reading from tokens
- [x] 3.2 Add the icon glyphs needed by the login screen and tab bar (Dashboard, Map, Wheel, Settings, plus `lock`/spinner as needed)
- [x] 3.3 Port the Button component into `src/components/design-system/` with props 1:1 from `Button.d.ts` (`variant`, `size`, `icon`, `iconPosition`, `loading`, `disabled`, `fullWidth`, `onPress`), using Pressable and the variant/size token maps
- [x] 3.4 Add smoke tests rendering Icon and Button across each variant/size

## 4. Secure token storage

- [x] 4.1 Implement a token storage module over expo-secure-store to read/write/clear the access and refresh tokens
- [x] 4.2 Ensure tokens survive backgrounding and app restart, and that missing/invalid tokens read as unauthenticated

## 5. OAuth PKCE flow

- [x] 5.1 Implement the expo-auth-session PKCE (S256) flow in `src/auth/`: load the realm discovery document, generate verifier/challenge, open the authorize URL via expo-web-browser
- [x] 5.2 Handle the `foodroulette://` redirect and exchange the authorization code (with verifier) at the Keycloak token endpoint for access + refresh tokens
- [x] 5.3 Handle user cancellation of the browser flow gracefully (return to login, no crash)
- [x] 5.4 Persist the resulting tokens to secure-store on success

## 6. Auth state and provider

- [x] 6.1 Create the Zustand auth store mirroring `isAuthenticated` and the current access token
- [x] 6.2 Create the auth context/provider exposing `isAuthenticated`, `login()`, `logout()`, and the current access token; hydrate from secure-store on launch
- [x] 6.3 Wire `logout()` to clear secure-store and flip the store to unauthenticated

## 7. Shared API request helper

- [x] 7.1 Implement `src/api/client.ts` that attaches `Authorization: Bearer <access token>` to authenticated requests
- [x] 7.2 On 401, perform exactly one silent refresh at the Keycloak token endpoint, update secure-store, and retry the original request once
- [x] 7.3 De-duplicate concurrent refreshes onto a single in-flight promise
- [x] 7.4 On refresh failure (or no refresh token), clear secure-store, set unauthenticated, and route to login
- [x] 7.5 Unit-test the bearer attachment, 401 refresh+retry, and refresh-failure logout paths against a mocked fetch

## 8. Navigation shell

- [x] 8.1 Set up the Expo Router root with auth gating: unauthenticated users route to `(auth)`, authenticated users route to `(tabs)`
- [x] 8.2 Build `app/(auth)/login.tsx`: a minimal dark login screen with a single "Log in" Button that calls `login()`
- [x] 8.3 Build `app/(tabs)/_layout.tsx`: the tab navigator (Dashboard, Map, Wheel, Settings) in the dark theme, safe-area aware, Dashboard as the default tab
- [x] 8.4 Build `app/(tabs)/index.tsx`: the placeholder Dashboard screen
- [x] 8.5 Add empty placeholder route files for the Map, Wheel, and Settings tabs so the navigator renders

## 9. End-to-end verification

- [ ] 9.1 Confirm the Keycloak public client / PKCE / redirect-URI / `aud = food-api` prerequisite (documented in design.md) is provisioned before live testing
- [ ] 9.2 Run the full flow on a device/simulator: launch → login → OAuth → redirect → tokens stored → Dashboard renders; log out returns to login
- [ ] 9.3 Verify a Bearer-authenticated call to `https://food-api.alaasmagi.dev` succeeds (token `aud` accepted) and that a forced 401 triggers the silent refresh+retry
