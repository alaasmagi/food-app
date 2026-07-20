// Runtime configuration read once from Vite env vars.
// The frontend and backend deploy separately under the same parent domain
// (app.<domain> and api.<domain>), so the backend host must be configured
// rather than hardcoded. Authentication is direct-to-Keycloak (PKCE via
// keycloak-js), so the Keycloak realm is configured here too.

function required(name: string): string {
  const value = import.meta.env[name] as string | undefined
  if (!value && import.meta.env.DEV) {
    throw new Error(`${name} is not set. Copy .env.example to .env and set it.`)
  }
  return value ?? ''
}

// e.g. "https://api.<domain>" with any trailing slash stripped.
export const API_BASE_URL = required('VITE_API_BASE_URL').replace(/\/+$/, '')

// Keycloak base URL (authority root, e.g. "https://identity.<domain>"), realm, and
// the web public client id. keycloak-js derives the discovery/token endpoints from these.
export const KEYCLOAK_URL = required('VITE_KEYCLOAK_URL').replace(/\/+$/, '')
export const KEYCLOAK_REALM = required('VITE_KEYCLOAK_REALM')
export const KEYCLOAK_CLIENT_ID = required('VITE_KEYCLOAK_CLIENT_ID')
