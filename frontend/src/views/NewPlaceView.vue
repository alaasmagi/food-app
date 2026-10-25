<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import Card from '../components/design-system/data-display/Card.vue'
import Button from '../components/design-system/forms/Button.vue'
import Input from '../components/design-system/forms/Input.vue'
import Checkbox from '../components/design-system/forms/Checkbox.vue'
import EnvironmentLocationPicker, {
  type AutoFillOrigin,
} from '../components/environment/EnvironmentLocationPicker.vue'
import { useEnvironmentsStore } from '../stores/environments'
import { useToastsStore } from '../stores/toasts'

// Figma "Desktop / 12 New place": name → location + radius → fill with nearby restaurants.
// Same store calls and validation rules as the environment editor dialog.
const environments = useEnvironmentsStore()
const toasts = useToastsStore()
const router = useRouter()

const MIN_RADIUS_METERS = 1
const MAX_RADIUS_METERS = 50000

const name = ref('')
const description = ref('')
const origin = ref<AutoFillOrigin>({ latitude: null, longitude: null, radiusMeters: null })
const fillNearby = ref(true)
const saving = ref(false)
const error = ref<string | null>(null)

const located = computed(() => origin.value.latitude != null && origin.value.longitude != null)

function validateOrigin(value: AutoFillOrigin): string | null {
  const hasLat = value.latitude != null
  const hasLng = value.longitude != null
  if (hasLat !== hasLng) return 'Set both a latitude and a longitude, or clear the location.'
  if (value.radiusMeters != null && !hasLat) return 'A radius needs a location. Set a point on the map first.'
  if (value.radiusMeters != null) {
    const r = value.radiusMeters
    if (!Number.isInteger(r) || r < MIN_RADIUS_METERS || r > MAX_RADIUS_METERS) {
      return `Enter a radius between ${MIN_RADIUS_METERS} and ${MAX_RADIUS_METERS} meters.`
    }
  }
  return null
}

async function create(): Promise<void> {
  const trimmed = name.value.trim()
  if (!trimmed || saving.value) return
  const invalid = validateOrigin(origin.value)
  if (invalid) {
    error.value = invalid
    return
  }
  error.value = null
  saving.value = true
  try {
    const created = await environments.createEnvironment({
      name: trimmed,
      description: description.value.trim() || null,
      autoFillLatitude: origin.value.latitude,
      autoFillLongitude: origin.value.longitude,
      autoFillRadiusMeters: origin.value.radiusMeters,
    })
    if (located.value && fillNearby.value) {
      const result = await environments.autoFill(created.id)
      toasts.push({
        tone: 'success',
        title: `${created.name} created`,
        description:
          result.added === 1 ? 'Added 1 restaurant nearby.' : `Added ${result.added} restaurants nearby.`,
      })
    } else {
      toasts.push({ tone: 'success', title: `${created.name} created` })
    }
    environments.selectEnvironment(created.id)
    router.push('/')
  } catch {
    error.value = 'The place could not be created. Please try again.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section class="new-place">
    <Button variant="ghost" icon="arrow-left" class="new-place__back" @click="router.push('/places')">
      Back to places
    </Button>
    <h1 class="new-place__title">New place</h1>
    <ol class="new-place__steps">
      <li><span>1</span>Name</li>
      <li><span>2</span>Location</li>
      <li><span>3</span>Restaurants</li>
    </ol>

    <Card class="new-place__form">
      <p v-if="error" class="new-place__error" role="alert">{{ error }}</p>
      <Input v-model="name" label="Name" placeholder="Work" />
      <Input v-model="description" label="Description" placeholder="Optional" />
      <div class="new-place__location">
        <h2 class="new-place__section">Location</h2>
        <p class="new-place__hint">Search for an address or click the map.</p>
        <EnvironmentLocationPicker v-model="origin" />
      </div>
      <Checkbox
        v-model="fillNearby"
        :disabled="!located"
        label="Fill this place with the restaurants nearby"
      />
    </Card>

    <div class="new-place__actions">
      <Button variant="primary" icon="plus" :disabled="!name.trim()" :loading="saving" @click="create">
        Create place
      </Button>
      <Button variant="ghost" @click="router.push('/places')">Cancel</Button>
    </div>
  </section>
</template>

<style scoped>
.new-place { display: flex; flex-direction: column; gap: var(--space-6); max-width: 720px; }
.new-place__back { align-self: flex-start; margin-left: calc(-1 * var(--space-5)); }
.new-place__title { margin: 0; font-size: 36px; line-height: 44px; font-weight: var(--weight-bold); letter-spacing: -0.015em; color: var(--color-text-primary); }
.new-place__steps { display: flex; flex-wrap: wrap; gap: var(--space-4); margin: 0; padding: 0; list-style: none; font-size: 14px; line-height: 20px; color: var(--color-text-secondary); }
.new-place__steps li { display: flex; align-items: center; gap: var(--space-2); }
.new-place__steps span { padding: var(--space-0-5) var(--space-2); border: var(--border-thin) solid var(--color-accent-border); border-radius: var(--radius-sm); background: var(--color-accent-subtle); color: var(--color-accent-text); font-weight: var(--weight-semibold); }
.new-place__form { gap: var(--space-5); padding: var(--space-6); }
.new-place__location { display: flex; flex-direction: column; gap: var(--space-3); }
.new-place__section { margin: 0; font-size: 18px; line-height: 24px; font-weight: var(--weight-semibold); color: var(--color-text-primary); }
.new-place__hint { margin: 0; font-size: 14px; line-height: 20px; color: var(--color-text-secondary); }
.new-place__error { margin: 0; padding: var(--space-3) var(--space-4); border: var(--border-thin) solid var(--color-status-danger-border); border-radius: var(--radius-md); background: var(--color-status-danger-subtle); color: var(--color-status-danger-text); font-size: 14px; line-height: 20px; }
.new-place__actions { display: flex; flex-wrap: wrap; gap: var(--space-2); }
</style>
