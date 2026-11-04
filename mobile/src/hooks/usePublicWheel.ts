import { useQuery } from '@tanstack/react-query';

import { getPublicWheel } from '@/api/publicWheels';
import type { PublicWheel } from '@/types/wheel';

export const publicWheelQueryKey = (id: string) => ['public-wheel', id] as const;

/** Public wheel for the shared-wheel route; data is `null` on 404, distinct from errors. */
export function usePublicWheel(id: string | undefined) {
  return useQuery<PublicWheel | null>({
    queryKey: publicWheelQueryKey(id ?? ''),
    queryFn: () => getPublicWheel(id as string),
    enabled: !!id,
  });
}
