import { apiFetch } from './client'
import type { UserWheel } from '../types/wheel'

const WHEELS = '/api/v1/user-wheels'
const JSON_HEADERS = { 'Content-Type': 'application/json' }

export interface WheelInput {
  name: string
  restaurantNames: string[]
  isPublic: boolean
}

export async function getWheels(): Promise<UserWheel[]> {
  const response = await apiFetch(WHEELS)
  if (!response.ok) {
    throw new Error(`Failed to load wheels (${response.status})`)
  }
  return (await response.json()) as UserWheel[]
}

export async function createWheel(input: WheelInput): Promise<UserWheel> {
  const response = await apiFetch(WHEELS, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(input),
  })
  if (!response.ok) {
    throw new Error(`Failed to create wheel (${response.status})`)
  }
  return (await response.json()) as UserWheel
}

export async function updateWheel(
  id: string,
  input: WheelInput,
  concurrencyToken: string,
): Promise<UserWheel> {
  const response = await apiFetch(`${WHEELS}/${id}`, {
    method: 'PUT',
    headers: { ...JSON_HEADERS, 'If-Match': concurrencyToken },
    body: JSON.stringify({ id, ...input }),
  })
  if (!response.ok) {
    throw new Error(`Failed to update wheel (${response.status})`)
  }
  return (await response.json()) as UserWheel
}

export async function deleteWheel(id: string, concurrencyToken: string): Promise<void> {
  const response = await apiFetch(`${WHEELS}/${id}`, {
    method: 'DELETE',
    headers: { 'If-Match': concurrencyToken },
  })
  if (!response.ok) {
    throw new Error(`Failed to delete wheel (${response.status})`)
  }
}
