import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useShareWheelLink } from './useShareWheelLink'
import { useToastsStore } from '../stores/toasts'

describe('useShareWheelLink', () => {
  beforeEach(() => setActivePinia(createPinia()))
  afterEach(() => vi.unstubAllGlobals())

  it('copies the origin-based link and pushes a success toast', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    const toasts = useToastsStore()

    const { copyShareLink } = useShareWheelLink()
    await copyShareLink('w1')

    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/w/w1`)
    expect(toasts.items).toHaveLength(1)
    expect(toasts.items[0]).toMatchObject({ title: 'Link copied', tone: 'success' })
  })

  it('surfaces a danger toast on clipboard failure without throwing', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'))
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    const toasts = useToastsStore()

    const { copyShareLink } = useShareWheelLink()
    await expect(copyShareLink('w1')).resolves.toBeUndefined()

    expect(toasts.items).toHaveLength(1)
    expect(toasts.items[0].tone).toBe('danger')
  })
})
