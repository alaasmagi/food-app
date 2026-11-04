import { apiFetch } from '@/api/client';
import { parseProblemDetails } from '@/api/errors';
import type { AppUser } from '@/types/appUser';

/** Account API; the backend resolves the user from the bearer token, so the PATCH needs no id or If-Match. */

const ACCOUNT = '/api/v1/account';
const JSON_HEADERS = { 'Content-Type': 'application/json' };

async function unwrap<T>(res: Response): Promise<T> {
  if (!res.ok) {
    throw await parseProblemDetails(res);
  }
  return (await res.json()) as T;
}

export async function getCurrentUser(): Promise<AppUser> {
  const res = await apiFetch(`${ACCOUNT}/me`);
  return unwrap<AppUser>(res);
}

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
