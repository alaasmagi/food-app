import React, { createContext, useCallback, useContext, useEffect } from 'react';
import {
  exchangeCodeAsync,
  makeRedirectUri,
  useAuthRequest,
  useAutoDiscovery,
} from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

import { config } from '@/config/env';
import { signOut } from '@/auth/session';
import { getAccessToken, saveTokens } from '@/auth/tokenStorage';
import { useAuthStore } from '@/stores/authStore';

// Required so the system browser can hand the redirect back to the app.
WebBrowser.maybeCompleteAuthSession();

interface AuthContextValue {
  isAuthenticated: boolean;
  accessToken: string | null;
  /** Starts the OAuth PKCE flow in the system browser. */
  login: () => Promise<void>;
  /** Clears the session and returns to unauthenticated. */
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const status = useAuthStore((s) => s.status);
  const accessToken = useAuthStore((s) => s.accessToken);
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated);
  const setUnauthenticated = useAuthStore((s) => s.setUnauthenticated);

  const discovery = useAutoDiscovery(config.keycloak.issuer);
  const redirectUri = makeRedirectUri({
    scheme: config.keycloak.redirectScheme,
    path: 'oauth/callback',
  });

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: config.keycloak.clientId,
      scopes: [...config.keycloak.scopes],
      redirectUri,
      usePKCE: true,
    },
    discovery,
  );

  // Restore any existing session from secure-store on launch.
  useEffect(() => {
    let active = true;
    (async () => {
      const token = await getAccessToken();
      if (!active) return;
      if (token) {
        setAuthenticated(token);
      } else {
        setUnauthenticated();
      }
    })();
    return () => {
      active = false;
    };
  }, [setAuthenticated, setUnauthenticated]);

  // Handle the redirect: exchange the code (with PKCE verifier) for tokens.
  useEffect(() => {
    if (!response) return;
    // 'cancel' / 'dismiss' / 'error' need no action — the user stays on login.
    if (response.type !== 'success' || !discovery || !request) return;

    const code = response.params.code;
    if (!code) return;

    (async () => {
      try {
        const tokenResult = await exchangeCodeAsync(
          {
            clientId: config.keycloak.clientId,
            code,
            redirectUri,
            extraParams: request.codeVerifier
              ? { code_verifier: request.codeVerifier }
              : {},
          },
          discovery,
        );
        await saveTokens({
          accessToken: tokenResult.accessToken,
          refreshToken: tokenResult.refreshToken ?? null,
        });
        setAuthenticated(tokenResult.accessToken);
      } catch {
        // Exchange failed — remain unauthenticated rather than crash.
        setUnauthenticated();
      }
    })();
  }, [response, discovery, request, redirectUri, setAuthenticated, setUnauthenticated]);

  const login = useCallback(async () => {
    await promptAsync();
  }, [promptAsync]);

  const logout = useCallback(async () => {
    await signOut();
  }, []);

  const value: AuthContextValue = {
    isAuthenticated: status === 'authenticated',
    accessToken,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
