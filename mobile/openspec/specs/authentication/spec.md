# authentication Specification

## Purpose

Native OAuth 2.0 Authorization Code + PKCE authentication against the food-app Keycloak realm, including secure token storage, an auth context/store that gates navigation, and a shared authenticated request helper with silent refresh. (Purpose is brief - refine as the capability grows.)

## Requirements

### Requirement: Native OAuth PKCE sign-in

The app SHALL authenticate the user via OAuth 2.0 Authorization Code flow with PKCE (S256) directly against the food-app Keycloak realm, using expo-auth-session and the system browser. No client secret SHALL be stored in the app.

#### Scenario: User starts sign-in

- **WHEN** the user taps "Log in" on the login screen
- **THEN** the app generates a PKCE code verifier and challenge and opens the Keycloak authorize URL in the system browser

#### Scenario: Authorization code exchange succeeds

- **WHEN** Keycloak redirects back to the app's `foodroulette://` redirect URI with an authorization code
- **THEN** the app exchanges the code (with the PKCE verifier) at the Keycloak token endpoint for an access token and refresh token
- **AND** the resulting session is marked authenticated

#### Scenario: User cancels the browser flow

- **WHEN** the user dismisses the system browser without completing sign-in
- **THEN** the app returns to the login screen and remains unauthenticated with no error surfaced as a crash

### Requirement: Secure token storage

The app SHALL persist the access token and refresh token in expo-secure-store (iOS Keychain / Android Keystore) and SHALL NOT store them in AsyncStorage or memory-only storage that is lost on backgrounding.

#### Scenario: Tokens persisted after sign-in

- **WHEN** the token exchange succeeds
- **THEN** the access token and refresh token are written to expo-secure-store

#### Scenario: Session restored on app launch

- **WHEN** the app launches and valid tokens exist in expo-secure-store
- **THEN** the app starts in the authenticated state without prompting the user to sign in again

#### Scenario: Tokens cleared on logout

- **WHEN** the user logs out
- **THEN** the access token and refresh token are removed from expo-secure-store

### Requirement: Auth context and store

The app SHALL expose an auth context/provider offering `isAuthenticated`, `login()`, `logout()`, and the current access token, backed by a Zustand store that mirrors secure-store and drives navigation gating.

#### Scenario: Auth state drives navigation

- **WHEN** `isAuthenticated` changes
- **THEN** navigation reflects the new state (authenticated users see the tab shell, unauthenticated users see the login screen)

#### Scenario: login and logout are exposed

- **WHEN** a screen calls `login()` or `logout()`
- **THEN** the auth store and secure-store are updated consistently and the current access token reflects the result

### Requirement: Authenticated API request helper

The app SHALL provide a shared request helper in `src/api/client.ts` that attaches `Authorization: Bearer <access token>` to every authenticated request. On a 401 it SHALL perform exactly one silent refresh using the refresh token and retry the original request; if the refresh fails it SHALL log the user out.

#### Scenario: Bearer token attached

- **WHEN** an authenticated request is made through the helper
- **THEN** the current access token is attached as an `Authorization: Bearer` header

#### Scenario: Silent refresh and retry on 401

- **WHEN** an authenticated request returns 401 and a refresh token is available
- **THEN** the helper requests a new access token from the Keycloak token endpoint, updates secure-store, and retries the original request once

#### Scenario: Refresh failure logs out

- **WHEN** the silent refresh fails (or no refresh token is available)
- **THEN** the helper clears secure-store, sets the auth state to unauthenticated, and the user is routed to the login screen
