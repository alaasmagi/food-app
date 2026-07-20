import { apiFetch } from '@/api/client';
import { parseProblemDetails } from '@/api/errors';
import type { Offer, Restaurant } from '@/types/restaurant';

/**
 * Restaurant API module. Every call goes through the shared authenticated
 * `apiFetch` (bearer + 401 refresh/retry). On ok the body is the bare
 * payload; on error we throw the parsed ProblemDetails.
 */

async function unwrap<T>(res: Response): Promise<T> {
  if (!res.ok) {
    throw await parseProblemDetails(res);
  }
  return (await res.json()) as T;
}

/** GET /api/v1/restaurants — the full shared catalog (offers not included). */
export async function getRestaurants(): Promise<Restaurant[]> {
  const res = await apiFetch('/api/v1/restaurants');
  return unwrap<Restaurant[]>(res);
}

/** GET /api/v1/restaurants/{id}/offers — today's offers for one restaurant. */
export async function getRestaurantOffers(id: string): Promise<Offer[]> {
  const res = await apiFetch(`/api/v1/restaurants/${id}/offers`);
  return unwrap<Offer[]>(res);
}
