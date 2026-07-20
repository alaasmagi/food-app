import { config } from '@/config/env';
import { refreshAccessToken, signOut } from '@/auth/session';
import { getAccessToken } from '@/auth/tokenStorage';

/**
 * Shared authenticated request helper. Every authenticated backend call goes
 * through here: it attaches `Authorization: Bearer <access token>` and, on a
 * 401, performs exactly one silent refresh + retry before giving up and
 * logging the user out. Concurrent refreshes are de-duplicated in session.ts.
 */

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

/**
 * Authenticated fetch against the backend. Returns the raw Response so callers
 * (API modules) can parse the backend's `IMethodResponse<T>` envelope. Throws
 * ApiError only when auth cannot be recovered.
 */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const url = resolveUrl(path);
  const token = await getAccessToken();

  let res = await fetch(url, withAuthHeader(init, token));
  if (res.status !== 401) {
    return res;
  }

  // 401: attempt one silent refresh + retry.
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

/**
 * Unauthenticated request path for public endpoints (e.g. shared wheels).
 * Never attaches a bearer token and never triggers refresh/logout.
 */
export async function publicFetch(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(resolveUrl(path), init);
}
