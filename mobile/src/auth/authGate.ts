import type { AuthStatus } from '@/stores/authStore';

export type AuthRedirect = '/(auth)/login' | '/(tabs)' | null;

/** Auth navigation gate: the redirect target for a status + route, or null to stay (always while loading). */
export function authRedirectTarget(status: AuthStatus, segments: string[]): AuthRedirect {
  if (status === 'loading') return null;

  // Shared-wheel links must work for logged-out visitors.
  if (segments[0] === 'w') return null;

  const inAuthGroup = segments[0] === '(auth)';
  if (status === 'unauthenticated' && !inAuthGroup) return '/(auth)/login';
  if (status === 'authenticated' && inAuthGroup) return '/(tabs)';
  return null;
}
