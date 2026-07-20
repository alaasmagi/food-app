import { useQuery } from '@tanstack/react-query';

import { getRestaurants } from '@/api/restaurants';
import type { Restaurant } from '@/types/restaurant';

/** Query key for the shared restaurant catalog. */
export const restaurantsQueryKey = ['restaurants'] as const;

/** Fetches and caches the full shared restaurant catalog. */
export function useRestaurants() {
  return useQuery<Restaurant[]>({
    queryKey: restaurantsQueryKey,
    queryFn: getRestaurants,
  });
}
