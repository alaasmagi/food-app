import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { getCurrentUser } from '../api/account'
import {
  getExpiresAtUtc,
  getToken,
  login as kcLogin,
  logout as kcLogout,
  refreshToken,
} from '../auth/keycloak'
import type { AppUser } from '../types/appUser'

/**
 * Best-effort extraction of realm roles from a Keycloak access token.
 * Assumes the default `realm_access.roles` claim shape; degrades to no roles if
 * the token is unreadable or the claim is absent. Confirm the claim shape before
 * relying on this for admin gating.
 */
function decodeRoles(accessToken: string): string[] {
  try {
    const payload = accessToken.split('.')[1]
    if (!payload) return []
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    const claims = JSON.parse(json) as { realm_access?: { roles?: string[] } }
    return claims.realm_access?.roles ?? []
  } catch {
    return []
  }
}

export const useAuthStore = defineStore('auth', () => {
  // In-memory only. Never written to localStorage/sessionStorage - the token does
  // not survive a full page reload by design; startup silent SSO re-establishes it.
  const token = ref<string | null>(null)
  const expiresAtUtc = ref<string | null>(null)
  const currentUser = ref<AppUser | null>(null)
  const roles = ref<string[]>([])

  // Collapses concurrent token refreshes (parallel guards + 401 retry) into one call.
  let pending: Promise<boolean> | null = null

  const isAuthenticated = computed(() => {
    if (!token.value) return false
    if (!expiresAtUtc.value) return true
    return new Date(expiresAtUtc.value).getTime() > Date.now()
  })

  function hasRole(role: string): boolean {
    return roles.value.includes(role)
  }

  // Mirror the adapter's current token into the store, or clear if none is present.
  function syncFromKeycloak(): boolean {
    const current = getToken()
    if (!current) {
      clear()
      return false
    }
    token.value = current
    expiresAtUtc.value = getExpiresAtUtc()
    roles.value = decodeRoles(current)
    return true
  }

  function clear(): void {
    token.value = null
    expiresAtUtc.value = null
    currentUser.value = null
    roles.value = []
  }

  /**
   * Silently ensure a valid Keycloak token and mirror it into the store. De-duplicated:
   * parallel callers share one in-flight refresh. Resolves to whether the app is now
   * authenticated. Replaces the former backend cookie exchange.
   */
  function fetchToken(): Promise<boolean> {
    if (pending) return pending
    pending = (async () => {
      try {
        if (await refreshToken()) return syncFromKeycloak()
        clear()
        return false
      } catch {
        clear()
        return false
      } finally {
        pending = null
      }
    })()
    return pending
  }

  /** Populate `currentUser` from GET /api/v1/account/me (in-memory only). */
  async function fetchCurrentUser(): Promise<void> {
    currentUser.value = await getCurrentUser()
  }

  /** Replace `currentUser` in memory, e.g. after a preferences update. */
  function setCurrentUser(user: AppUser): void {
    currentUser.value = user
  }

  /**
   * Start the Keycloak Authorization Code + PKCE login (full-page redirect to Keycloak).
   * Pass the in-app path to land on after login (resolved against the current origin);
   * it must be a guarded route so its navigation guard mirrors the token into the store.
   * Defaults to the current URL - do NOT rely on that default from the public login page,
   * which would loop back to login and never reach the app.
   */
  function login(returnTo?: string): void {
    const redirectUri = returnTo
      ? new URL(returnTo, window.location.origin).toString()
      : window.location.href
    void kcLogin(redirectUri)
  }

  /**
   * Clear the in-memory token, then end the Keycloak session (redirect to Keycloak's
   * end-session endpoint), returning to the app's login page.
   */
  function logout(): void {
    clear()
    void kcLogout(new URL('/login', window.location.origin).toString())
  }

  return {
    token,
    expiresAtUtc,
    currentUser,
    roles,
    isAuthenticated,
    hasRole,
    syncFromKeycloak,
    fetchToken,
    fetchCurrentUser,
    setCurrentUser,
    login,
    logout,
  }
})
