/**
 * Native deep-link interceptor (expo-router).
 *
 * The Keycloak OAuth redirect `foodroulette://oauth/callback?code=...` is consumed
 * by expo-auth-session's own Linking listener, which exchanges the code for tokens.
 * expo-router must NOT also try to render it as a route - there is no such screen,
 * so it would show "Unmatched Route". Send those links to the root and let the auth
 * flow (and the auth gate in app/_layout.tsx) take over once tokens are stored.
 *
 * Every other deep link passes through unchanged, e.g. the public shared-wheel
 * link `foodroulette://w/<id>`.
 */
export function redirectSystemPath({ path }: { path: string; initial: boolean }): string {
  if (path.includes('oauth/callback')) {
    return '/'
  }
  return path
}
