import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { apiFetch } from './client'
import { useAuthStore } from '../stores/auth'

const FUTURE = '2999-01-01T00:00:00.000Z'

function tokenResponse(accessToken: string) {
  return new Response(JSON.stringify({ accessToken, expiresAtUtc: FUTURE }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('apiFetch', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
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

  it('on 401 silently refreshes once and retries', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('', { status: 401 })) // initial call
      .mockResolvedValueOnce(tokenResponse('refreshed')) // token exchange
      .mockResolvedValueOnce(new Response('{}', { status: 200 })) // retry
    vi.stubGlobal('fetch', fetchMock)

    const auth = useAuthStore()
    auth.token = 'stale'

    const res = await apiFetch('/api/v1/thing')

    expect(res.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(auth.token).toBe('refreshed')
    // retry carried the refreshed bearer
    const [, retryInit] = fetchMock.mock.calls[2]
    expect(new Headers(retryInit.headers).get('Authorization')).toBe('Bearer refreshed')
  })

  it('surfaces the error when the retry still returns 401', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('', { status: 401 })) // initial
      .mockResolvedValueOnce(tokenResponse('refreshed')) // token exchange
      .mockResolvedValueOnce(new Response('', { status: 401 })) // retry still 401
    vi.stubGlobal('fetch', fetchMock)

    const res = await apiFetch('/api/v1/thing')

    expect(res.status).toBe(401)
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('does not retry when the refresh itself fails', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('', { status: 401 })) // initial
      .mockResolvedValueOnce(new Response('', { status: 401 })) // token exchange also 401
    vi.stubGlobal('fetch', fetchMock)

    const res = await apiFetch('/api/v1/thing')

    expect(res.status).toBe(401)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
