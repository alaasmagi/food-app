import { publicFetch } from '@/api/client';
import { parseProblemDetails } from '@/api/errors';
import type { PublicWheel } from '@/types/wheel';

/** Fetches a public wheel without auth (the visitor may be logged out); resolves `null` on 404. */
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
