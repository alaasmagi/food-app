import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import type { RouteLocationNormalized } from 'vue-router'
import { authGuard } from './index'
import { useAuthStore } from '../stores/auth'
import * as keycloak from '../auth/keycloak'

const FUTURE = '2999-01-01T00:00:00.000Z'

function route(meta: Record<string, unknown> = {}, fullPath = '/'): RouteLocationNormalized {
  return { meta, fullPath } as unknown as RouteLocationNormalized
}

describe('authGuard', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('lets an authenticated user proceed to a protected route', async () => {
    const auth = useAuthStore()
    auth.token = 'tok'
    auth.expiresAtUtc = FUTURE

    const refresh = vi.spyOn(keycloak, 'refreshToken')

    expect(await authGuard(route())).toBe(true)
    expect(refresh).not.toHaveBeenCalled()
  })

  it('triggers a silent Keycloak refresh when the store is empty', async () => {
    const refresh = vi.spyOn(keycloak, 'refreshToken').mockResolvedValue(true)
    vi.spyOn(keycloak, 'getToken').mockReturnValue('fresh')
    vi.spyOn(keycloak, 'getExpiresAtUtc').mockReturnValue(FUTURE)

    const result = await authGuard(route())

    expect(refresh).toHaveBeenCalledTimes(1)
    expect(result).toBe(true)
    expect(useAuthStore().token).toBe('fresh')
  })

  it('redirects to the login view when still unauthenticated after the refresh', async () => {
    vi.spyOn(keycloak, 'refreshToken').mockResolvedValue(false)

    const result = await authGuard(route({}, '/wheel'))

    expect(result).toEqual({ name: 'login', query: { redirect: '/wheel' } })
  })

  it('always allows public routes without a token refresh', async () => {
    const refresh = vi.spyOn(keycloak, 'refreshToken')

    expect(await authGuard(route({ public: true }))).toBe(true)
    expect(refresh).not.toHaveBeenCalled()
  })

  it('allows the public shared-wheel route (/w/:id) without a token refresh', async () => {
    const refresh = vi.spyOn(keycloak, 'refreshToken')

    expect(await authGuard(route({ public: true }, '/w/w1'))).toBe(true)
    expect(refresh).not.toHaveBeenCalled()
  })
})
