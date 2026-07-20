import { apiFetch } from '@/api/client';
import { parseProblemDetails } from '@/api/errors';
import type { AppUser } from '@/types/appUser';

/**
 * Account API module for the current user's notification preferences. Both calls
 * go through the shared authenticated `apiFetch` (bearer + 401 refresh/retry).
 * The backend resolves the target user from the bearer identity, so the update
 * is a PATCH of just the two preference fields — no id and no If-Match.
 */

const ACCOUNT = '/api/v1/account';
const JSON_HEADERS = { 'Content-Type': 'application/json' };

async function unwrap<T>(res: Response): Promise<T> {
  if (!res.ok) {
    throw await parseProblemDetails(res);
  }
  return (await res.json()) as T;
}

/** GET /api/v1/account/me — the current bearer identity's AppUser. */
export async function getCurrentUser(): Promise<AppUser> {
  const res = await apiFetch(`${ACCOUNT}/me`);
  return unwrap<AppUser>(res);
}

/** PATCH /api/v1/account/notification-preferences — returns the updated AppUser. */
export async function updateNotificationPreferences(
  sendNotifications: boolean,
  notificationEnvironmentId: string | null,
): Promise<AppUser> {
  const res = await apiFetch(`${ACCOUNT}/notification-preferences`, {
    method: 'PATCH',
    headers: JSON_HEADERS,
    body: JSON.stringify({ sendNotifications, notificationEnvironmentId }),
  });
  return unwrap<AppUser>(res);
}
