import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import type { RouteLocationNormalized } from 'vue-router'
import { authGuard } from './index'
import { useAuthStore } from '../stores/auth'

const FUTURE = '2999-01-01T00:00:00.000Z'

function route(meta: Record<string, unknown> = {}, fullPath = '/'): RouteLocationNormalized {
  return { meta, fullPath } as unknown as RouteLocationNormalized
}

function tokenResponse(accessToken: string) {
  return new Response(JSON.stringify({ accessToken, expiresAtUtc: FUTURE }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('authGuard', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('lets an authenticated user proceed to a protected route', async () => {
    const auth = useAuthStore()
    auth.token = 'tok'
    auth.expiresAtUtc = FUTURE

    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    expect(await authGuard(route())).toBe(true)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('triggers a silent token fetch when the store is empty', async () => {
    const fetchMock = vi.fn().mockResolvedValue(tokenResponse('fresh'))
    vi.stubGlobal('fetch', fetchMock)

    const result = await authGuard(route())

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(result).toBe(true)
    expect(useAuthStore().token).toBe('fresh')
  })

  it('redirects to the login view when still unauthenticated after the fetch', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 401 })))

    const result = await authGuard(route({}, '/wheel'))

    expect(result).toEqual({ name: 'login', query: { redirect: '/wheel' } })
  })

  it('always allows public routes without a token fetch', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    expect(await authGuard(route({ public: true }))).toBe(true)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('allows the public shared-wheel route (/w/:id) without a token fetch', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    expect(await authGuard(route({ public: true }, '/w/w1'))).toBe(true)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
