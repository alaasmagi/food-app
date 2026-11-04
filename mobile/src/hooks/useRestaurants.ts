import { useQuery } from '@tanstack/react-query';

import { getRestaurants } from '@/api/restaurants';
import type { Restaurant } from '@/types/restaurant';

export const restaurantsQueryKey = ['restaurants'] as const;

export function useRestaurants() {
  return useQuery<Restaurant[]>({
    queryKey: restaurantsQueryKey,
    queryFn: getRestaurants,
  });
}
