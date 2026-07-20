import { apiFetch } from './client'
import type { AppUser } from '../types/appUser'

/** Fetch the current actor's AppUser via the shared bearer wrapper. */
export async function getCurrentUser(): Promise<AppUser> {
  const response = await apiFetch('/api/v1/account/me')
  if (!response.ok) {
    throw new Error(`Failed to load current user (${response.status})`)
  }
  return (await response.json()) as AppUser
}

/** Update the current actor's notification preferences; returns the updated AppUser. */
export async function updateNotificationPreferences(
  sendNotifications: boolean,
  notificationEnvironmentId: string | null,
): Promise<AppUser> {
  const response = await apiFetch('/api/v1/account/notification-preferences', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sendNotifications, notificationEnvironmentId }),
  })
  if (!response.ok) {
    throw new Error(`Failed to update notification preferences (${response.status})`)
  }
  return (await response.json()) as AppUser
}
