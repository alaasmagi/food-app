import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import WheelEditorDialog from './WheelEditorDialog.vue'
import { useToastsStore } from '../../stores/toasts'
import type { Restaurant } from '../../types/restaurant'
import type { DiningEnvironment, EnvironmentRestaurant } from '../../types/environment'

// The import control resolves against real store state loaded through the API layer, so the fetch
// stub routes each backend call the dialog makes on open: the picker's page, the restaurant catalog,
// the user's environments, and their membership.
vi.mock('../../composables/useShareWheelLink', () => ({
  useShareWheelLink: () => ({ copyShareLink: vi.fn() }),
}))

function json(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

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

function denv(id: string, name: string): DiningEnvironment {
  return {
    id,
    concurrencyToken: `tok-${id}`,
    name,
    description: null,
    autoFillLatitude: null,
    autoFillLongitude: null,
    autoFillRadiusMeters: null,
  }
}

function membership(id: string, environmentId: string, restaurantId: string): EnvironmentRestaurant {
  return { id, concurrencyToken: `tok-${id}`, environmentId, restaurantId }
}

// Catalog holds Alpha/Beta/Gamma (r1/r2/r3). "Work" groups Alpha, Gamma, and r9 — a membership whose
// restaurant is no longer in the catalog (deleted). "Old" groups only that deleted r9.
const CATALOG = [restaurant('r1', 'Alpha'), restaurant('r2', 'Beta'), restaurant('r3', 'Gamma')]
const ENVIRONMENTS = [denv('e1', 'Work'), denv('e2', 'Old')]
const MEMBERSHIP = [
  membership('m1', 'e1', 'r1'),
  membership('m2', 'e1', 'r3'),
  membership('m3', 'e1', 'r9'),
  membership('m4', 'e2', 'r9'),
]

function pageResponse(names: string[]) {
  const items = names.map((n, i) => restaurant(`r${i + 1}`, n))
  return json({ items, total: items.length, page: 1, pageSize: 20 })
}

function routedFetch() {
  return vi.fn((url: string) => {
    if (url.includes('/restaurants/page')) return Promise.resolve(pageResponse(['Alpha', 'Beta', 'Gamma']))
    if (url.includes('/environment-restaurants')) return Promise.resolve(json(MEMBERSHIP))
    if (url.includes('/dining-environments')) return Promise.resolve(json(ENVIRONMENTS))
    if (url.includes('/restaurants')) return Promise.resolve(json(CATALOG))
    return Promise.resolve(json([]))
  })
}

// Open the import Select and choose the environment with the given label.
async function importEnv(wrapper: VueWrapper, label: string): Promise<void> {
  await wrapper.find('.ds-select__trigger').trigger('click')
  const option = wrapper.findAll('.ds-select__option').find((o) => o.text() === label)
  await option!.trigger('click')
  await flushPromises()
}

async function openEditor(): Promise<VueWrapper> {
  const wrapper = mount(WheelEditorDialog, { props: { open: true, wheel: null } })
  await flushPromises()
  return wrapper
}

describe('WheelEditorDialog import from environment', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal('fetch', routedFetch())
  })
  afterEach(() => vi.unstubAllGlobals())

  it('merges an environment’s restaurant names into the selection and updates the count', async () => {
    const wrapper = await openEditor()
    expect(wrapper.text()).toContain('0 selected')

    await importEnv(wrapper, 'Work')

    // Alpha and Gamma resolve and are added; r9 (deleted) is skipped.
    expect(wrapper.text()).toContain('2 selected')
  })

  it('de-duplicates against existing selections and preserves prior manual picks', async () => {
    const wrapper = await openEditor()
    const rows = wrapper.findAll('.wheel-editor__list input')
    await rows[0].setValue(true) // Alpha
    await rows[1].setValue(true) // Beta
    expect(wrapper.text()).toContain('2 selected')

    await importEnv(wrapper, 'Work')

    // Alpha was already selected (not doubled); Gamma is added; Beta remains. => Alpha, Beta, Gamma.
    expect(wrapper.text()).toContain('3 selected')
    expect(wrapper.findAll('.wheel-editor__list input')[1].element).toBeTruthy()
  })

  it('skips membership ids that do not resolve, saving only resolvable names', async () => {
    const wheels = (await import('../../stores/wheels')).useWheelsStore()
    const createSpy = vi.spyOn(wheels, 'createWheel').mockResolvedValue()

    const wrapper = await openEditor()
    await wrapper.findAll('input')[0].setValue('Lunch') // name
    await importEnv(wrapper, 'Work')

    const saveButton = wrapper.findAll('button').find((b) => b.text() === 'Save')!
    await saveButton.trigger('click')
    await flushPromises()

    expect(createSpy).toHaveBeenCalledWith({
      name: 'Lunch',
      restaurantNames: ['Alpha', 'Gamma'],
      isPublic: false,
    })
  })

  it('reports the count in a toast, including the no-new-restaurants case', async () => {
    const pushSpy = vi.spyOn(useToastsStore(), 'push')
    const wrapper = await openEditor()

    await importEnv(wrapper, 'Work')
    expect(pushSpy.mock.calls.at(-1)![0].title).toBe('Added 2 restaurants')

    // "Old" references only the deleted r9, so nothing resolves.
    await importEnv(wrapper, 'Old')
    expect(pushSpy.mock.calls.at(-1)![0].title).toBe('No new restaurants added')
  })
})
