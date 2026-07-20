import { config } from '@/config/env';
import { clearTokens, getRefreshToken, saveTokens } from '@/auth/tokenStorage';
import { useAuthStore } from '@/stores/authStore';

/**
 * Session lifecycle helpers shared by the API client and the auth provider,
 * kept separate so the client never imports React context. `refreshAccessToken`
 * de-duplicates concurrent callers onto a single in-flight request.
 */

let refreshPromise: Promise<string> | null = null;

/** Clears stored tokens and flips in-app state to unauthenticated. */
export async function signOut(): Promise<void> {
  await clearTokens();
  useAuthStore.getState().setUnauthenticated();
}

async function requestRefresh(): Promise<string> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: config.keycloak.clientId,
    refresh_token: refreshToken,
  }).toString();

  const res = await fetch(config.keycloak.tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!res.ok) {
    throw new Error(`Token refresh failed with status ${res.status}`);
  }

  const json = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
  };
  if (!json.access_token) {
    throw new Error('Token refresh response missing access_token');
  }

  await saveTokens({
    accessToken: json.access_token,
    // Keycloak rotates refresh tokens; fall back to the existing one if absent.
    refreshToken: json.refresh_token ?? refreshToken,
  });
  useAuthStore.getState().setAccessToken(json.access_token);
  return json.access_token;
}

/**
 * Exchanges the stored refresh token for a fresh access token. Concurrent
 * calls share one in-flight promise so a burst of 401s triggers a single
 * refresh. Throws if there is no refresh token or the exchange fails.
 */
export function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = requestRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}
