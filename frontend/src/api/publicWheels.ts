import { API_BASE_URL } from '../config'
import type { PublicWheel } from '../types/wheel'

/** Raw fetch, not apiFetch: the visitor may be logged out, so no bearer token or 401 retry. */
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
