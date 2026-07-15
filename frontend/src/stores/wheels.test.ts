import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useWheelsStore } from './wheels'
import type { UserWheel } from '../types/wheel'

function wheel(over: Partial<UserWheel> = {}): UserWheel {
  return {
    id: 'w1',
    concurrencyToken: 'tok-w1',
    name: 'Lunch',
    restaurantNames: ['A', 'B'],
    isPublic: false,
    ...over,
  }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('wheels store', () => {
  beforeEach(() => setActivePinia(createPinia()))
  afterEach(() => vi.unstubAllGlobals())

  it('loads wheels once', async () => {
    const fetchMock = vi.fn().mockResolvedValue(json([wheel({ id: 'w1' }), wheel({ id: 'w2' })]))
    vi.stubGlobal('fetch', fetchMock)

    const store = useWheelsStore()
    await store.loadWheels()
    await store.loadWheels()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(store.list).toHaveLength(2)
  })

  it('createWheel POSTs and appends to the list', async () => {
    const fetchMock = vi.fn().mockResolvedValue(json(wheel({ id: 'new', name: 'Dinner' }), 201))
    vi.stubGlobal('fetch', fetchMock)

    const store = useWheelsStore()
    await store.createWheel({ name: 'Dinner', restaurantNames: ['A', 'B'], isPublic: true })

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toContain('/api/v1/user-wheels')
    expect(init.method).toBe('POST')
    expect(store.list.at(-1)?.id).toBe('new')
  })

  it('updateWheel PUTs with If-Match and replaces the entry', async () => {
    const fetchMock = vi.fn().mockResolvedValue(json(wheel({ id: 'w1', name: 'Renamed' })))
    vi.stubGlobal('fetch', fetchMock)

    const store = useWheelsStore()
    store.list = [wheel({ id: 'w1', concurrencyToken: 'tok-w1' })]
    await store.updateWheel('w1', { name: 'Renamed', restaurantNames: ['A', 'B'], isPublic: false })

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toContain('/api/v1/user-wheels/w1')
    expect(init.method).toBe('PUT')
    expect(new Headers(init.headers).get('If-Match')).toBe('tok-w1')
    expect(store.list[0].name).toBe('Renamed')
  })

  it('deleteWheel DELETEs with If-Match and removes the entry', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)

    const store = useWheelsStore()
    store.list = [wheel({ id: 'w1', concurrencyToken: 'tok-w1' })]
    await store.deleteWheel('w1')

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toContain('/api/v1/user-wheels/w1')
    expect(init.method).toBe('DELETE')
    expect(new Headers(init.headers).get('If-Match')).toBe('tok-w1')
    expect(store.list).toHaveLength(0)
  })
})
