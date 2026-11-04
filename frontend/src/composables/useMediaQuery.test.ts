import { describe, it, expect, afterEach, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { useMediaQuery } from './useMediaQuery'

function stubMatchMedia(initial: boolean) {
  let listener: ((event: { matches: boolean }) => void) | null = null
  const list = {
    matches: initial,
    addEventListener: vi.fn((_: string, fn: typeof listener) => (listener = fn)),
    removeEventListener: vi.fn(),
  }
  vi.stubGlobal('matchMedia', vi.fn(() => list))
  return { list, fire: (matches: boolean) => listener?.({ matches }) }
}

function mountWith(query: string) {
  let result!: ReturnType<typeof useMediaQuery>
  const wrapper = mount(
    defineComponent({
      setup() {
        result = useMediaQuery(query)
        return () => h('div')
      },
    }),
  )
  return { wrapper, matches: () => result.value }
}

describe('useMediaQuery', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('is false when matchMedia is unavailable', () => {
    vi.stubGlobal('matchMedia', undefined)
    expect(mountWith('(min-width: 1280px)').matches()).toBe(false)
  })

  it('reflects the initial state and follows changes', () => {
    const { fire } = stubMatchMedia(true)
    const { matches } = mountWith('(min-width: 1280px)')
    expect(window.matchMedia).toHaveBeenCalledWith('(min-width: 1280px)')
    expect(matches()).toBe(true)
    fire(false)
    expect(matches()).toBe(false)
  })

  it('removes its listener on unmount', () => {
    const { list } = stubMatchMedia(false)
    const { wrapper } = mountWith('(min-width: 1280px)')
    wrapper.unmount()
    expect(list.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function))
  })
})
