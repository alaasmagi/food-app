import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { getFavourites } from '@/api/favourites';
import type { Favourite } from '@/types/favourite';

/** Query key for the current user's favourites. */
export const favouritesQueryKey = ['favourites'] as const;

/** `restaurantId -> Favourite` for O(1) per-restaurant lookup. */
export type FavouriteMap = Record<string, Favourite>;

/** Builds the `restaurantId -> Favourite` map from the cached list. */
export function favouriteMap(favourites: Favourite[]): FavouriteMap {
  const map: FavouriteMap = {};
  for (const f of favourites) {
    map[f.restaurantId] = f;
  }
  return map;
}

/**
 * Fetches and caches the current user's favourites, and exposes a memoized
 * `favouriteFor(restaurantId)` lookup so a card can answer "am I favourited?"
 * without a network call.
 */
export function useFavourites() {
  const query = useQuery<Favourite[]>({
    queryKey: favouritesQueryKey,
    queryFn: getFavourites,
  });

  const map = useMemo(() => favouriteMap(query.data ?? []), [query.data]);
  const favouriteFor = useMemo(
    () =>
      (restaurantId: string): Favourite | undefined =>
        map[restaurantId],
    [map],
  );

  return { ...query, favouriteFor, favouriteMap: map };
}
