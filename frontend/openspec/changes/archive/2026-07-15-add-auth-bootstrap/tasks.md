## 1. Dependencies and project setup

- [x] 1.1 Add `pinia` and `vue-router` to `package.json` and install
- [x] 1.2 Add a `VITE_API_BASE_URL` env var (e.g. `.env.example` with `https://api.<domain>`) and a small `src/config.ts` that reads `import.meta.env.VITE_API_BASE_URL`, failing loud in dev if unset
- [x] 1.3 Remove Vite starter scaffolding no longer used: `src/components/HelloWorld.vue`, `src/style.css`, and the placeholder `App.vue` content (App.vue is rewritten in section 6)

## 2. Design tokens

- [x] 2.1 Copy `styles.css` and `tokens/*.css` (fonts, colors, typography, spacing) verbatim from `/Users/alaasmagi/Projects/alaasmagi-design-system/` into `src/assets/tokens/`
- [x] 2.2 Import `./assets/tokens/styles.css` once in `main.ts`; confirm no `src/` file references `alaasmagi-design-system/`

## 3. Design-system primitives

- [x] 3.1 Port `Icon` to `src/components/design-system/Icon.vue`: preserve the `IconName` union type, render each glyph as a 24x24 stroke SVG, support `name`/`size`/`strokeWidth`/`color` (default `currentColor`), and self-animate `spinner` via CSS
- [x] 3.2 Port `Button` to `src/components/design-system/forms/Button.vue`: `variant`/`size`/`icon`/`iconPosition`/`loading`/`disabled`/`fullWidth`/`type` per `Button.d.ts`, `<slot />` for content, native `@click`, and `:hover`/`:active`/`:focus-visible` states in `<style scoped>` using only `var(--token-name)`; render `Icon` spinner in place of the icon when `loading`
- [x] 3.3 Add a smoke test per component (Vitest + Vue Test Utils): each `IconName` renders without error; each Button `variant`x`size` renders without error and `loading` blocks click emission

## 4. Auth store and API layer

- [x] 4.1 Add `src/types/` interfaces for the token response (`{ accessToken, expiresAtUtc }`) and `AppUser`, matching the backend Web DTOs
- [x] 4.2 Implement `src/api/account.ts` `fetchToken()` calling `GET /api/v1/account/token` with `credentials: "include"` (the only such call), returning the token DTO
- [x] 4.3 Implement `src/stores/auth.ts` (Pinia): in-memory `token`, `currentUser`, `isAuthenticated`, `hasRole(role)`, and `login()`/`logout()`/`fetchToken()` actions; never touch `localStorage`/`sessionStorage`; de-duplicate in-flight `fetchToken()` calls behind a shared pending promise
- [x] 4.4 Implement `src/api/client.ts` shared fetch wrapper: attach `Authorization: Bearer <token>` on every call except the token exchange, no `credentials: "include"` and no CSRF header on bearer calls, and on 401 call `fetchToken()` once and retry before surfacing the error
- [x] 4.5 Implement `login()`/`logout()` as full-page navigations: `window.location.href` to `https://api.<domain>/account/login?returnUrl=<current-url>` and `.../account/logout`; clear the in-memory token before logout navigation
- [x] 4.6 Add tests for the auth store and client wrapper: bearer attached, token not persisted, 401 triggers a single silent refresh + retry, and a second 401 surfaces the error

## 5. Router and views

- [x] 5.1 Set up `src/router/` (Vue Router) with routes for the login view and the guarded dashboard
- [x] 5.2 Add a navigation guard that calls `fetchToken()` when the store is empty, allows entry when authenticated, and redirects to the in-app login view when still unauthenticated (login view initiates the full-page backend flow)
- [x] 5.3 Add `src/views/LoginView.vue`: a single "Log in" `Button` that triggers the login navigation; sentence-case copy, no exclamation points/em-dashes/emoji
- [x] 5.4 Add `src/views/DashboardView.vue`: empty placeholder behind the guard
- [x] 5.5 Add a test for the guard: empty store triggers `fetchToken()`; authenticated proceeds; unauthenticated redirects to login

## 6. App shell and wiring

- [x] 6.1 Add a minimal dark-theme shell layout component: header with app name plus a logout button built from the ported `Button` + `Icon`, wired to `auth.logout()`
- [x] 6.2 Rewrite `App.vue` to render the shell + `<router-view />`; register Pinia and the router in `main.ts`
- [x] 6.3 Manually verify the end-to-end flow: unauthenticated -> login view -> backend login -> return -> silent token exchange -> dashboard renders -> logout clears token and navigates to backend logout (verified at logic level via guard/store/client tests + dev-server boot; live backend round-trip needs a running backend)

## 7. Verification

- [x] 7.1 Run `vue-tsc`/`vite build` and the Vitest suite; confirm type-check, build, and tests pass
- [x] 7.2 Grep `src/` for any import/`@import`/relative path into `alaasmagi-design-system/` and confirm there are none
