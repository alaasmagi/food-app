import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import type { DiningEnvironment } from '../../types/environment'

// The dialog mounts the location picker (which imports Leaflet) once a location section is expanded;
// Leaflet cannot lay out in jsdom, so it is mocked with chainable stubs.
vi.mock('leaflet', () => {
  const layer = () => ({
    on: vi.fn().mockReturnThis(),
    addTo: vi.fn().mockReturnThis(),
    setLatLng: vi.fn().mockReturnThis(),
    setRadius: vi.fn(),
    remove: vi.fn(),
    getLatLng: () => ({ lat: 1, lng: 2 }),
  })
  const L = {
    map: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      setView: vi.fn().mockReturnThis(),
      invalidateSize: vi.fn(),
      remove: vi.fn(),
    })),
    tileLayer: vi.fn(() => ({ addTo: vi.fn().mockReturnThis(), setUrl: vi.fn() })),
    marker: vi.fn(() => layer()),
    circle: vi.fn(() => layer()),
    divIcon: vi.fn(() => ({})),
    latLng: vi.fn((lat: number, lng: number) => ({ lat, lng })),
  }
  return { default: L }
})

import EnvironmentEditorDialog from './EnvironmentEditorDialog.vue'
import { useEnvironmentsStore } from '../../stores/environments'
import { useToastsStore } from '../../stores/toasts'

function env(id: string, name: string, over: Partial<DiningEnvironment> = {}): DiningEnvironment {
  return {
    id,
    concurrencyToken: `tok-${id}`,
    name,
    description: null,
    autoFillLatitude: null,
    autoFillLongitude: null,
    autoFillRadiusMeters: null,
    ...over,
  }
}

function findButton(wrapper: ReturnType<typeof mount>, matcher: (text: string) => boolean) {
  return wrapper.findAll('button').find((b) => matcher(b.text()))
}

describe('EnvironmentEditorDialog auto-fill', () => {
  beforeEach(() => setActivePinia(createPinia()))
  afterEach(() => vi.clearAllMocks())

  it('shows the fill button only when the environment has stored coordinates', async () => {
    const store = useEnvironmentsStore()
    store.list = [env('e1', 'Located', { autoFillLatitude: 59.4, autoFillLongitude: 24.7 })]

    const wrapper = mount(EnvironmentEditorDialog, { props: { open: true } })
    await flushPromises()

    await findButton(wrapper, (t) => t === 'Location')!.trigger('click')
    await flushPromises()

    expect(findButton(wrapper, (t) => t.includes('Fill with nearby'))).toBeTruthy()
  })

  it('hides the fill button for an environment with no stored coordinates', async () => {
    const store = useEnvironmentsStore()
    store.list = [env('e2', 'Plain')]

    const wrapper = mount(EnvironmentEditorDialog, { props: { open: true } })
    await flushPromises()

    await findButton(wrapper, (t) => t === 'Location')!.trigger('click')
    await flushPromises()

    expect(findButton(wrapper, (t) => t.includes('Fill with nearby'))).toBeUndefined()
  })

  it('triggers autoFill and reports the count in a toast when the fill button is clicked', async () => {
    const store = useEnvironmentsStore()
    store.list = [env('e1', 'Located', { autoFillLatitude: 59.4, autoFillLongitude: 24.7 })]
    const autoFillSpy = vi
      .spyOn(store, 'autoFill')
      .mockResolvedValue({ added: 2, alreadyPresent: 1, totalMembers: 3 })
    const pushSpy = vi.spyOn(useToastsStore(), 'push')

    const wrapper = mount(EnvironmentEditorDialog, { props: { open: true } })
    await flushPromises()

    await findButton(wrapper, (t) => t === 'Location')!.trigger('click')
    await flushPromises()
    await findButton(wrapper, (t) => t.includes('Fill with nearby'))!.trigger('click')
    await flushPromises()

    expect(autoFillSpy).toHaveBeenCalledWith('e1')
    expect(pushSpy).toHaveBeenCalled()
    expect(pushSpy.mock.calls[0][0].title).toContain('Added 2')
  })
})
