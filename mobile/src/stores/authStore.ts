import { create } from 'zustand';

/**
 * In-app auth state. Pure client state (not server data), so Zustand rather
 * than React Query. It mirrors secure-store — secure-store is the durable
 * source of truth for token bytes; this store is the synchronous, reactive
 * view that drives navigation gating.
 */
export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  status: AuthStatus;
  accessToken: string | null;
  /** Marks the session authenticated and records the current access token. */
  setAuthenticated: (accessToken: string) => void;
  /** Marks the session unauthenticated and drops the access token. */
  setUnauthenticated: () => void;
  /** Updates just the access token (e.g. after a silent refresh). */
  setAccessToken: (accessToken: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  accessToken: null,
  setAuthenticated: (accessToken) => set({ status: 'authenticated', accessToken }),
  setUnauthenticated: () => set({ status: 'unauthenticated', accessToken: null }),
  setAccessToken: (accessToken) => set({ accessToken }),
}));
