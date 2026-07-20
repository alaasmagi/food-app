import Keycloak from 'keycloak-js'
import { KEYCLOAK_CLIENT_ID, KEYCLOAK_REALM, KEYCLOAK_URL } from '../config'

// Single keycloak-js instance for the app. The adapter owns the tokens in memory;
// the Pinia auth store mirrors the current access token for the fetch wrapper and
// route guards. Nothing here writes tokens to localStorage/sessionStorage.
let keycloak: Keycloak | null = null

function instance(): Keycloak {
  if (!keycloak) {
    keycloak = new Keycloak({
      url: KEYCLOAK_URL,
      realm: KEYCLOAK_REALM,
      clientId: KEYCLOAK_CLIENT_ID,
    })
  }
  return keycloak
}

/**
 * Initialize the adapter once at startup. `check-sso` silently re-establishes the
 * session against Keycloak's own SSO session cookie (via the hidden
 * silent-check-sso iframe) with no visible login prompt. Resolves to whether the
 * user is authenticated. Never throws - a failed check degrades to unauthenticated.
 */
export async function initKeycloak(): Promise<boolean> {
  try {
    return await instance().init({
      onLoad: 'check-sso',
      pkceMethod: 'S256',
      silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
    })
  } catch {
    return false
  }
}

/** The current access token, or null when unauthenticated. */
export function getToken(): string | null {
  return instance().token ?? null
}

/** ISO 8601 expiry of the current access token, derived from its `exp` claim. */
export function getExpiresAtUtc(): string | null {
  const exp = instance().tokenParsed?.exp
  return typeof exp === 'number' ? new Date(exp * 1000).toISOString() : null
}

/**
 * Ensure a valid access token is present, refreshing it if it expires within
 * `minValidity` seconds (or silently re-acquiring via the SSO session). Resolves to
 * whether a valid token is present afterwards; never throws.
 */
export async function refreshToken(minValidity = 30): Promise<boolean> {
  const kc = instance()
  if (!kc.authenticated) return false
  try {
    await kc.updateToken(minValidity)
    return Boolean(kc.token)
  } catch {
    return false
  }
}

/** Start the Keycloak Authorization Code + PKCE login, returning to `redirectUri`. */
export async function login(redirectUri: string): Promise<void> {
  await instance().login({ redirectUri })
}

/** End the Keycloak session, returning to `redirectUri`. */
export async function logout(redirectUri: string): Promise<void> {
  await instance().logout({ redirectUri })
}
