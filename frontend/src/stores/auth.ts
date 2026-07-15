import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { fetchToken as exchangeToken, getCurrentUser } from '../api/account'
import { loginUrl, LOGOUT_URL } from '../config'
import type { TokenResponse } from '../types/account'
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
  // not survive a full page reload by design; startup re-establishes it silently.
  const token = ref<string | null>(null)
  const expiresAtUtc = ref<string | null>(null)
  const currentUser = ref<AppUser | null>(null)
  const roles = ref<string[]>([])

  // Collapses concurrent token exchanges (parallel guards + 401 retry) into one call.
  let pending: Promise<boolean> | null = null

  const isAuthenticated = computed(() => {
    if (!token.value) return false
    if (!expiresAtUtc.value) return true
    return new Date(expiresAtUtc.value).getTime() > Date.now()
  })

  function hasRole(role: string): boolean {
    return roles.value.includes(role)
  }

  function setSession(session: TokenResponse): void {
    token.value = session.accessToken
    expiresAtUtc.value = session.expiresAtUtc
    roles.value = decodeRoles(session.accessToken)
  }

  function clear(): void {
    token.value = null
    expiresAtUtc.value = null
    currentUser.value = null
    roles.value = []
  }

  /**
   * Silently exchange the backend cookie for a bearer token. De-duplicated: parallel
   * callers share one in-flight request. Resolves to whether the app is now authenticated.
   */
  function fetchToken(): Promise<boolean> {
    if (pending) return pending
    pending = (async () => {
      try {
        setSession(await exchangeToken())
        return true
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

  /** Full-page navigation to the backend login flow, returning to the current URL. */
  function login(): void {
    window.location.href = loginUrl(window.location.href)
  }

  /** Clear the in-memory token, then full-page navigate to the backend logout flow. */
  function logout(): void {
    clear()
    window.location.href = LOGOUT_URL
  }

  return {
    token,
    expiresAtUtc,
    currentUser,
    roles,
    isAuthenticated,
    hasRole,
    fetchToken,
    fetchCurrentUser,
    setCurrentUser,
    login,
    logout,
  }
})
