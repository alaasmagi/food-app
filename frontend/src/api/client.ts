import { API_BASE_URL } from '../config'
import { useAuthStore } from '../stores/auth'

function resolveUrl(path: string): string {
  return path.startsWith('http') ? path : `${API_BASE_URL}${path}`
}

/**
 * Shared fetch wrapper for every backend call except the token exchange.
 *
 * Attaches `Authorization: Bearer <token>` from the auth store, and sends neither
 * `credentials: "include"` nor a CSRF header (bearer-authorized endpoints are not
 * CSRF-vulnerable). On a 401 it silently calls `fetchToken()` once and retries the
 * original request before returning the (possibly still failing) response.
 */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const auth = useAuthStore()
  const url = resolveUrl(path)

  const send = (): Promise<Response> => {
    const headers = new Headers(init.headers)
    if (auth.token) {
      headers.set('Authorization', `Bearer ${auth.token}`)
    }
    return fetch(url, { ...init, headers, credentials: 'omit' })
  }

  const response = await send()
  if (response.status !== 401) {
    return response
  }

  // Single silent refresh + retry. If the refresh fails, surface the original 401.
  const refreshed = await auth.fetchToken()
  return refreshed ? send() : response
}
