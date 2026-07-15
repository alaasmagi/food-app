import { describe, it, expect, beforeEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import * as accountApi from '../api/account'
import SettingsView from './SettingsView.vue'
import { useAuthStore } from '../stores/auth'
import { useEnvironmentsStore } from '../stores/environments'
import { useToastsStore } from '../stores/toasts'
import type { AppUser } from '../types/appUser'
import type { DiningEnvironment } from '../types/environment'

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

function env(id: string, name: string): DiningEnvironment {
  return { id, concurrencyToken: 't', name, description: null }
}

async function mountWith(user: AppUser, envs: DiningEnvironment[]) {
  const auth = useAuthStore()
  const environments = useEnvironmentsStore()
  environments.list = envs
  auth.currentUser = user
  // Keep the seeded state: stub the loaders so onMounted does not overwrite it.
  vi.spyOn(auth, 'fetchCurrentUser').mockResolvedValue()
  vi.spyOn(environments, 'loadEnvironments').mockResolvedValue()
  const wrapper = mount(SettingsView)
  await flushPromises()
  return { wrapper, auth }
}

describe('SettingsView', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('prefills the switch and environment select from the current user', async () => {
    const { wrapper } = await mountWith(
      appUser({ sendNotifications: true, notificationEnvironmentId: 'e1' }),
      [env('e1', 'Work')],
    )
    expect(wrapper.find('.ds-switch__input').element as HTMLInputElement).toBeTruthy()
    expect((wrapper.find('.ds-switch__input').element as HTMLInputElement).checked).toBe(true)
    expect(wrapper.find('.ds-select__value').text()).toBe('Work')
  })

  it('disables the environment select when notifications are off', async () => {
    const { wrapper } = await mountWith(appUser({ sendNotifications: false }), [env('e1', 'Work')])
    expect(wrapper.find('.ds-select').classes()).toContain('ds-select--disabled')
  })

  it('offers only "All environments" when the user has none', async () => {
    const { wrapper } = await mountWith(appUser({ sendNotifications: true }), [])
    await wrapper.find('.ds-select__trigger').trigger('click')
    const options = wrapper.findAll('.ds-select__option')
    expect(options).toHaveLength(1)
    expect(options[0].text()).toContain('All environments')
  })

  it('saves preferences (sentinel mapped to null) and shows a success toast', async () => {
    const updateSpy = vi
      .spyOn(accountApi, 'updateNotificationPreferences')
      .mockResolvedValue(appUser({ sendNotifications: true }))

    const { wrapper, auth } = await mountWith(appUser({ sendNotifications: true }), [env('e1', 'Work')])
    const setSpy = vi.spyOn(auth, 'setCurrentUser')
    const toasts = useToastsStore()
    const pushSpy = vi.spyOn(toasts, 'push')

    // envValue defaults to the "All environments" sentinel -> should send null.
    const saveButton = wrapper.findAll('button').find((b) => b.text() === 'Save')!
    await saveButton.trigger('click')
    await flushPromises()

    expect(updateSpy).toHaveBeenCalledWith(true, null)
    expect(setSpy).toHaveBeenCalled()
    expect(pushSpy).toHaveBeenCalledWith(expect.objectContaining({ tone: 'success' }))
  })
})
