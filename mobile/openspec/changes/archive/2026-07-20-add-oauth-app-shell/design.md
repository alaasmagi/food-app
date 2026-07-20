## Context

The FoodRoulette mobile app is a greenfield Expo (managed workflow) React Native TypeScript project. It consumes the same ASP.NET Core backend as the existing Vue web frontend, at `https://food-api.alaasmagi.dev`. This first change bootstraps the project and delivers the two things everything else depends on: a working sign-in and the auth-gated navigation shell.

Current state, from research of the sibling repos:

- The web frontend authenticates with a **Backend-for-Frontend (BFF)** pattern: the .NET backend runs the Keycloak authorization-code flow server-side, stores tokens in an encrypted session cookie, and the SPA swaps that cookie for a short-lived bearer token. Access tokens live in memory only; there is no OAuth refresh token on the client.
- The backend validates API bearer tokens with `Audience = "food-api"` (`backend/Web/Configuration/RequiredConfiguration.cs`).
- Keycloak realm details (`backend/.env`): authority `https://identity.alaasmagi.dev/realms/food-app`, existing client `food-api` which is **confidential** (has a client secret).
- The design system (`alaasmagi-design-system/`, a sibling folder) is a framework-agnostic CSS-variable token set plus a **React web** reference implementation — not a React Native library. Colors are authored in **OKLCH**, which React Native cannot parse.

The BFF/cookie model does not translate to a native app (no browser cookies), so the mobile app uses a genuinely different flow.

## Goals / Non-Goals

**Goals:**

- Native OAuth 2.0 Authorization Code + PKCE (S256) against the `food-app` Keycloak realm via expo-auth-session, with tokens in expo-secure-store.
- An auth context/provider (`isAuthenticated`, `login()`, `logout()`, current access token) backed by a Zustand store that drives navigation.
- A shared API request helper (`src/api/client.ts`) that attaches the bearer token and does one silent refresh + retry on 401, then logs out on refresh failure.
- The Expo Router shell: `(auth)/login` and the auth-gated `(tabs)` navigator (Dashboard, Map, Wheel, Settings) with a placeholder Dashboard, dark theme, safe-area aware.
- `src/theme/tokens.ts` ported from the design system tokens, plus the Icon and Button components ported into `src/components/design-system/`.

**Non-Goals:**

- Any feature content (offers, map data, environments, favourites, wheel, settings screens beyond empty placeholders).
- React Query wiring for real endpoints (added in later feature changes; only the request helper skeleton lands here).
- A light-mode theme toggle. The app is dark-mode-first and dark-only for now.
- Porting design-system components beyond Icon and Button.
- Any backend or web-frontend code change.

## Decisions

### Native PKCE against Keycloak, not the web BFF flow

The web app's cookie-based BFF exists to protect tokens from XSS in a browser. A native app has OS-encrypted storage (Keychain/Keystore) and no cookie surface, so the standard native pattern — authorization code + PKCE in the system browser, tokens in secure-store — is the correct choice. **Alternative considered:** reusing the backend's `/account/login` BFF endpoints from a WebView. Rejected: WebView auth is discouraged by OAuth best practice (RFC 8252), breaks SSO with the system browser, and would still leave the app without a first-class token to refresh.

### expo-auth-session + expo-web-browser + expo-secure-store

Standard Expo managed-workflow stack for native OAuth. `expo-auth-session` runs the PKCE flow and can consume the realm's discovery document; `expo-web-browser` opens the authorize URL in the system browser and returns the redirect; `expo-secure-store` persists tokens in Keychain/Keystore. **Alternative considered:** `react-native-app-auth`. It is capable but leans toward bare/prebuild workflows and native config; expo-auth-session keeps the managed workflow simpler and matches the project's stated stack.

### One silent refresh + retry on 401, then logout

Unlike the web app (which has no client-side refresh token), the native app holds a real refresh token. The shared helper attaches `Authorization: Bearer`; on a 401 it performs exactly one refresh against the Keycloak token endpoint, updates secure-store, and retries once. A single retry avoids infinite loops; on refresh failure the helper clears secure-store, flips the Zustand auth state to unauthenticated, and routing sends the user to login. Concurrent 401s should de-duplicate onto a single in-flight refresh promise (mirroring the web `fetchToken()` pattern) so parallel requests don't each trigger a refresh.

### Auth state split: secure-store (persistence) + Zustand (reactive) + context (ergonomics)

Secure-store is the durable source of truth for token bytes but is async and non-reactive. A small Zustand store mirrors `isAuthenticated` and the current access token for synchronous, reactive reads that drive Expo Router gating. A thin context/provider exposes `login()`/`logout()` and hydrates the store from secure-store on launch. **Alternative considered:** React Query for auth state. Rejected per project rules — auth token presence is pure client state, not server data; React Query is reserved for server state.

### Tokens ported once to a typed TS object; OKLCH converted to hex/rgba

`tokens/*.css` are CSS custom properties (unusable in RN) authored in OKLCH (unparseable by RN). Port them once into `src/theme/tokens.ts` as `const` objects (colors, fonts, spacing, radius, typography), converting each OKLCH value to its hex/rgba equivalent and each `--token-name` to a camelCase key. Only the dark (`:root`) values are ported; the design system's semantic aliases (`--surface-*`, `--text-*`, `--action-*`, `--border-*`, `--status-*`) are the layer components consume, so those resolved aliases are what `tokens.ts` exposes. Spacing, radius, typography, and motion are theme-agnostic. **Alternative considered:** a runtime OKLCH→RGB conversion library. Rejected — tokens are static; convert once at authoring time to keep the app dependency-free and values inspectable.

### Icon ported via react-native-svg from the glyph path map

The design system Icon renders inline SVG from a `PATHS` map (24×24 viewBox, stroke-based, `currentColor`). Port it to `react-native-svg` reusing the same path data so icon color/size stay theme-driven, rather than shipping the raster PNG assets. Note the design system's `Icon.d.ts` is out of date (declares 14 names) — the `Icon.jsx` `PATHS` map is authoritative (27 names); port the name union from the JSX. Only the icons the login screen and tab bar actually need are required for this change; the rest can be added lazily.

### Button ported to Pressable, props 1:1 from Button.d.ts

Port `variant` (`primary | secondary | ghost | danger`), `size` (`sm | md | lg`), `icon`/`iconPosition`, `loading`, `disabled`, `fullWidth`, and `onPress` (replacing web `onClick`; drop `type`). Web hover/press mouse handlers become Pressable's `pressed` state mapped to the variant's press/hover token. The concrete size and variant→token maps documented in the design system's `Button.jsx` are the reference; match the `button.card.html` visual result with native mechanics.

### Redirect scheme `foodroulette://`

The app registers the `foodroulette://` custom scheme (Expo `scheme` config) for the OAuth redirect. This is the project-standard scheme and is also reserved for the later shared-wheel deep link.

## Keycloak prerequisite (external, not code in this repo)

This is a server-side configuration task on `https://identity.alaasmagi.dev`, required before the flow can succeed. It is **not** a change to any repo in food-app:

- Add a **public** client (e.g. `food-app-mobile`) to the `food-app` realm — public because a native app cannot keep a client secret; PKCE is what replaces the secret.
- Enable Standard Flow (authorization code) and require **PKCE with code challenge method S256**.
- Allow the redirect URI `foodroulette://*` (and register `foodroulette` as a valid post-logout/redirect origin).
- Ensure issued tokens carry `aud = food-api` so the backend's JWT bearer validation (`Audience = "food-api"`) accepts them — via an audience mapper on the mobile client or a client scope that injects the `food-api` audience.
- The existing confidential `food-api` client must **not** be reused for the device (its secret cannot be shipped).

The app reads its Keycloak config (authority/realm/client id/redirect) from app config/env rather than hard-coding, so the client id can be finalized without a code change.

## Risks / Trade-offs

- **Audience mismatch** → A token minted for `food-app-mobile` may not include `food-api` in `aud`, so the backend rejects every API call with 401. Mitigation: configure the audience mapper/client scope as above and verify a real token's `aud` claim against the backend before wiring feature screens.
- **Keycloak client not yet provisioned** → The whole flow fails until the public client exists. Mitigation: document the prerequisite (above) and keep Keycloak values in config so provisioning is decoupled from shipping the code; the login screen and shell can be built and unit-tested against mocks meanwhile.
- **OKLCH→hex conversion drift** → Manual conversion can subtly shift colors from the web reference. Mitigation: convert against the design system's own anchor hex values (`#1A1D21` dark, `#F2F4F6` light from the icon assets) and compare against `*.card.html` visuals.
- **Refresh-loop / thundering herd on 401** → Multiple concurrent requests each triggering a refresh, or a retry that itself 401s. Mitigation: single in-flight refresh promise shared across callers, and exactly one retry before logout.
- **Secure-store on app reinstall / OS migration** → Tokens may be absent or invalid on first launch; the app must treat missing/expired tokens as simply unauthenticated. Mitigation: launch hydration validates presence and routes to login on any failure rather than assuming a session.
- **Design-system folder coupling** → Accidentally importing from `alaasmagi-design-system/` at runtime would break the build once that folder is deleted. Mitigation: port assets/paths into the app's own `src/` and `assets/`; never import the sibling folder.

## Migration Plan

Additive bootstrap; nothing to migrate or roll back in-app. Sequence:

1. Provision the public Keycloak client and audience mapper in the `food-app` realm (external prerequisite).
2. Scaffold the Expo project (TypeScript, Expo Router, `foodroulette://` scheme) and add dependencies.
3. Port `tokens.ts`, then Icon and Button.
4. Build the auth layer (secure-store, PKCE flow, Zustand store, context/provider) and `src/api/client.ts`.
5. Build the `(auth)/login` screen and the `(tabs)` shell + placeholder Dashboard, gated on auth state.
6. Verify end to end against the real realm once the client is provisioned.

Rollback: revert the change; no external state is mutated by the app (Keycloak client provisioning is independent and harmless if left in place).

## Open Questions

- Final mobile client id — is it a new `food-app-mobile` client, or is `food-api` reconfigured/duplicated as public? (Assumed new public client; final id comes from config, not code.)
- Exact scopes to request beyond `openid` (e.g. `offline_access` for a refresh token, plus whatever scope injects the `food-api` audience) — to confirm against the realm setup.
- Whether the login screen needs a logout/deep-link-driven re-auth entry point in this change, or if that is deferred to Settings later. (Assumed deferred.)
