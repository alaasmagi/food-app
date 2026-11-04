import { useQuery } from '@tanstack/react-query';

import { getEnvironments } from '@/api/environments';
import type { DiningEnvironment } from '@/types/environment';

export const environmentsQueryKey = ['environments'] as const;

export function useEnvironments() {
  return useQuery<DiningEnvironment[]>({
    queryKey: environmentsQueryKey,
    queryFn: getEnvironments,
  });
}
