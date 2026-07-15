import { apiFetch } from './client'
import type { Favourite } from '../types/favourite'

const FAVOURITES = '/api/v1/favourites'
const JSON_HEADERS = { 'Content-Type': 'application/json' }

export interface FavouriteInput {
  restaurantId: string
  rating: number
  note: string | null
}

export async function getFavourites(): Promise<Favourite[]> {
  const response = await apiFetch(FAVOURITES)
  if (!response.ok) {
    throw new Error(`Failed to load favourites (${response.status})`)
  }
  return (await response.json()) as Favourite[]
}

export async function createFavourite(input: FavouriteInput): Promise<Favourite> {
  const response = await apiFetch(FAVOURITES, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(input),
  })
  if (!response.ok) {
    throw new Error(`Failed to create favourite (${response.status})`)
  }
  return (await response.json()) as Favourite
}

export async function updateFavourite(
  id: string,
  input: FavouriteInput,
  concurrencyToken: string,
): Promise<Favourite> {
  const response = await apiFetch(`${FAVOURITES}/${id}`, {
    method: 'PUT',
    headers: { ...JSON_HEADERS, 'If-Match': concurrencyToken },
    body: JSON.stringify({ id, ...input }),
  })
  if (!response.ok) {
    throw new Error(`Failed to update favourite (${response.status})`)
  }
  return (await response.json()) as Favourite
}
