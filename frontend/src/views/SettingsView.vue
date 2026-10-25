<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import Switch from '../components/design-system/forms/Switch.vue'
import Select, { type SelectOption } from '../components/design-system/forms/Select.vue'
import Button from '../components/design-system/forms/Button.vue'
import { updateNotificationPreferences } from '../api/account'
import { useAuthStore } from '../stores/auth'
import { useEnvironmentsStore } from '../stores/environments'
import { useToastsStore } from '../stores/toasts'
import type { AppUser } from '../types/appUser'

// Sentinel for the "All environments" option (maps to a null notificationEnvironmentId).
const ALL = '__all__'

const auth = useAuthStore()
const environments = useEnvironmentsStore()
const toasts = useToastsStore()

const sendNotifications = ref(false)
const envValue = ref<string>(ALL)
const saving = ref(false)
const loadError = ref(false)

const envOptions = computed<SelectOption[]>(() => [
  { value: ALL, label: 'All places' },
  ...environments.list.map((environment) => ({ value: environment.id, label: environment.name })),
])

function prefill(user: AppUser | null): void {
  sendNotifications.value = user?.sendNotifications ?? false
  const id = user?.notificationEnvironmentId ?? null
  // Fall back to "All environments" if the saved id no longer matches an environment.
  envValue.value = id && environments.list.some((e) => e.id === id) ? id : ALL
}

onMounted(async () => {
  const [, userResult] = await Promise.allSettled([
    environments.loadEnvironments(),
    auth.fetchCurrentUser(),
  ])
  if (userResult.status === 'rejected') loadError.value = true
  prefill(auth.currentUser)
})

async function save(): Promise<void> {
  if (saving.value) return
  saving.value = true
  try {
    const environmentId = envValue.value === ALL ? null : envValue.value
    const updated = await updateNotificationPreferences(sendNotifications.value, environmentId)
    auth.setCurrentUser(updated)
    toasts.push({ title: 'Settings saved', tone: 'success' })
  } catch {
    toasts.push({
      title: 'Could not save settings',
      description: 'Please try again.',
      tone: 'danger',
    })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section class="settings">
    <h1 class="settings__title">Settings</h1>

    <p v-if="loadError" class="settings__note">
      Your saved preferences could not be loaded. Saving will set them from the values below.
    </p>

    <div class="settings__group">
      <h2 class="settings__group-title">Daily recommendation email</h2>
      <Switch v-model="sendNotifications" label="Send me the daily recommendation email" />
      <Select
        v-model="envValue"
        label="Cover which place"
        :options="envOptions"
        :disabled="!sendNotifications"
      />
    </div>

    <div class="settings__actions">
      <Button variant="primary" :loading="saving" @click="save">Save</Button>
    </div>
  </section>
</template>

<style scoped>
/* Figma "11 Settings": 480px column, the email preference grouped in a card. */
.settings { display: flex; flex-direction: column; gap: var(--space-6); max-width: 480px; }
.settings__title { margin: 0; font-size: 36px; line-height: 44px; font-weight: var(--weight-bold); letter-spacing: -0.015em; color: var(--color-text-primary); }
.settings__note { margin: 0; padding: var(--space-3) var(--space-4); border: var(--border-thin) solid var(--color-status-warning-border); border-radius: var(--radius-md); background: var(--color-status-warning-subtle); color: var(--color-text-primary); font-size: 14px; line-height: 20px; }
.settings__group { display: flex; flex-direction: column; gap: var(--space-4); padding: var(--space-6); border: var(--border-thin) solid var(--color-border-subtle); border-radius: var(--radius-lg); background: var(--color-bg-surface); }
.settings__group-title { margin: 0; font-size: 18px; line-height: 24px; font-weight: var(--weight-semibold); color: var(--color-text-primary); }
.settings__actions { display: flex; gap: var(--space-2); }
</style>
