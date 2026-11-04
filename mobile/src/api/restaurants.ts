import { apiFetch } from '@/api/client';
import { parseProblemDetails } from '@/api/errors';
import type { Offer, Restaurant } from '@/types/restaurant';

/** Restaurant catalog and offers API. */

async function unwrap<T>(res: Response): Promise<T> {
  if (!res.ok) {
    throw await parseProblemDetails(res);
  }
  return (await res.json()) as T;
}

export async function getRestaurants(): Promise<Restaurant[]> {
  const res = await apiFetch('/api/v1/restaurants');
  return unwrap<Restaurant[]>(res);
}

export async function getRestaurantOffers(id: string): Promise<Offer[]> {
  const res = await apiFetch(`/api/v1/restaurants/${id}/offers`);
  return unwrap<Offer[]>(res);
}
