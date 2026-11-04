import { useQuery } from '@tanstack/react-query';

import { getRestaurantOffers } from '@/api/restaurants';
import type { Offer } from '@/types/restaurant';

export const restaurantOffersQueryKey = (id: string) =>
  ['restaurants', id, 'offers'] as const;

/** Lazily fetches one restaurant's offers; keep disabled until its card is expanded. */
export function useRestaurantOffers(id: string, enabled = false) {
  return useQuery<Offer[]>({
    queryKey: restaurantOffersQueryKey(id),
    queryFn: () => getRestaurantOffers(id),
    enabled,
  });
}
