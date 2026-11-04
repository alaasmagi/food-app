import { apiFetch } from './client'
import type { Bounds, DailyOffer, Restaurant, RestaurantPage } from '../types/restaurant'

export async function getRestaurants(): Promise<Restaurant[]> {
  const response = await apiFetch('/api/v1/restaurants')
  if (!response.ok) {
    throw new Error(`Failed to load restaurants (${response.status})`)
  }
  return (await response.json()) as Restaurant[]
}

export async function getRestaurantsInBounds(bounds: Bounds, limit: number): Promise<Restaurant[]> {
  const params = new URLSearchParams({
    minLat: String(bounds.minLat),
    minLon: String(bounds.minLon),
    maxLat: String(bounds.maxLat),
    maxLon: String(bounds.maxLon),
    limit: String(limit),
  })
  const response = await apiFetch(`/api/v1/restaurants?${params.toString()}`)
  if (!response.ok) {
    throw new Error(`Failed to load restaurants (${response.status})`)
  }
  return (await response.json()) as Restaurant[]
}

export async function getRestaurantsPage(params: {
  page: number
  pageSize: number
  search?: string
}): Promise<RestaurantPage> {
  const query = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize),
  })
  const search = params.search?.trim()
  if (search) query.set('search', search)

  const response = await apiFetch(`/api/v1/restaurants/page?${query.toString()}`)
  if (!response.ok) {
    throw new Error(`Failed to load restaurants (${response.status})`)
  }
  return (await response.json()) as RestaurantPage
}

export async function getRestaurantOffers(id: string): Promise<DailyOffer[]> {
  const response = await apiFetch(`/api/v1/restaurants/${id}/offers`)
  if (!response.ok) {
    throw new Error(`Failed to load offers (${response.status})`)
  }
  return (await response.json()) as DailyOffer[]
}
