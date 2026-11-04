// Runtime configuration read once from Vite env vars.

function required(name: string): string {
  const value = import.meta.env[name] as string | undefined
  if (!value && import.meta.env.DEV) {
    throw new Error(`${name} is not set. Copy .env.example to .env and set it.`)
  }
  return value ?? ''
}

export const API_BASE_URL = required('VITE_API_BASE_URL').replace(/\/+$/, '')

export const KEYCLOAK_URL = required('VITE_KEYCLOAK_URL').replace(/\/+$/, '')
export const KEYCLOAK_REALM = required('VITE_KEYCLOAK_REALM')
export const KEYCLOAK_CLIENT_ID = required('VITE_KEYCLOAK_CLIENT_ID')

// Optional, but without it CARTO serves "API key required" placeholder tiles.
export const CARTO_API_KEY = (import.meta.env.VITE_CARTO_API_KEY as string | undefined) ?? ''
