import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import Toast from './Toast.vue'
import { useToastsStore } from '../../../stores/toasts'

describe('Toast', () => {
  const TONES = ['info', 'success', 'warning', 'danger'] as const

  it.each(TONES)('renders tone "%s" with an icon', (tone) => {
    const wrapper = mount(Toast, { props: { title: 'Saved', tone } })
    expect(wrapper.find('.ds-toast').classes()).toContain(`ds-toast--${tone}`)
    expect(wrapper.find('.ds-toast__icon svg').exists()).toBe(true)
  })

  it('renders title and optional description', () => {
    const wrapper = mount(Toast, { props: { title: 'Saved', description: 'Your rating is saved.' } })
    expect(wrapper.text()).toContain('Saved')
    expect(wrapper.text()).toContain('Your rating is saved.')
  })

  it('emits close when the close button is activated', async () => {
    const wrapper = mount(Toast, { props: { title: 'Saved' } })
    await wrapper.find('.ds-toast__close').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })
})

describe('toasts store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('push adds a toast and returns its id, dismiss removes it', () => {
    const store = useToastsStore()
    const id = store.push({ title: 'Saved', tone: 'success' })
    expect(store.items).toHaveLength(1)
    expect(store.items[0]).toMatchObject({ id, title: 'Saved', tone: 'success' })

    store.dismiss(id)
    expect(store.items).toHaveLength(0)
  })

  it('defaults tone to info and auto-dismisses after the delay', () => {
    const store = useToastsStore()
    store.push({ title: 'Heads up' })
    expect(store.items[0].tone).toBe('info')

    vi.advanceTimersByTime(4000)
    expect(store.items).toHaveLength(0)
  })
})
