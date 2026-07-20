import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from './auth'
import * as keycloak from '../auth/keycloak'

const FUTURE = '2999-01-01T00:00:00.000Z'
const PAST = '2000-01-01T00:00:00.000Z'

// Unsigned JWT (header.payload.sig) carrying realm_access.roles.
function jwt(roles: string[]): string {
  const payload = btoa(JSON.stringify({ realm_access: { roles } }))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
  return `h.${payload}.s`
}

describe('auth store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    sessionStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
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

  it('fetchToken mirrors the Keycloak token into memory only, never in web storage', async () => {
    vi.spyOn(keycloak, 'refreshToken').mockResolvedValue(true)
    vi.spyOn(keycloak, 'getToken').mockReturnValue('mem-token')
    vi.spyOn(keycloak, 'getExpiresAtUtc').mockReturnValue(FUTURE)

    const auth = useAuthStore()
    const ok = await auth.fetchToken()

    expect(ok).toBe(true)
    expect(auth.token).toBe('mem-token')
    expect(localStorage.length).toBe(0)
    expect(sessionStorage.length).toBe(0)
  })

  it('de-duplicates concurrent fetchToken calls into one refresh', async () => {
    const refresh = vi.spyOn(keycloak, 'refreshToken').mockResolvedValue(true)
    vi.spyOn(keycloak, 'getToken').mockReturnValue('once')
    vi.spyOn(keycloak, 'getExpiresAtUtc').mockReturnValue(FUTURE)

    const auth = useAuthStore()
    const [a, b] = await Promise.all([auth.fetchToken(), auth.fetchToken()])

    expect(a).toBe(true)
    expect(b).toBe(true)
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('fetchToken clears state and returns false when the refresh fails', async () => {
    vi.spyOn(keycloak, 'refreshToken').mockResolvedValue(false)

    const auth = useAuthStore()
    auth.token = 'stale'
    const ok = await auth.fetchToken()

    expect(ok).toBe(false)
    expect(auth.token).toBeNull()
    expect(auth.isAuthenticated).toBe(false)
  })

  it('hasRole reflects roles decoded from the Keycloak access token', async () => {
    vi.spyOn(keycloak, 'refreshToken').mockResolvedValue(true)
    vi.spyOn(keycloak, 'getToken').mockReturnValue(jwt(['admin']))
    vi.spyOn(keycloak, 'getExpiresAtUtc').mockReturnValue(FUTURE)

    const auth = useAuthStore()
    await auth.fetchToken()

    expect(auth.hasRole('admin')).toBe(true)
    expect(auth.hasRole('nope')).toBe(false)
  })

  it('login starts the Keycloak flow with the current URL as redirect', () => {
    const location = { href: 'https://app.test.local/dashboard', origin: 'https://app.test.local' }
    Object.defineProperty(window, 'location', { value: location, writable: true })
    const login = vi.spyOn(keycloak, 'login').mockResolvedValue()

    useAuthStore().login()

    expect(login).toHaveBeenCalledWith('https://app.test.local/dashboard')
  })

  it('login resolves an explicit returnTo path against the current origin', () => {
    const location = { href: 'https://app.test.local/login', origin: 'https://app.test.local' }
    Object.defineProperty(window, 'location', { value: location, writable: true })
    const login = vi.spyOn(keycloak, 'login').mockResolvedValue()

    useAuthStore().login('/wheel')

    expect(login).toHaveBeenCalledWith('https://app.test.local/wheel')
  })

  it('logout clears the token then ends the Keycloak session, returning to /login', () => {
    const location = { href: 'https://app.test.local/dashboard', origin: 'https://app.test.local' }
    Object.defineProperty(window, 'location', { value: location, writable: true })
    const logout = vi.spyOn(keycloak, 'logout').mockResolvedValue()

    const auth = useAuthStore()
    auth.token = 'tok'
    auth.logout()

    expect(auth.token).toBeNull()
    expect(logout).toHaveBeenCalledWith('https://app.test.local/login')
  })
})
