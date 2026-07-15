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
  return { id, concurrencyToken: `tok-${id}`, name: `Env ${id}`, description: null, ...over }
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
})
