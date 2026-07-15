// Runtime configuration read once from Vite env vars.
// The frontend and backend deploy separately under the same parent domain
// (app.<domain> and api.<domain>), so the backend host must be configured
// rather than hardcoded.

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined

if (!rawBaseUrl && import.meta.env.DEV) {
  throw new Error(
    'VITE_API_BASE_URL is not set. Copy .env.example to .env and set it (e.g. https://api.<domain>).',
  )
}

// e.g. "https://api.<domain>" with any trailing slash stripped.
export const API_BASE_URL = (rawBaseUrl ?? '').replace(/\/+$/, '')

/** Full URL of the token-exchange endpoint. */
export const TOKEN_URL = `${API_BASE_URL}/api/v1/account/token`

/** Backend login flow. The whole browser window navigates here. */
export function loginUrl(returnUrl: string): string {
  return `${API_BASE_URL}/account/login?returnUrl=${encodeURIComponent(returnUrl)}`
}

/** Backend logout flow, returning to the given frontend url. The whole window navigates here. */
export function logoutUrl(returnUrl: string): string {
  return `${API_BASE_URL}/account/logout?returnUrl=${encodeURIComponent(returnUrl)}`
}
