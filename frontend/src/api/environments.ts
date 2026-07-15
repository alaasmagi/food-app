import { apiFetch } from './client'
import type { DiningEnvironment, EnvironmentRestaurant } from '../types/environment'

const ENVIRONMENTS = '/api/v1/dining-environments'
const MEMBERSHIPS = '/api/v1/environment-restaurants'

const JSON_HEADERS = { 'Content-Type': 'application/json' }

export interface EnvironmentInput {
  name: string
  description: string | null
}

export async function getEnvironments(): Promise<DiningEnvironment[]> {
  const response = await apiFetch(ENVIRONMENTS)
  if (!response.ok) {
    throw new Error(`Failed to load environments (${response.status})`)
  }
  return (await response.json()) as DiningEnvironment[]
}

export async function createEnvironment(input: EnvironmentInput): Promise<DiningEnvironment> {
  const response = await apiFetch(ENVIRONMENTS, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(input),
  })
  if (!response.ok) {
    throw new Error(`Failed to create environment (${response.status})`)
  }
  return (await response.json()) as DiningEnvironment
}

export async function updateEnvironment(
  id: string,
  input: EnvironmentInput,
  concurrencyToken: string,
): Promise<DiningEnvironment> {
  const response = await apiFetch(`${ENVIRONMENTS}/${id}`, {
    method: 'PUT',
    headers: { ...JSON_HEADERS, 'If-Match': concurrencyToken },
    body: JSON.stringify({ id, ...input }),
  })
  if (!response.ok) {
    throw new Error(`Failed to update environment (${response.status})`)
  }
  return (await response.json()) as DiningEnvironment
}

export async function deleteEnvironment(id: string, concurrencyToken: string): Promise<void> {
  const response = await apiFetch(`${ENVIRONMENTS}/${id}`, {
    method: 'DELETE',
    headers: { 'If-Match': concurrencyToken },
  })
  if (!response.ok) {
    throw new Error(`Failed to delete environment (${response.status})`)
  }
}

export async function getEnvironmentRestaurants(): Promise<EnvironmentRestaurant[]> {
  const response = await apiFetch(MEMBERSHIPS)
  if (!response.ok) {
    throw new Error(`Failed to load environment memberships (${response.status})`)
  }
  return (await response.json()) as EnvironmentRestaurant[]
}

export async function addRestaurantToEnvironment(
  environmentId: string,
  restaurantId: string,
): Promise<EnvironmentRestaurant> {
  const response = await apiFetch(MEMBERSHIPS, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ environmentId, restaurantId }),
  })
  if (!response.ok) {
    throw new Error(`Failed to add restaurant to environment (${response.status})`)
  }
  return (await response.json()) as EnvironmentRestaurant
}

export async function removeRestaurantFromEnvironment(
  joinId: string,
  concurrencyToken: string,
): Promise<void> {
  const response = await apiFetch(`${MEMBERSHIPS}/${joinId}`, {
    method: 'DELETE',
    headers: { 'If-Match': concurrencyToken },
  })
  if (!response.ok) {
    throw new Error(`Failed to remove restaurant from environment (${response.status})`)
  }
}
