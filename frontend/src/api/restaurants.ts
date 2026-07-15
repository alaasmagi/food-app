import { apiFetch } from './client'
import type { DailyOffer, Restaurant } from '../types/restaurant'

/** GET /api/v1/restaurants -> bare array of RestaurantDto. */
export async function getRestaurants(): Promise<Restaurant[]> {
  const response = await apiFetch('/api/v1/restaurants')
  if (!response.ok) {
    throw new Error(`Failed to load restaurants (${response.status})`)
  }
  return (await response.json()) as Restaurant[]
}

/** GET /api/v1/restaurants/{id}/offers -> bare array of { offerText, offerPrice }. */
export async function getRestaurantOffers(id: string): Promise<DailyOffer[]> {
  const response = await apiFetch(`/api/v1/restaurants/${id}/offers`)
  if (!response.ok) {
    throw new Error(`Failed to load offers (${response.status})`)
  }
  return (await response.json()) as DailyOffer[]
}
