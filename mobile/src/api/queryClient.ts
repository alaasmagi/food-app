import { QueryClient } from '@tanstack/react-query';

/** App-wide React Query client; low retries so failed auth-gated requests surface quickly. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  },
});
