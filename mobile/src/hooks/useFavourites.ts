import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { getFavourites } from '@/api/favourites';
import type { Favourite } from '@/types/favourite';

export const favouritesQueryKey = ['favourites'] as const;

export type FavouriteMap = Record<string, Favourite>;

export function favouriteMap(favourites: Favourite[]): FavouriteMap {
  const map: FavouriteMap = {};
  for (const f of favourites) {
    map[f.restaurantId] = f;
  }
  return map;
}

/** Current user's favourites plus a memoized `favouriteFor(restaurantId)` lookup. */
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
