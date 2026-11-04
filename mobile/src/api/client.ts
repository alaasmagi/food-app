import { config } from '@/config/env';
import { refreshAccessToken, signOut } from '@/auth/session';
import { getAccessToken } from '@/auth/tokenStorage';

/** Authenticated request helper: attaches the bearer token and retries once after a silent refresh on 401. */

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function resolveUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  const base = config.apiBaseUrl.replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
}

function withAuthHeader(init: RequestInit, token: string | null): RequestInit {
  const headers = new Headers(init.headers ?? {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return { ...init, headers };
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const url = resolveUrl(path);
  const token = await getAccessToken();

  let res = await fetch(url, withAuthHeader(init, token));
  if (res.status !== 401) {
    return res;
  }

  try {
    const newToken = await refreshAccessToken();
    res = await fetch(url, withAuthHeader(init, newToken));
    return res;
  } catch {
    // Refresh failed (or no refresh token) — end the session.
    await signOut();
    throw new ApiError('Session expired. Please log in again.', 401);
  }
}

// Public endpoints: never attaches a token or triggers refresh/logout.
export async function publicFetch(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(resolveUrl(path), init);
}
