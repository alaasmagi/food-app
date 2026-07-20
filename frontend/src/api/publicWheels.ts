import { API_BASE_URL } from '../config'
import type { PublicWheel } from '../types/wheel'

/**
 * Fetch a public wheel for the shared-wheel view.
 *
 * This deliberately does NOT go through the shared `apiFetch` wrapper: the caller
 * may be a logged-out visitor, so it uses a raw `fetch` with no `Authorization`
 * header and no 401 token-refresh retry.
 *
 * Resolves to a `PublicWheel` on 200, to `null` on 404 (so callers can show a
 * not-found state), and rejects on any other non-ok status.
 */
export async function getPublicWheel(id: string): Promise<PublicWheel | null> {
  const response = await fetch(`${API_BASE_URL}/api/v1/public/wheels/${id}`, {
    method: 'GET',
    credentials: 'omit',
    headers: { Accept: 'application/json' },
  })

  if (response.status === 404) {
    return null
  }
  if (!response.ok) {
    throw new Error(`Failed to load public wheel (${response.status})`)
  }

  return (await response.json()) as PublicWheel
}
