import { useQuery } from '@tanstack/react-query';

import { getWheels } from '@/api/wheels';
import type { UserWheel } from '@/types/wheel';

/** Query key for the current user's saved wheels. */
export const wheelsQueryKey = ['wheels'] as const;

/** Fetches and caches the current user's saved wheels. */
export function useWheels() {
  return useQuery<UserWheel[]>({
    queryKey: wheelsQueryKey,
    queryFn: getWheels,
  });
}
