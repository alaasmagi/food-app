import { config } from '@/config/env';
import { clearTokens, getRefreshToken, saveTokens } from '@/auth/tokenStorage';
import { useAuthStore } from '@/stores/authStore';

/** Session helpers shared by the API client and auth provider, kept free of React context. */

let refreshPromise: Promise<string> | null = null;

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

// Concurrent callers share one in-flight refresh so a burst of 401s triggers a single exchange.
export function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = requestRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}
