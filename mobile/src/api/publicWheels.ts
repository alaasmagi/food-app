import { publicFetch } from '@/api/client';
import { parseProblemDetails } from '@/api/errors';
import type { PublicWheel } from '@/types/wheel';

/**
 * Fetch a public wheel for the shared-wheel deep-link route.
 *
 * This deliberately uses `publicFetch` (not the authenticated `apiFetch`): the
 * caller may be a logged-out visitor, so there is no `Authorization` header and
 * no 401 token-refresh retry. Resolves to a `PublicWheel` on 200, to `null` on
 * 404 (so the route can show a friendly not-found state), and rejects on any
 * other non-ok status.
 */
export async function getPublicWheel(id: string): Promise<PublicWheel | null> {
  const res = await publicFetch(`/api/v1/public/wheels/${id}`, {
    headers: { Accept: 'application/json' },
  });

  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw await parseProblemDetails(res);
  }
  return (await res.json()) as PublicWheel;
}
