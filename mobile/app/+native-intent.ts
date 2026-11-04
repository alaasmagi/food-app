/**
 * Sends the Keycloak OAuth callback to the root: expo-auth-session consumes it and
 * expo-router has no screen for it ("Unmatched Route"). Other deep links pass through.
 */
export function redirectSystemPath({ path }: { path: string; initial: boolean }): string {
  if (path.includes('oauth/callback')) {
    return '/'
  }
  return path
}
