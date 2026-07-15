import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from './auth'

const FUTURE = '2999-01-01T00:00:00.000Z'
const PAST = '2000-01-01T00:00:00.000Z'

function tokenResponse(accessToken: string, expiresAtUtc = FUTURE) {
  return new Response(JSON.stringify({ accessToken, expiresAtUtc }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('auth store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    sessionStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('is unauthenticated by default', () => {
    const auth = useAuthStore()
    expect(auth.token).toBeNull()
    expect(auth.isAuthenticated).toBe(false)
  })

  it('is authenticated with a non-expired token and unauthenticated once expired', () => {
    const auth = useAuthStore()
    auth.token = 'tok'
    auth.expiresAtUtc = FUTURE
    expect(auth.isAuthenticated).toBe(true)
    auth.expiresAtUtc = PAST
    expect(auth.isAuthenticated).toBe(false)
  })

  it('fetchToken stores the token in memory only, never in web storage', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(tokenResponse('mem-token')),
    )

    const auth = useAuthStore()
    const ok = await auth.fetchToken()

    expect(ok).toBe(true)
    expect(auth.token).toBe('mem-token')
    expect(localStorage.length).toBe(0)
    expect(sessionStorage.length).toBe(0)
  })

  it('de-duplicates concurrent fetchToken calls into one request', async () => {
    const fetchMock = vi.fn().mockResolvedValue(tokenResponse('once'))
    vi.stubGlobal('fetch', fetchMock)

    const auth = useAuthStore()
    const [a, b] = await Promise.all([auth.fetchToken(), auth.fetchToken()])

    expect(a).toBe(true)
    expect(b).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('fetchToken clears state and returns false on 401', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 401 })))

    const auth = useAuthStore()
    auth.token = 'stale'
    const ok = await auth.fetchToken()

    expect(ok).toBe(false)
    expect(auth.token).toBeNull()
    expect(auth.isAuthenticated).toBe(false)
  })

  it('hasRole reflects roles decoded from the access token', async () => {
    // JWT with realm_access.roles = ["admin"], base64url payload, unsigned (header.payload.sig)
    const payload = btoa(JSON.stringify({ realm_access: { roles: ['admin'] } }))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(tokenResponse(`h.${payload}.s`)))

    const auth = useAuthStore()
    await auth.fetchToken()

    expect(auth.hasRole('admin')).toBe(true)
    expect(auth.hasRole('nope')).toBe(false)
  })

  it('login navigates the whole window to the backend login flow with returnUrl', () => {
    const location = { href: 'https://app.test.local/dashboard' }
    Object.defineProperty(window, 'location', { value: location, writable: true })

    useAuthStore().login()

    expect(location.href).toBe(
      'https://api.test.local/account/login?returnUrl=' +
        encodeURIComponent('https://app.test.local/dashboard'),
    )
  })

  it('logout clears the token then navigates to the backend logout flow', () => {
    const location = { href: 'https://app.test.local/dashboard' }
    Object.defineProperty(window, 'location', { value: location, writable: true })

    const auth = useAuthStore()
    auth.token = 'tok'
    auth.logout()

    expect(auth.token).toBeNull()
    expect(location.href).toBe('https://api.test.local/account/logout')
  })
})
