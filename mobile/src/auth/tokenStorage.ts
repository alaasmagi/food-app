import * as SecureStore from 'expo-secure-store';

/**
 * Persists OAuth tokens in the OS secure enclave (iOS Keychain / Android
 * Keystore) via expo-secure-store. Never AsyncStorage or memory-only — these
 * survive backgrounding and app restart. Missing/unreadable values simply read
 * as "no session", which the auth layer treats as unauthenticated.
 */
const ACCESS_TOKEN_KEY = 'foodroulette.accessToken';
const REFRESH_TOKEN_KEY = 'foodroulette.refreshToken';

export type StoredTokens = {
  accessToken: string;
  refreshToken: string | null;
};

export async function saveTokens(tokens: StoredTokens): Promise<void> {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken);
  if (tokens.refreshToken) {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken);
  } else {
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  }
}

export async function getAccessToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function getRefreshToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function clearTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}
