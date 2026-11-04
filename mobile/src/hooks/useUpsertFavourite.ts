import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createFavourite, updateFavourite, type FavouriteInput } from '@/api/favourites';
import { favouritesQueryKey } from '@/hooks/useFavourites';
import type { Favourite } from '@/types/favourite';

export interface UpsertFavouriteVars {
  restaurantId: string;
  rating: number;
  note: string | null;
}

/**
 * Create-or-update a favourite: no upsert endpoint exists, so it PUTs (with If-Match) when one is
 * cached for the restaurant, else POSTs. Reads the cache at call time to avoid a stale closure.
 */
export function useUpsertFavourite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: UpsertFavouriteVars): Promise<Favourite> => {
      const list = qc.getQueryData<Favourite[]>(favouritesQueryKey) ?? [];
      const existing = list.find((f) => f.restaurantId === vars.restaurantId);
      const input: FavouriteInput = {
        restaurantId: vars.restaurantId,
        rating: vars.rating,
        note: vars.note,
      };
      return existing
        ? updateFavourite(existing.id, input, existing.concurrencyToken)
        : createFavourite(input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: favouritesQueryKey }),
  });
}
