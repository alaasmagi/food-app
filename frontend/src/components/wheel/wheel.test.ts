import { describe, it, expect, beforeEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import WheelEditorDialog from './WheelEditorDialog.vue'
import WheelSpinner from './WheelSpinner.vue'
import WheelView from '../../views/WheelView.vue'
import { useWheelsStore } from '../../stores/wheels'
import { useRestaurantsStore } from '../../stores/restaurants'
import type { Restaurant } from '../../types/restaurant'
import type { UserWheel } from '../../types/wheel'

function restaurant(id: string, name: string): Restaurant {
  return {
    id,
    concurrencyToken: '',
    name,
    city: 'Tallinn',
    latitude: 0,
    longitude: 0,
    offerTimeText: '',
    parkingInfo: '',
    openingInfo: '',
    hasOffers: true,
    isFastFood: false,
    offersResourceUrl: null,
    offerProviderId: null,
  }
}

const RouterLinkStub = { template: '<a><slot /></a>' }

describe('WheelEditorDialog', () => {
  beforeEach(() => setActivePinia(createPinia()))

  function seedCatalog() {
    const restaurants = useRestaurantsStore()
    restaurants.list = [restaurant('r1', 'Alpha'), restaurant('r2', 'Beta'), restaurant('r3', 'Gamma')]
  }

  it('blocks save until at least 2 restaurants are checked', async () => {
    seedCatalog()
    const wheels = useWheelsStore()
    const createSpy = vi.spyOn(wheels, 'createWheel').mockResolvedValue()

    const wrapper = mount(WheelEditorDialog, { props: { open: true, wheel: null } })
    await wrapper.findAll('input')[0].setValue('Lunch') // name
    await wrapper.findAll('.wheel-editor__list input')[0].setValue(true) // one restaurant

    const saveButton = wrapper.findAll('button').find((b) => b.text() === 'Save')!
    await saveButton.trigger('click')
    expect(createSpy).not.toHaveBeenCalled()
  })

  it('saves the checked restaurants by name (not id) with the public switch', async () => {
    seedCatalog()
    const wheels = useWheelsStore()
    const createSpy = vi.spyOn(wheels, 'createWheel').mockResolvedValue()

    const wrapper = mount(WheelEditorDialog, { props: { open: true, wheel: null } })
    await wrapper.findAll('input')[0].setValue('Lunch') // name
    const rows = wrapper.findAll('.wheel-editor__list input')
    await rows[0].setValue(true) // Alpha
    await rows[2].setValue(true) // Gamma

    const saveButton = wrapper.findAll('button').find((b) => b.text() === 'Save')!
    await saveButton.trigger('click')
    await flushPromises()

    expect(createSpy).toHaveBeenCalledWith({
      name: 'Lunch',
      restaurantNames: ['Alpha', 'Gamma'],
      isPublic: false,
    })
  })
})

describe('WheelSpinner', () => {
  it('renders one segment per name', () => {
    const wrapper = mount(WheelSpinner, { props: { names: ['A', 'B', 'C'] } })
    expect(wrapper.findAll('path')).toHaveLength(3)
  })

  it('spin() emits a name from the list once the animation settles', async () => {
    const wrapper = mount(WheelSpinner, { props: { names: ['A', 'B', 'C'] } })
    await wrapper.find('button').trigger('click') // Spin
    await wrapper.find('.spinner__rotor').trigger('transitionend')

    const emitted = wrapper.emitted('result')
    expect(emitted).toHaveLength(1)
    expect(['A', 'B', 'C']).toContain(emitted![0][0])
  })

  it('cannot spin with fewer than 2 names', async () => {
    const wrapper = mount(WheelSpinner, { props: { names: ['Only'] } })
    await wrapper.find('button').trigger('click')
    await wrapper.find('.spinner__rotor').trigger('transitionend')
    expect(wrapper.emitted('result')).toBeUndefined()
  })
})

describe('WheelView', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('lists wheels and opens the editor on "New wheel"', async () => {
    const wheels = useWheelsStore()
    wheels.list = [
      { id: 'w1', concurrencyToken: 't', name: 'Lunch picks', restaurantNames: ['A', 'B'], isPublic: false } as UserWheel,
    ]
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('[]', { status: 200 })))

    const wrapper = mount(WheelView, { global: { stubs: { RouterLink: RouterLinkStub } } })
    expect(wrapper.text()).toContain('Lunch picks')
    expect(wrapper.find('.ds-dialog__overlay').exists()).toBe(false)

    const newButton = wrapper.findAll('button').find((b) => b.text() === 'New wheel')!
    await newButton.trigger('click')
    expect(wrapper.find('.ds-dialog__overlay').exists()).toBe(true)

    vi.unstubAllGlobals()
  })
})
