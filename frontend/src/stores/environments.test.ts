import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useEnvironmentsStore } from './environments'
import type { DiningEnvironment, EnvironmentRestaurant } from '../types/environment'

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function env(id: string, over: Partial<DiningEnvironment> = {}): DiningEnvironment {
  return {
    id,
    concurrencyToken: `tok-${id}`,
    name: `Env ${id}`,
    description: null,
    autoFillLatitude: null,
    autoFillLongitude: null,
    autoFillRadiusMeters: null,
    ...over,
  }
}

function membership(id: string, environmentId: string, restaurantId: string): EnvironmentRestaurant {
  return { id, concurrencyToken: `tok-${id}`, environmentId, restaurantId }
}

describe('environments store', () => {
  beforeEach(() => setActivePinia(createPinia()))
  afterEach(() => vi.unstubAllGlobals())

  it('indexes membership rows into per-environment maps and reflects isMember', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        json([membership('m1', 'e1', 'r1'), membership('m2', 'e1', 'r2'), membership('m3', 'e2', 'r1')]),
      ),
    )

    const store = useEnvironmentsStore()
    await store.loadMembership()

    expect(store.membershipByEnv['e1']['r1']).toEqual({ joinId: 'm1', concurrencyToken: 'tok-m1' })

    store.selectEnvironment('e1')
    expect(store.isMember('r1')).toBe(true)
    expect(store.isMember('r3')).toBe(false)

    store.selectEnvironment(null) // "All" has no membership concept
    expect(store.isMember('r1')).toBe(false)
  })

  it('addRestaurant records the created join row', async () => {
    const fetchMock = vi.fn().mockResolvedValue(json(membership('m9', 'e1', 'r5'), 201))
    vi.stubGlobal('fetch', fetchMock)

    const store = useEnvironmentsStore()
    store.selectEnvironment('e1')
    await store.addRestaurant('r5')

    expect(store.membershipByEnv['e1']['r5']).toEqual({ joinId: 'm9', concurrencyToken: 'tok-m9' })
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toContain('/api/v1/environment-restaurants')
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body)).toEqual({ environmentId: 'e1', restaurantId: 'r5' })
  })

  it('removeRestaurant deletes by join id with If-Match and clears membership', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)

    const store = useEnvironmentsStore()
    store.selectEnvironment('e1')
    store.membershipByEnv['e1'] = { r5: { joinId: 'm9', concurrencyToken: 'tok-m9' } }

    await store.removeRestaurant('r5')

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toContain('/api/v1/environment-restaurants/m9')
    expect(init.method).toBe('DELETE')
    expect(new Headers(init.headers).get('If-Match')).toBe('tok-m9')
    expect(store.membershipByEnv['e1']['r5']).toBeUndefined()
  })

  it('renameEnvironment sends If-Match from the stored token', async () => {
    const fetchMock = vi.fn().mockResolvedValue(json(env('e1', { name: 'Renamed' })))
    vi.stubGlobal('fetch', fetchMock)

    const store = useEnvironmentsStore()
    store.list = [env('e1')]
    await store.renameEnvironment('e1', { name: 'Renamed', description: null })

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toContain('/api/v1/dining-environments/e1')
    expect(init.method).toBe('PUT')
    expect(new Headers(init.headers).get('If-Match')).toBe('tok-e1')
    expect(store.list[0].name).toBe('Renamed')
  })

  it('deleteEnvironment sends If-Match and drops the environment and its selection', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)

    const store = useEnvironmentsStore()
    store.list = [env('e1')]
    store.selectEnvironment('e1')
    await store.deleteEnvironment('e1')

    const [, init] = fetchMock.mock.calls[0]
    expect(init.method).toBe('DELETE')
    expect(new Headers(init.headers).get('If-Match')).toBe('tok-e1')
    expect(store.list).toHaveLength(0)
    expect(store.selectedEnvironmentId).toBeNull()
  })

  it('renameEnvironment carries the stored auto-fill origin when only name changes', async () => {
    const stored = { autoFillLatitude: 59.4, autoFillLongitude: 24.7, autoFillRadiusMeters: 800 }
    const fetchMock = vi.fn().mockResolvedValue(json(env('e1', { name: 'Renamed', ...stored })))
    vi.stubGlobal('fetch', fetchMock)

    const store = useEnvironmentsStore()
    store.list = [env('e1', stored)]
    await store.renameEnvironment('e1', { name: 'Renamed', description: null })

    const [, init] = fetchMock.mock.calls[0]
    const body = JSON.parse(init.body)
    expect(body.autoFillLatitude).toBe(59.4)
    expect(body.autoFillLongitude).toBe(24.7)
    expect(body.autoFillRadiusMeters).toBe(800)
  })

  it('renameEnvironment sends an explicit null origin when the caller clears it', async () => {
    const fetchMock = vi.fn().mockResolvedValue(json(env('e1', { name: 'Cleared' })))
    vi.stubGlobal('fetch', fetchMock)

    const store = useEnvironmentsStore()
    store.list = [env('e1', { autoFillLatitude: 59.4, autoFillLongitude: 24.7, autoFillRadiusMeters: 800 })]
    await store.renameEnvironment('e1', {
      name: 'Cleared',
      description: null,
      autoFillLatitude: null,
      autoFillLongitude: null,
      autoFillRadiusMeters: null,
    })

    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(body.autoFillLatitude).toBeNull()
    expect(body.autoFillLongitude).toBeNull()
    expect(body.autoFillRadiusMeters).toBeNull()
  })

  it('createEnvironment carries the auto-fill origin and returns the created environment', async () => {
    const created = env('e2', {
      name: 'New',
      autoFillLatitude: 1,
      autoFillLongitude: 2,
      autoFillRadiusMeters: 300,
    })
    const fetchMock = vi.fn().mockResolvedValue(json(created, 201))
    vi.stubGlobal('fetch', fetchMock)

    const store = useEnvironmentsStore()
    const result = await store.createEnvironment({
      name: 'New',
      description: null,
      autoFillLatitude: 1,
      autoFillLongitude: 2,
      autoFillRadiusMeters: 300,
    })

    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(body.autoFillLatitude).toBe(1)
    expect(body.autoFillLongitude).toBe(2)
    expect(body.autoFillRadiusMeters).toBe(300)
    expect(result.id).toBe('e2')
    expect(store.list.map((e) => e.id)).toContain('e2')
  })

  it('autoFill posts to the endpoint, returns the summary, and reloads membership', async () => {
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      void init
      if (url.includes('/auto-fill')) {
        return Promise.resolve(json({ added: 3, alreadyPresent: 1, totalMembers: 4 }))
      }
      return Promise.resolve(json([membership('m1', 'e1', 'r1')]))
    })
    vi.stubGlobal('fetch', fetchMock)

    const store = useEnvironmentsStore()
    const result = await store.autoFill('e1')

    expect(result).toEqual({ added: 3, alreadyPresent: 1, totalMembers: 4 })
    const [url0, init0] = fetchMock.mock.calls[0]
    expect(url0).toContain('/api/v1/dining-environments/e1/auto-fill')
    expect(init0?.method).toBe('POST')
    // Membership was refreshed so the new join row is indexed.
    expect(store.membershipByEnv['e1']['r1']).toEqual({ joinId: 'm1', concurrencyToken: 'tok-m1' })
  })
})
