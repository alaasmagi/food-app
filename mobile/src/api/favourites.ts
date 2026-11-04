import { apiFetch } from '@/api/client';
import { parseProblemDetails } from '@/api/errors';
import type { Favourite } from '@/types/favourite';

/** Favourites API; there is no upsert endpoint, so create-or-update is decided in useUpsertFavourite. */

const FAVOURITES = '/api/v1/favourites';
const JSON_HEADERS = { 'Content-Type': 'application/json' };

export interface FavouriteInput {
  restaurantId: string;
  rating: number;
  note: string | null;
}

async function unwrap<T>(res: Response): Promise<T> {
  if (!res.ok) {
    throw await parseProblemDetails(res);
  }
  return (await res.json()) as T;
}

export async function getFavourites(): Promise<Favourite[]> {
  const res = await apiFetch(FAVOURITES);
  return unwrap<Favourite[]>(res);
}

export async function createFavourite(input: FavouriteInput): Promise<Favourite> {
  const res = await apiFetch(FAVOURITES, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(input),
  });
  return unwrap<Favourite>(res);
}

export async function updateFavourite(
  id: string,
  input: FavouriteInput,
  concurrencyToken: string,
): Promise<Favourite> {
  const res = await apiFetch(`${FAVOURITES}/${id}`, {
    method: 'PUT',
    headers: { ...JSON_HEADERS, 'If-Match': concurrencyToken },
    body: JSON.stringify({ id, ...input }),
  });
  return unwrap<Favourite>(res);
}
