import { QueryClient } from '@tanstack/react-query';

/**
 * Single app-wide React Query client. React Query's cache is the source of
 * truth for server data (restaurants, offers, ...); Zustand is reserved for
 * pure client state. Retries are kept low so a failed auth-gated request
 * surfaces quickly rather than hammering the backend.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  },
});
