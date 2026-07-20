import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { apiFetch } from './client'
import { useAuthStore } from '../stores/auth'
import * as keycloak from '../auth/keycloak'

describe('apiFetch', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('attaches the bearer token and sends no credentials', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const auth = useAuthStore()
    auth.token = 'tok-123'

    await apiFetch('/api/v1/thing')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [, init] = fetchMock.mock.calls[0]
    expect(new Headers(init.headers).get('Authorization')).toBe('Bearer tok-123')
    expect(init.credentials).toBe('omit')
  })

  it('does not attach an Authorization header when there is no token', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    await apiFetch('/api/v1/thing')

    const [, init] = fetchMock.mock.calls[0]
    expect(new Headers(init.headers).get('Authorization')).toBeNull()
  })

  it('on 401 silently refreshes via Keycloak once and retries', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('', { status: 401 })) // initial call
      .mockResolvedValueOnce(new Response('{}', { status: 200 })) // retry
    vi.stubGlobal('fetch', fetchMock)

    // Refresh yields a new token, mirrored into the store by fetchToken.
    vi.spyOn(keycloak, 'refreshToken').mockResolvedValue(true)
    vi.spyOn(keycloak, 'getToken').mockReturnValue('refreshed')
    vi.spyOn(keycloak, 'getExpiresAtUtc').mockReturnValue('2999-01-01T00:00:00.000Z')

    const auth = useAuthStore()
    auth.token = 'stale'

    const res = await apiFetch('/api/v1/thing')

    expect(res.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(auth.token).toBe('refreshed')
    // retry carried the refreshed bearer
    const [, retryInit] = fetchMock.mock.calls[1]
    expect(new Headers(retryInit.headers).get('Authorization')).toBe('Bearer refreshed')
  })

  it('surfaces the error when the retry still returns 401', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('', { status: 401 })) // initial
      .mockResolvedValueOnce(new Response('', { status: 401 })) // retry still 401
    vi.stubGlobal('fetch', fetchMock)

    vi.spyOn(keycloak, 'refreshToken').mockResolvedValue(true)
    vi.spyOn(keycloak, 'getToken').mockReturnValue('refreshed')
    vi.spyOn(keycloak, 'getExpiresAtUtc').mockReturnValue('2999-01-01T00:00:00.000Z')

    const res = await apiFetch('/api/v1/thing')

    expect(res.status).toBe(401)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('does not retry when the Keycloak refresh itself fails', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response('', { status: 401 })) // initial
    vi.stubGlobal('fetch', fetchMock)

    vi.spyOn(keycloak, 'refreshToken').mockResolvedValue(false)

    const res = await apiFetch('/api/v1/thing')

    expect(res.status).toBe(401)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
