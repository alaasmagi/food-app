import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import WheelEditorDialog from './WheelEditorDialog.vue'
import WheelSpinner from './WheelSpinner.vue'
import WheelView from '../../views/WheelView.vue'
import { useWheelsStore } from '../../stores/wheels'
import type { Restaurant } from '../../types/restaurant'
import type { UserWheel } from '../../types/wheel'

const copyShareLink = vi.fn()
vi.mock('../../composables/useShareWheelLink', () => ({
  useShareWheelLink: () => ({ copyShareLink }),
}))

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
  // The picker now fetches a page from GET /api/v1/restaurants/page instead of reading the full
  // catalog from the store; stub that endpoint with Alpha/Beta/Gamma.
  function pageResponse(names: string[]) {
    const items = names.map((n, i) => restaurant(`r${i + 1}`, n))
    return new Response(JSON.stringify({ items, total: items.length, page: 1, pageSize: 20 }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    copyShareLink.mockClear()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(pageResponse(['Alpha', 'Beta', 'Gamma'])))
  })
  afterEach(() => vi.unstubAllGlobals())

  it('blocks save until at least 2 restaurants are checked', async () => {
    const wheels = useWheelsStore()
    const createSpy = vi.spyOn(wheels, 'createWheel').mockResolvedValue()

    const wrapper = mount(WheelEditorDialog, { props: { open: true, wheel: null } })
    await flushPromises() // let the first page load
    await wrapper.findAll('input')[0].setValue('Lunch') // name
    await wrapper.findAll('.wheel-editor__list input')[0].setValue(true) // one restaurant

    const saveButton = wrapper.findAll('button').find((b) => b.text() === 'Save')!
    await saveButton.trigger('click')
    expect(createSpy).not.toHaveBeenCalled()
  })

  it('saves the checked restaurants by name with the public switch', async () => {
    const wheels = useWheelsStore()
    const createSpy = vi.spyOn(wheels, 'createWheel').mockResolvedValue()

    const wrapper = mount(WheelEditorDialog, { props: { open: true, wheel: null } })
    await flushPromises()
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

  it('pre-selects an edited wheel by name without needing the full catalog', async () => {
    const wheels = useWheelsStore()
    const updateSpy = vi.spyOn(wheels, 'updateWheel').mockResolvedValue()
    const wheel: UserWheel = {
      id: 'w1',
      concurrencyToken: 't',
      name: 'Lunch',
      restaurantNames: ['Alpha', 'Gamma'],
      isPublic: false,
    }

    const wrapper = mount(WheelEditorDialog, { props: { open: false, wheel } })
    await wrapper.setProps({ open: true })
    await flushPromises()

    // The two members are counted as selected even though the picker only holds one page.
    expect(wrapper.text()).toContain('2 selected')

    const saveButton = wrapper.findAll('button').find((b) => b.text() === 'Save')!
    await saveButton.trigger('click')
    await flushPromises()
    expect(updateSpy).toHaveBeenCalledWith('w1', {
      name: 'Lunch',
      restaurantNames: ['Alpha', 'Gamma'],
      isPublic: false,
    })
  })

  it('shows a "Copy share link" action for a saved public wheel and copies on click', async () => {
    const wheel: UserWheel = {
      id: 'w1',
      concurrencyToken: 't',
      name: 'Lunch',
      restaurantNames: ['Alpha', 'Beta'],
      isPublic: true,
    }

    // Mount closed, then open so the dialog hydrates isPublic from the wheel.
    const wrapper = mount(WheelEditorDialog, { props: { open: false, wheel } })
    await wrapper.setProps({ open: true })
    await flushPromises()

    const shareButton = wrapper.findAll('button').find((b) => b.text() === 'Copy share link')!
    expect(shareButton).toBeTruthy()

    await shareButton.trigger('click')
    expect(copyShareLink).toHaveBeenCalledWith('w1')
  })

  it('shows no share action for a new, unsaved wheel even with the public switch on', async () => {
    const wrapper = mount(WheelEditorDialog, { props: { open: false, wheel: null } })
    await wrapper.setProps({ open: true })
    await flushPromises()
    // Turn the public switch on.
    await wrapper.find('.wheel-editor__public input').setValue(true)

    const shareButton = wrapper.findAll('button').find((b) => b.text() === 'Copy share link')
    expect(shareButton).toBeUndefined()
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
    await wrapper.find('.spinner__rotor').trigger('transitionend', { propertyName: 'transform' })

    const emitted = wrapper.emitted('result')
    expect(emitted).toHaveLength(1)
    expect(['A', 'B', 'C']).toContain(emitted![0][0])
  })

  it('cannot spin with fewer than 2 names', async () => {
    const wrapper = mount(WheelSpinner, { props: { names: ['Only'] } })
    await wrapper.find('button').trigger('click')
    await wrapper.find('.spinner__rotor').trigger('transitionend', { propertyName: 'transform' })
    expect(wrapper.emitted('result')).toBeUndefined()
  })

  it('highlights the winner by dimming the other segments once settled', async () => {
    const wrapper = mount(WheelSpinner, { props: { names: ['A', 'B', 'C'] } })
    // Nothing dimmed before a spin.
    expect(wrapper.findAll('.spinner__seg--dim')).toHaveLength(0)

    await wrapper.find('button').trigger('click')
    await wrapper.find('.spinner__rotor').trigger('transitionend', { propertyName: 'transform' })

    // Every segment except the winner is dimmed, and the winner name is shown in the readout.
    expect(wrapper.findAll('.spinner__seg--dim')).toHaveLength(2)
    expect(wrapper.find('.spinner__result-name').text()).toBe(wrapper.emitted('result')![0][0])
  })

  it('ignores a segment opacity transition mid-spin (does not highlight the winner early)', async () => {
    const wrapper = mount(WheelSpinner, { props: { names: ['A', 'B', 'C'] } })
    await wrapper.find('button').trigger('click')
    await wrapper.find('.spinner__rotor').trigger('transitionend', { propertyName: 'transform' })
    expect(wrapper.emitted('result')).toHaveLength(1)

    // Second spin: un-dimming the previous winner fires an opacity transitionend that bubbles to the
    // rotor. It must NOT settle the wheel or light up the new winner while it is still turning.
    await wrapper.find('button').trigger('click')
    await wrapper.find('.spinner__rotor').trigger('transitionend', { propertyName: 'opacity' })
    expect(wrapper.emitted('result')).toHaveLength(1)
    expect(wrapper.findAll('.spinner__seg--dim')).toHaveLength(0)

    // Only the transform transition (the wheel actually stopping) settles it.
    await wrapper.find('.spinner__rotor').trigger('transitionend', { propertyName: 'transform' })
    expect(wrapper.emitted('result')).toHaveLength(2)
    expect(wrapper.findAll('.spinner__seg--dim')).toHaveLength(2)
  })
})

describe('WheelView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    copyShareLink.mockClear()
  })

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

  it('shows a share action only on public wheel cards and copies on click', async () => {
    const wheels = useWheelsStore()
    wheels.list = [
      { id: 'w1', concurrencyToken: 't', name: 'Public wheel', restaurantNames: ['A', 'B'], isPublic: true } as UserWheel,
      { id: 'w2', concurrencyToken: 't', name: 'Private wheel', restaurantNames: ['A', 'B'], isPublic: false } as UserWheel,
    ]
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('[]', { status: 200 })))

    const wrapper = mount(WheelView, { global: { stubs: { RouterLink: RouterLinkStub } } })

    const shareButtons = wrapper
      .findAll('button')
      .filter((b) => b.attributes('aria-label') === 'Copy share link')
    // Exactly one card (the public one) offers a share action.
    expect(shareButtons).toHaveLength(1)

    await shareButtons[0].trigger('click')
    expect(copyShareLink).toHaveBeenCalledWith('w1')

    vi.unstubAllGlobals()
  })
})
