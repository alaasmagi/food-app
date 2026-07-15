import { describe, it, expect, beforeEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import RatingStars from './RatingStars.vue'
import FavouriteEditorDialog from './FavouriteEditorDialog.vue'
import RestaurantCard from '../restaurant/RestaurantCard.vue'
import { useFavouritesStore } from '../../stores/favourites'
import { useToastsStore } from '../../stores/toasts'
import type { Favourite } from '../../types/favourite'
import type { Restaurant } from '../../types/restaurant'

function restaurant(over: Partial<Restaurant> = {}): Restaurant {
  return {
    id: 'r1',
    concurrencyToken: '',
    name: 'Bistro',
    city: 'Tallinn',
    latitude: 0,
    longitude: 0,
    offerTimeText: '11:00 to 14:00',
    parkingInfo: 'Street',
    openingInfo: 'Mon to Fri',
    hasOffers: true,
    isFastFood: false,
    offersResourceUrl: null,
    offerProviderId: null,
    ...over,
  }
}

function fav(over: Partial<Favourite> = {}): Favourite {
  return { id: 'f1', concurrencyToken: 't', restaurantId: 'r1', rating: 3, note: null, ...over }
}

describe('RatingStars', () => {
  it('shows the rating as filled stars in read-only mode and is not interactive', () => {
    const wrapper = mount(RatingStars, { props: { modelValue: 3 } })
    expect(wrapper.findAll('.stars__star')).toHaveLength(5)
    expect(wrapper.findAll('.stars__star--filled')).toHaveLength(3)
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('emits the chosen rating when editable', async () => {
    const wrapper = mount(RatingStars, { props: { modelValue: 0, editable: true } })
    const stars = wrapper.findAll('button.stars__star')
    expect(stars).toHaveLength(5)
    await stars[3].trigger('click')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([4])
  })
})

describe('FavouriteEditorDialog', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('blocks save when no valid rating is chosen', async () => {
    const favourites = useFavouritesStore()
    const upsertSpy = vi.spyOn(favourites, 'upsert').mockResolvedValue()

    const wrapper = mount(FavouriteEditorDialog, { props: { open: true, restaurantId: 'r1' } })
    const saveButton = wrapper.findAll('button').find((b) => b.text() === 'Save')!
    await saveButton.trigger('click')

    expect(upsertSpy).not.toHaveBeenCalled()
  })

  it('upserts and shows a success toast on a valid save', async () => {
    const favourites = useFavouritesStore()
    const toasts = useToastsStore()
    const upsertSpy = vi.spyOn(favourites, 'upsert').mockResolvedValue()
    const pushSpy = vi.spyOn(toasts, 'push')

    const wrapper = mount(FavouriteEditorDialog, { props: { open: true, restaurantId: 'r1' } })
    // pick a rating of 4 via the editable stars
    await wrapper.findAll('button.stars__star')[3].trigger('click')
    const saveButton = wrapper.findAll('button').find((b) => b.text() === 'Save')!
    await saveButton.trigger('click')
    await flushPromises()

    expect(upsertSpy).toHaveBeenCalledWith('r1', 4, null)
    expect(pushSpy).toHaveBeenCalledWith(expect.objectContaining({ tone: 'success' }))
  })
})

describe('RestaurantCard favourite integration', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('shows "Rate" and no stars when there is no favourite', () => {
    const wrapper = mount(RestaurantCard, { props: { restaurant: restaurant() } })
    expect(wrapper.findComponent(RatingStars).exists()).toBe(false)
    expect(wrapper.text()).toContain('Rate')
    expect(wrapper.text()).not.toContain('Edit rating')
  })

  it('shows read-only stars and "Edit rating" when a favourite exists', () => {
    const favourites = useFavouritesStore()
    favourites.byRestaurantId['r1'] = fav({ rating: 4 })

    const wrapper = mount(RestaurantCard, { props: { restaurant: restaurant() } })
    expect(wrapper.findComponent(RatingStars).exists()).toBe(true)
    expect(wrapper.findAll('.stars__star--filled')).toHaveLength(4)
    expect(wrapper.text()).toContain('Edit rating')
  })
})
