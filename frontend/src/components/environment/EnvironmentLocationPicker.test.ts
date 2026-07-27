import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'

// Leaflet cannot lay out a real map in jsdom, so the module is mocked with chainable stubs. The map's
// `on` is a spy so the test can retrieve and invoke the click handler the component registered.
vi.mock('leaflet', () => {
  const layer = () => ({
    on: vi.fn().mockReturnThis(),
    addTo: vi.fn().mockReturnThis(),
    setLatLng: vi.fn().mockReturnThis(),
    setRadius: vi.fn(),
    remove: vi.fn(),
    getLatLng: () => ({ lat: 1, lng: 2 }),
  })
  const map = vi.fn(() => ({
    on: vi.fn().mockReturnThis(),
    setView: vi.fn().mockReturnThis(),
    invalidateSize: vi.fn(),
    remove: vi.fn(),
  }))
  const L = {
    map,
    tileLayer: vi.fn(() => ({ addTo: vi.fn().mockReturnThis(), setUrl: vi.fn() })),
    marker: vi.fn(() => layer()),
    circle: vi.fn(() => layer()),
    divIcon: vi.fn(() => ({})),
    latLng: vi.fn((lat: number, lng: number) => ({ lat, lng })),
  }
  return { default: L }
})

import L from 'leaflet'
import EnvironmentLocationPicker, { type AutoFillOrigin } from './EnvironmentLocationPicker.vue'

function origin(over: Partial<AutoFillOrigin> = {}): AutoFillOrigin {
  return { latitude: null, longitude: null, radiusMeters: null, ...over }
}

// Mount with a working v-model so emitted updates flow back into the prop, mirroring real usage.
function mountPicker(initial: AutoFillOrigin) {
  const state: { current: AutoFillOrigin } = { current: initial }
  let wrapper: VueWrapper
  wrapper = mount(EnvironmentLocationPicker, {
    props: {
      modelValue: initial,
      'onUpdate:modelValue': (value: AutoFillOrigin) => {
        state.current = value
        wrapper.setProps({ modelValue: value })
      },
    },
  })
  return { wrapper, state }
}

// Retrieve the click handler the component registered on the mocked map.
function mapClickHandler(): (event: { latlng: { lat: number; lng: number } }) => void {
  const instance = vi.mocked(L.map).mock.results[0].value
  const call = instance.on.mock.calls.find((c: unknown[]) => c[0] === 'click')
  return call![1]
}

describe('EnvironmentLocationPicker', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(() => vi.clearAllMocks())

  it('hides the radius input and circle until a location is set', async () => {
    const { wrapper } = mountPicker(origin())
    await flushPromises()

    expect(wrapper.find('.env-location-picker__radius').exists()).toBe(false)
    expect(L.circle).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Auto-fill is unavailable')
  })

  it('sets the origin when the map is clicked', async () => {
    const { wrapper, state } = mountPicker(origin())
    await flushPromises()

    mapClickHandler()({ latlng: { lat: 59.44, lng: 24.75 } })
    await flushPromises()

    expect(state.current.latitude).toBe(59.44)
    expect(state.current.longitude).toBe(24.75)
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
  })

  it('shows the radius input with a default hint once a location is set but no radius', async () => {
    const { wrapper } = mountPicker(origin({ latitude: 59.4, longitude: 24.7 }))
    await flushPromises()

    expect(wrapper.find('.env-location-picker__radius').exists()).toBe(true)
    expect(wrapper.text()).toContain('Defaults to 500 m')
    expect(L.circle).toHaveBeenCalled()
  })

  it('clears the origin when clear location is pressed', async () => {
    const { wrapper, state } = mountPicker(
      origin({ latitude: 59.4, longitude: 24.7, radiusMeters: 800 }),
    )
    await flushPromises()

    const clear = wrapper.findAll('button').find((b) => b.text().includes('Clear location'))
    await clear!.trigger('click')
    await flushPromises()

    expect(state.current.latitude).toBeNull()
    expect(state.current.longitude).toBeNull()
    expect(state.current.radiusMeters).toBeNull()
  })
})
