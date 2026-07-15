import { apiFetch } from './client'
import { TOKEN_URL } from '../config'
import type { TokenResponse } from '../types/account'
import type { AppUser } from '../types/appUser'

/** Thrown when the token exchange fails. `status` is the HTTP status (401 = cookie session expired). */
export class TokenExchangeError extends Error {
  readonly status: number

  constructor(status: number) {
    super(`Token exchange failed with status ${status}`)
    this.name = 'TokenExchangeError'
    this.status = status
  }
}

/**
 * Exchange the backend session cookie for a bearer token.
 *
 * This is the ONLY request in the app that uses `credentials: "include"`, and it
 * deliberately does NOT go through the shared client wrapper: the wrapper attaches
 * a bearer token and retries on 401 by calling this function, so routing it back
 * through the wrapper would recurse.
 */
export async function fetchToken(): Promise<TokenResponse> {
  const response = await fetch(TOKEN_URL, {
    method: 'GET',
    credentials: 'include',
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new TokenExchangeError(response.status)
  }

  return (await response.json()) as TokenResponse
}

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
