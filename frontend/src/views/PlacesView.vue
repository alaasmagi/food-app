<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Card from '../components/design-system/data-display/Card.vue'
import Button from '../components/design-system/forms/Button.vue'
import Icon from '../components/design-system/Icon.vue'
import EnvironmentEditorDialog from '../components/environment/EnvironmentEditorDialog.vue'
import { useEnvironmentsStore } from '../stores/environments'
import { useToastsStore } from '../stores/toasts'
import type { DiningEnvironment } from '../types/environment'

// Figma "Desktop / 05 Places": the places (dining environments) as a page instead of a dialog.
const environments = useEnvironmentsStore()
const toasts = useToastsStore()
const router = useRouter()

const editorOpen = ref(false)
const confirmingDeleteId = ref<string | null>(null)
const loaded = ref(false)

onMounted(async () => {
  try {
    await Promise.all([environments.loadEnvironments(), environments.loadMembership()])
  } finally {
    loaded.value = true
  }
})

const places = computed(() => environments.list)

function countFor(id: string): number {
  return Object.keys(environments.membershipByEnv[id] ?? {}).length
}
function hasLocation(env: DiningEnvironment): boolean {
  return env.autoFillLatitude != null && env.autoFillLongitude != null
}
function locationLabel(env: DiningEnvironment): string {
  const radius = env.autoFillRadiusMeters ?? 500
  return `${env.autoFillLatitude!.toFixed(4)}, ${env.autoFillLongitude!.toFixed(4)} · ${radius} m`
}

function spin(env: DiningEnvironment): void {
  router.push({ name: 'wheel', query: { place: env.id } })
}
function show(env: DiningEnvironment): void {
  environments.selectEnvironment(env.id)
  router.push('/')
}
async function remove(env: DiningEnvironment): Promise<void> {
  try {
    await environments.deleteEnvironment(env.id)
    toasts.push({ title: `${env.name} deleted`, tone: 'success' })
  } catch {
    toasts.push({ title: 'Could not delete the place', description: 'Please try again.', tone: 'danger' })
  } finally {
    confirmingDeleteId.value = null
  }
}
</script>

<template>
  <section class="places">
    <div class="places__header">
      <h1 class="places__title">Places</h1>
      <Button variant="primary" icon="plus" @click="router.push('/places/new')">New place</Button>
    </div>
    <p class="places__lede">
      A place is a set of restaurants you choose between — near work, near home, or anywhere you often eat.
      Spin a place to let the wheel decide.
    </p>

    <p v-if="loaded && !places.length" class="places__status">
      You have no places yet. Create one to start choosing between restaurants.
    </p>

    <Card v-for="env in places" :key="env.id" class="places__card">
      <div class="places__head">
        <div class="places__titles">
          <h2 class="places__name">{{ env.name }}</h2>
          <span v-if="env.description" class="places__desc">{{ env.description }}</span>
        </div>
        <span class="places__count">{{ countFor(env.id) }} restaurants</span>
        <template v-if="confirmingDeleteId === env.id">
          <span class="places__confirm">Delete this place?</span>
          <Button variant="danger" @click="remove(env)">Delete</Button>
          <Button variant="ghost" @click="confirmingDeleteId = null">Cancel</Button>
        </template>
        <template v-else>
          <Button variant="ghost" icon="pencil" icon-only @click="editorOpen = true">Edit {{ env.name }}</Button>
          <Button variant="ghost" icon="trash" icon-only class="places__delete" @click="confirmingDeleteId = env.id">
            Delete {{ env.name }}
          </Button>
        </template>
      </div>
      <p v-if="hasLocation(env)" class="places__location">
        <Icon name="map-pin" :size="16" />{{ locationLabel(env) }}
      </p>
      <p v-else class="places__notice">
        <Icon name="info" :size="20" />No location yet. Add one and we’ll fill this place with restaurants nearby.
      </p>
      <div class="places__actions">
        <Button variant="primary" icon="pie-chart" :disabled="countFor(env.id) < 2" @click="spin(env)">Spin {{ env.name }}</Button>
        <Button variant="secondary" icon="arrow-right" @click="show(env)">Show restaurants</Button>
        <Button v-if="!hasLocation(env)" variant="ghost" icon="map-pin" @click="editorOpen = true">Add location</Button>
      </div>
    </Card>

    <EnvironmentEditorDialog :open="editorOpen" @close="editorOpen = false" />
  </section>
</template>

<style scoped>
.places { display: flex; flex-direction: column; gap: var(--space-6); max-width: 880px; }
.places__header { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--space-4); }
.places__title { margin: 0; font-size: 36px; line-height: 44px; font-weight: var(--weight-bold); letter-spacing: -0.015em; color: var(--color-text-primary); }
.places__lede, .places__status { margin: 0; font-size: 16px; line-height: 24px; color: var(--color-text-secondary); }
.places__card { padding: var(--space-6); }
.places__head { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-3); }
.places__titles { display: flex; flex-direction: column; gap: var(--space-0-5); flex: 1; min-width: 0; }
.places__name { margin: 0; font-size: 18px; line-height: 24px; font-weight: var(--weight-semibold); color: var(--color-text-primary); }
.places__desc, .places__count { font-size: 14px; line-height: 20px; color: var(--color-text-muted); }
.places__confirm { font-size: 14px; line-height: 20px; color: var(--color-text-secondary); }
.places__delete { color: var(--color-status-danger-text); }
.places__location { display: flex; align-items: center; gap: var(--space-2); margin: 0; font-size: 14px; line-height: 20px; color: var(--color-text-secondary); }
.places__notice { display: flex; align-items: flex-start; gap: var(--space-3); margin: 0; padding: var(--space-3) var(--space-4); border: var(--border-thin) solid var(--color-status-info-border); border-radius: var(--radius-md); background: var(--color-status-info-subtle); font-size: 14px; line-height: 20px; color: var(--color-text-primary); }
.places__notice :deep(svg) { flex-shrink: 0; color: var(--color-status-info-text); }
.places__actions { display: flex; flex-wrap: wrap; gap: var(--space-2); }
</style>
