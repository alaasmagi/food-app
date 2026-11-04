import { describe, it, expect, afterEach, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { useElementResize } from './useElementResize'

function mountWith(onResize: () => void) {
  return mount(
    defineComponent({
      setup() {
        const el = ref<HTMLElement | null>(null)
        useElementResize(el, onResize)
        return () => h('div', { ref: el })
      },
    }),
  )
}

describe('useElementResize', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('does nothing when ResizeObserver is unavailable', () => {
    vi.stubGlobal('ResizeObserver', undefined)
    const onResize = vi.fn()
    expect(() => mountWith(onResize).unmount()).not.toThrow()
    expect(onResize).not.toHaveBeenCalled()
  })

  it('observes the element, calls back on resize and disconnects on unmount', () => {
    let fire!: () => void
    const observe = vi.fn()
    const disconnect = vi.fn()
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: () => void) {
          fire = callback
        }
        observe = observe
        disconnect = disconnect
      },
    )
    const onResize = vi.fn()
    const wrapper = mountWith(onResize)

    expect(observe).toHaveBeenCalledWith(wrapper.element)
    fire()
    expect(onResize).toHaveBeenCalledTimes(1)
    wrapper.unmount()
    expect(disconnect).toHaveBeenCalled()
  })
})
