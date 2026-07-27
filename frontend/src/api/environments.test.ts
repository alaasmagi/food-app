import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { autoFillEnvironment } from './environments'

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('environments API', () => {
  beforeEach(() => setActivePinia(createPinia()))
  afterEach(() => vi.unstubAllGlobals())

  it('autoFillEnvironment POSTs to {id}/auto-fill and returns the parsed summary', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(json({ added: 3, alreadyPresent: 1, totalMembers: 4 }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await autoFillEnvironment('e1')

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toContain('/api/v1/dining-environments/e1/auto-fill')
    expect(init.method).toBe('POST')
    expect(result).toEqual({ added: 3, alreadyPresent: 1, totalMembers: 4 })
  })

  it('autoFillEnvironment throws on a non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 400 })))

    await expect(autoFillEnvironment('e1')).rejects.toThrow()
  })
})
