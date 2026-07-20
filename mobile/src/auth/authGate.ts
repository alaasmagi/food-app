import type { AuthStatus } from '@/stores/authStore';

/** Where the auth gate should redirect for a given status + route, or null to stay. */
export type AuthRedirect = '/(auth)/login' | '/(tabs)' | null;

/**
 * Pure decision for the auth navigation gate. Returns the route to redirect to,
 * or `null` to stay put. While `loading` it stays put (secure-store is still
 * hydrating). The public shared-wheel route `w/[id]` is exempt so a logged-out
 * visitor opening a share link is never bounced to login.
 */
export function authRedirectTarget(status: AuthStatus, segments: string[]): AuthRedirect {
  if (status === 'loading') return null;

  // Public routes bypass the gate entirely.
  if (segments[0] === 'w') return null;

  const inAuthGroup = segments[0] === '(auth)';
  if (status === 'unauthenticated' && !inAuthGroup) return '/(auth)/login';
  if (status === 'authenticated' && inAuthGroup) return '/(tabs)';
  return null;
}
