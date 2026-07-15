import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { getCurrentUser, updateNotificationPreferences } from './account'
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

describe('account preferences API', () => {
  beforeEach(() => setActivePinia(createPinia()))
  afterEach(() => vi.unstubAllGlobals())

  it('getCurrentUser GETs /api/v1/account/me', async () => {
    const fetchMock = vi.fn().mockResolvedValue(json(appUser({ sendNotifications: true })))
    vi.stubGlobal('fetch', fetchMock)

    const user = await getCurrentUser()

    const [url] = fetchMock.mock.calls[0]
    expect(url).toContain('/api/v1/account/me')
    expect(user.sendNotifications).toBe(true)
  })

  it('updateNotificationPreferences PATCHes with the two fields', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(json(appUser({ sendNotifications: true, notificationEnvironmentId: 'e1' })))
    vi.stubGlobal('fetch', fetchMock)

    const updated = await updateNotificationPreferences(true, 'e1')

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toContain('/api/v1/account/notification-preferences')
    expect(init.method).toBe('PATCH')
    expect(JSON.parse(init.body)).toEqual({ sendNotifications: true, notificationEnvironmentId: 'e1' })
    expect(updated.notificationEnvironmentId).toBe('e1')
  })

  it('updateNotificationPreferences sends null for all environments', async () => {
    const fetchMock = vi.fn().mockResolvedValue(json(appUser({ sendNotifications: true })))
    vi.stubGlobal('fetch', fetchMock)

    await updateNotificationPreferences(true, null)

    const [, init] = fetchMock.mock.calls[0]
    expect(JSON.parse(init.body)).toEqual({ sendNotifications: true, notificationEnvironmentId: null })
  })
})
