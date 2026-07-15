import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from './auth'
import type { AppUser } from '../types/appUser'

function appUser(over: Partial<AppUser> = {}): AppUser {
  return {
    id: 'u1',
    concurrencyToken: 't',
    email: 'a@b.c',
    username: 'alice',
    fullName: 'Alice',
    locale: 'en',
    sendNotifications: false,
    notificationEnvironmentId: null,
    ...over,
  }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('auth store current user', () => {
  beforeEach(() => setActivePinia(createPinia()))
  afterEach(() => vi.unstubAllGlobals())

  it('fetchCurrentUser populates currentUser from /account/me', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json(appUser({ sendNotifications: true, notificationEnvironmentId: 'e1' }))))

    const store = useAuthStore()
    await store.fetchCurrentUser()

    expect(store.currentUser?.sendNotifications).toBe(true)
    expect(store.currentUser?.notificationEnvironmentId).toBe('e1')
  })

  it('setCurrentUser replaces currentUser in memory', () => {
    const store = useAuthStore()
    store.setCurrentUser(appUser({ username: 'bob' }))
    expect(store.currentUser?.username).toBe('bob')
  })
})
