import { apiFetch } from './client'
import type { Bounds, DailyOffer, Restaurant, RestaurantPage } from '../types/restaurant'

/** GET /api/v1/restaurants -> bare array of RestaurantDto (full catalog). */
export async function getRestaurants(): Promise<Restaurant[]> {
  const response = await apiFetch('/api/v1/restaurants')
  if (!response.ok) {
    throw new Error(`Failed to load restaurants (${response.status})`)
  }
  return (await response.json()) as Restaurant[]
}

/**
 * GET /api/v1/restaurants?minLat=&minLon=&maxLat=&maxLon=&limit= -> restaurants inside the
 * given map viewport, nearest-to-centre first, capped at `limit` by the backend. The response
 * is the same bare RestaurantDto[]; the caller infers truncation from `result.length >= limit`.
 */
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

/**
 * GET /api/v1/restaurants/page?page=&pageSize=&search= -> one page of restaurants plus the total
 * match count. Drives the searchable list view without ever fetching the whole catalog.
 */
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

/** GET /api/v1/restaurants/{id}/offers -> bare array of { offerText, offerPrice }. */
export async function getRestaurantOffers(id: string): Promise<DailyOffer[]> {
  const response = await apiFetch(`/api/v1/restaurants/${id}/offers`)
  if (!response.ok) {
    throw new Error(`Failed to load offers (${response.status})`)
  }
  return (await response.json()) as DailyOffer[]
}
