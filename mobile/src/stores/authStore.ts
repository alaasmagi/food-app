import { create } from 'zustand';

/** In-app auth state: a synchronous view of secure-store that drives navigation gating. */
export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  status: AuthStatus;
  accessToken: string | null;
  setAuthenticated: (accessToken: string) => void;
  setUnauthenticated: () => void;
  setAccessToken: (accessToken: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  accessToken: null,
  setAuthenticated: (accessToken) => set({ status: 'authenticated', accessToken }),
  setUnauthenticated: () => set({ status: 'unauthenticated', accessToken: null }),
  setAccessToken: (accessToken) => set({ accessToken }),
}));
