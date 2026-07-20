import { apiFetch } from '@/api/client';
import { parseProblemDetails } from '@/api/errors';
import type { Favourite } from '@/types/favourite';

/**
 * Favourites API module. Every call goes through the shared authenticated
 * `apiFetch` (bearer + 401 refresh/retry). On ok the body is the bare payload;
 * on error we throw the parsed ProblemDetails, which React Query surfaces
 * without crashing the screen (including the user-scoped 403 case).
 *
 * There is no dedicated upsert endpoint: create via POST, explicit update via
 * PUT with the favourite's concurrency token as `If-Match`. The create-or-update
 * decision is made client-side in the upsert hook.
 */

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

/** GET /api/v1/favourites — the current user's favourites. */
export async function getFavourites(): Promise<Favourite[]> {
  const res = await apiFetch(FAVOURITES);
  return unwrap<Favourite[]>(res);
}

/** POST /api/v1/favourites — create a favourite for a restaurant. */
export async function createFavourite(input: FavouriteInput): Promise<Favourite> {
  const res = await apiFetch(FAVOURITES, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(input),
  });
  return unwrap<Favourite>(res);
}

/** PUT /api/v1/favourites/{id} — explicit update, sending If-Match. */
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
