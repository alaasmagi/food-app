import { describe, it, expect, afterEach, vi } from 'vitest'
import { getPublicWheel } from './publicWheels'
import type { PublicWheel } from '../types/wheel'

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

const WHEEL: PublicWheel = { id: 'w1', name: 'Lunch picks', restaurantNames: ['Alpha', 'Beta'] }

describe('getPublicWheel', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('GETs the public endpoint with no Authorization header and resolves the DTO', async () => {
    const fetchMock = vi.fn().mockResolvedValue(json(WHEEL))
    vi.stubGlobal('fetch', fetchMock)

    const wheel = await getPublicWheel('w1')

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toContain('/api/v1/public/wheels/w1')
    const headers = new Headers(init.headers)
    expect(headers.has('Authorization')).toBe(false)
    expect(wheel).toEqual(WHEEL)
  })

  it('does not attempt a token refresh (single request) even on the happy path', async () => {
    const fetchMock = vi.fn().mockResolvedValue(json(WHEEL))
    vi.stubGlobal('fetch', fetchMock)

    await getPublicWheel('w1')

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('reports not-found (null) on a 404', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 404 })))

    expect(await getPublicWheel('missing')).toBeNull()
  })

  it('rejects on a non-ok status other than 404', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 500 })))

    await expect(getPublicWheel('w1')).rejects.toThrow()
  })
})
