import Keycloak from 'keycloak-js'
import { KEYCLOAK_CLIENT_ID, KEYCLOAK_REALM, KEYCLOAK_URL } from '../config'

// Single keycloak-js instance; tokens stay in memory and are never written to web storage.
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

export function getToken(): string | null {
  return instance().token ?? null
}

export function getExpiresAtUtc(): string | null {
  const exp = instance().tokenParsed?.exp
  return typeof exp === 'number' ? new Date(exp * 1000).toISOString() : null
}

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

export async function login(redirectUri: string): Promise<void> {
  await instance().login({ redirectUri })
}

export async function logout(redirectUri: string): Promise<void> {
  await instance().logout({ redirectUri })
}
