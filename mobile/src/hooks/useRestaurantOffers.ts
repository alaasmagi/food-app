import { useQuery } from '@tanstack/react-query';

import { getRestaurantOffers } from '@/api/restaurants';
import type { Offer } from '@/types/restaurant';

/** Per-restaurant offers query key. */
export const restaurantOffersQueryKey = (id: string) =>
  ['restaurants', id, 'offers'] as const;

/**
 * Lazily fetches one restaurant's offers. Pass `enabled: false` (the default)
 * until the card is expanded so no request is made for collapsed cards, and
 * React Query caches results per id.
 */
export function useRestaurantOffers(id: string, enabled = false) {
  return useQuery<Offer[]>({
    queryKey: restaurantOffersQueryKey(id),
    queryFn: () => getRestaurantOffers(id),
    enabled,
  });
}
