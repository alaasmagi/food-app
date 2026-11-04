import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import AppShell from './AppShell.vue'
import { getCurrentUser } from '../../api/account'
import * as keycloak from '../../auth/keycloak'
import { useAuthStore } from '../../stores/auth'
import type { AppUser } from '../../types/appUser'

vi.mock('vue-router', () => ({
  useRoute: () => ({ path: '/', fullPath: '/' }),
}))

vi.mock('../../api/account', () => ({
  getCurrentUser: vi.fn(),
}))

const getCurrentUserMock = vi.mocked(getCurrentUser)

const RouterLinkStub = { template: '<a><slot /></a>' }

function user(fullName: string): AppUser {
  return {
    id: 'u1',
    concurrencyToken: '',
    email: 'jdoe@example.com',
    username: 'jdoe',
    fullName,
    locale: 'en',
    sendNotifications: false,
    notificationEnvironmentId: null,
  }
}

function mountShell() {
  return mount(AppShell, { global: { stubs: { RouterLink: RouterLinkStub } } })
}

describe('AppShell', () => {
  beforeEach(() => setActivePinia(createPinia()))
  afterEach(() => vi.clearAllMocks())

  it('loads the missing user once and shows the first name next to log out', async () => {
    getCurrentUserMock.mockResolvedValue(user('Jane Doe'))

    const wrapper = mountShell()
    await flushPromises()

    expect(getCurrentUserMock).toHaveBeenCalledTimes(1)
    const row = wrapper.find('.shell__user')
    expect(row.find('.shell__user-name').text()).toBe('Jane')
    expect(row.find('.shell__user-name').attributes('title')).toBe('Jane Doe')
    expect(row.find('button[aria-label="Log out"]').exists()).toBe(true)
  })

  it('does not refetch an already loaded user', async () => {
    useAuthStore().setCurrentUser(user('Jane Doe'))

    const wrapper = mountShell()
    await flushPromises()

    expect(getCurrentUserMock).not.toHaveBeenCalled()
    expect(wrapper.find('.shell__user-name').text()).toBe('Jane')
  })

  it('stays empty when loading fails and log out still works', async () => {
    getCurrentUserMock.mockRejectedValue(new Error('Failed to load current user (500)'))
    const logout = vi.spyOn(keycloak, 'logout').mockResolvedValue()

    const wrapper = mountShell()
    await flushPromises()

    expect(wrapper.find('.shell__user-name').text()).toBe('')
    await wrapper.find('button[aria-label="Log out"]').trigger('click')
    expect(logout).toHaveBeenCalledTimes(1)
  })
})
