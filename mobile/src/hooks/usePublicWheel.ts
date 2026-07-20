import { useQuery } from '@tanstack/react-query';

import { getPublicWheel } from '@/api/publicWheels';
import type { PublicWheel } from '@/types/wheel';

/** Per-id query key for a public (shared) wheel. */
export const publicWheelQueryKey = (id: string) => ['public-wheel', id] as const;

/**
 * Fetches a public wheel for the shared deep-link route. Enabled only once an
 * id is present. The query data is `PublicWheel | null` — `null` is the
 * resolved not-found (404) state, distinct from the loading/error states, so
 * the route can render a friendly "not available" message.
 */
export function usePublicWheel(id: string | undefined) {
  return useQuery<PublicWheel | null>({
    queryKey: publicWheelQueryKey(id ?? ''),
    queryFn: () => getPublicWheel(id as string),
    enabled: !!id,
  });
}
