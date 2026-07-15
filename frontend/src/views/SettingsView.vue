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
  { value: ALL, label: 'All environments' },
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
        label="Cover which environment"
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
.settings {
  max-width: 480px;
  margin: 0 auto;
  padding: var(--space-8) var(--space-6);
}

.settings__title {
  margin: 0 0 var(--space-6);
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: var(--weight-semibold);
  letter-spacing: var(--tracking-tight);
  color: var(--text-primary);
}

.settings__note {
  margin: 0 0 var(--space-5);
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.settings__group {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.settings__group-title {
  margin: 0;
  font-family: var(--font-body);
  font-size: var(--text-md);
  font-weight: var(--weight-semibold);
  color: var(--text-primary);
}

.settings__actions {
  display: flex;
  justify-content: flex-end;
}
</style>
