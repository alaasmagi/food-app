import { useQuery } from '@tanstack/react-query';

import { getWheels } from '@/api/wheels';
import type { UserWheel } from '@/types/wheel';

export const wheelsQueryKey = ['wheels'] as const;

export function useWheels() {
  return useQuery<UserWheel[]>({
    queryKey: wheelsQueryKey,
    queryFn: getWheels,
  });
}
