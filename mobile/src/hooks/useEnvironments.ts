import { useQuery } from '@tanstack/react-query';

import { getEnvironments } from '@/api/environments';
import type { DiningEnvironment } from '@/types/environment';

/** Query key for the current user's dining environments. */
export const environmentsQueryKey = ['environments'] as const;

/** Fetches and caches the current user's dining environments. */
export function useEnvironments() {
  return useQuery<DiningEnvironment[]>({
    queryKey: environmentsQueryKey,
    queryFn: getEnvironments,
  });
}
