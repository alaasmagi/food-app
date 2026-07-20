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
 * Create-or-update a favourite. There is no upsert endpoint, so the decision is
 * made client-side against the cached favourites: if one already exists for the
 * restaurant we PUT it with its concurrency token as `If-Match`, otherwise we
 * POST a new one. On success the favourites query is invalidated so the cached
 * list and the card's rating display refresh (with the new concurrency token).
 * The existing favourite is read from the cache at call time to avoid a stale
 * closure.
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
