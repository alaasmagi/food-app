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

// Assumes the default `realm_access.roles` claim shape; confirm it before relying on this for admin gating.
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
  // In-memory only by design, never web storage; startup silent SSO re-establishes it after a reload.
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

  // AppUser has no first name field, so take the first word of fullName.
  const firstName = computed(() => {
    const user = currentUser.value
    if (!user) return ''
    return user.fullName.trim().split(/\s+/)[0] || user.username
  })

  function hasRole(role: string): boolean {
    return roles.value.includes(role)
  }

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

  async function fetchCurrentUser(): Promise<void> {
    currentUser.value = await getCurrentUser()
  }

  function setCurrentUser(user: AppUser): void {
    currentUser.value = user
  }

  // The return path must be a guarded route so its guard mirrors the token into the store; the
  // default (current URL) from the public login page would loop back to login.
  function login(returnTo?: string): void {
    const redirectUri = returnTo
      ? new URL(returnTo, window.location.origin).toString()
      : window.location.href
    void kcLogin(redirectUri)
  }

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
    firstName,
    hasRole,
    syncFromKeycloak,
    fetchToken,
    fetchCurrentUser,
    setCurrentUser,
    login,
    logout,
  }
})
