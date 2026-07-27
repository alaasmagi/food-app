<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import Dialog from '../design-system/feedback/Dialog.vue'
import Input from '../design-system/forms/Input.vue'
import Button from '../design-system/forms/Button.vue'
import EnvironmentLocationPicker, { type AutoFillOrigin } from './EnvironmentLocationPicker.vue'
import { useEnvironmentsStore } from '../../stores/environments'
import { useToastsStore } from '../../stores/toasts'
import type { DiningEnvironment } from '../../types/environment'

defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const store = useEnvironmentsStore()
const toasts = useToastsStore()

// Backend accepts a radius in [1, 50000] meters; mirror it so an out-of-range value never round-trips
// to a guaranteed 400.
const MIN_RADIUS_METERS = 1
const MAX_RADIUS_METERS = 50000

const newName = ref('')
const newDescription = ref('')
// Origin for the create form's optional location section.
const newOrigin = ref<AutoFillOrigin>({ latitude: null, longitude: null, radiusMeters: null })
const drafts = reactive<Record<string, string>>({})
// Per-environment origin drafts, seeded from each environment's stored auto-fill fields.
const originDrafts = reactive<Record<string, AutoFillOrigin>>({})
// Which location section is expanded: an environment id, 'new' for the create form, or null. Only one
// picker (one Leaflet map) is mounted at a time.
const expandedLocationId = ref<string | null>(null)
const confirmingDeleteId = ref<string | null>(null)
const error = ref<string | null>(null)
const locationError = ref<string | null>(null)
// Id of the environment whose auto-fill request is in flight (guards double submits).
const filling = ref<string | null>(null)

// Keep a rename draft and an origin draft per environment, seeded from the store.
watch(
  () => store.list,
  (list) => {
    for (const environment of list) {
      if (!(environment.id in drafts)) drafts[environment.id] = environment.name
      if (!(environment.id in originDrafts)) {
        originDrafts[environment.id] = {
          latitude: environment.autoFillLatitude,
          longitude: environment.autoFillLongitude,
          radiusMeters: environment.autoFillRadiusMeters,
        }
      }
    }
  },
  { immediate: true, deep: true },
)

function fail(): void {
  error.value = 'The action could not be completed. Please try again.'
}

function descriptionOf(id: string): string | null {
  return store.list.find((environment) => environment.id === id)?.description ?? null
}

function hasCoordinates(origin: AutoFillOrigin): boolean {
  return origin.latitude != null && origin.longitude != null
}

// Whether an environment has a stored origin (so it can be re-filled from the list at any time).
function hasStoredCoordinates(environment: DiningEnvironment): boolean {
  return environment.autoFillLatitude != null && environment.autoFillLongitude != null
}

// Mirror the backend's write-path rules to block an obviously invalid save. Returns a message or null.
function validateOrigin(origin: AutoFillOrigin): string | null {
  const hasLat = origin.latitude != null
  const hasLng = origin.longitude != null
  if (hasLat !== hasLng) {
    return 'Set both a latitude and a longitude, or clear the location.'
  }
  if (origin.radiusMeters != null && !hasLat) {
    return 'A radius needs a location. Set a point on the map first.'
  }
  if (origin.radiusMeters != null) {
    const radius = origin.radiusMeters
    if (!Number.isInteger(radius) || radius < MIN_RADIUS_METERS || radius > MAX_RADIUS_METERS) {
      return `Enter a radius between ${MIN_RADIUS_METERS} and ${MAX_RADIUS_METERS} meters.`
    }
  }
  return null
}

function toggleLocation(id: string): void {
  locationError.value = null
  expandedLocationId.value = expandedLocationId.value === id ? null : id
}

async function create(): Promise<void> {
  const name = newName.value.trim()
  if (!name) return
  const invalid = validateOrigin(newOrigin.value)
  if (invalid) {
    locationError.value = invalid
    return
  }
  error.value = null
  locationError.value = null
  try {
    const created = await store.createEnvironment({
      name,
      description: newDescription.value.trim() || null,
      autoFillLatitude: newOrigin.value.latitude,
      autoFillLongitude: newOrigin.value.longitude,
      autoFillRadiusMeters: newOrigin.value.radiusMeters,
    })
    const locatedCreate = hasCoordinates(newOrigin.value)
    newName.value = ''
    newDescription.value = ''
    newOrigin.value = { latitude: null, longitude: null, radiusMeters: null }
    // If it was created with a location, expand its section so the fill button is right there.
    expandedLocationId.value = locatedCreate ? created.id : null
  } catch {
    fail()
  }
}

async function rename(id: string): Promise<void> {
  const name = drafts[id]?.trim()
  if (!name) return
  error.value = null
  try {
    await store.renameEnvironment(id, { name, description: descriptionOf(id) })
  } catch {
    fail()
  }
}

// Persist the edited location (and radius) on an existing environment via the update path.
async function saveLocation(id: string): Promise<void> {
  const name = drafts[id]?.trim()
  if (!name) return
  const origin = originDrafts[id]
  const invalid = validateOrigin(origin)
  if (invalid) {
    locationError.value = invalid
    return
  }
  error.value = null
  locationError.value = null
  try {
    await store.renameEnvironment(id, {
      name,
      description: descriptionOf(id),
      autoFillLatitude: origin.latitude,
      autoFillLongitude: origin.longitude,
      autoFillRadiusMeters: origin.radiusMeters,
    })
  } catch {
    fail()
  }
}

async function fill(id: string): Promise<void> {
  if (filling.value) return
  filling.value = id
  error.value = null
  try {
    const result = await store.autoFill(id)
    const total = result.totalMembers
    toasts.push({
      tone: 'success',
      title:
        result.added === 0
          ? 'No new restaurants added'
          : result.added === 1
            ? 'Added 1 restaurant'
            : `Added ${result.added} restaurants`,
      description: `This environment now has ${total} ${total === 1 ? 'restaurant' : 'restaurants'}.`,
    })
  } catch {
    fail()
  } finally {
    filling.value = null
  }
}

async function confirmDelete(id: string): Promise<void> {
  error.value = null
  try {
    await store.deleteEnvironment(id)
    confirmingDeleteId.value = null
  } catch {
    fail()
  }
}

function close(): void {
  confirmingDeleteId.value = null
  expandedLocationId.value = null
  error.value = null
  locationError.value = null
  emit('close')
}
</script>

<template>
  <Dialog :open="open" title="Manage environments" width="520px" @close="close">
    <div class="editor">
      <p v-if="error" class="editor__error">{{ error }}</p>

      <ul v-if="store.list.length" class="editor__list">
        <li v-for="environment in store.list" :key="environment.id" class="editor__row">
          <div class="editor__row-main">
            <Input v-model="drafts[environment.id]" size="sm" />
            <div class="editor__row-actions">
              <template v-if="confirmingDeleteId === environment.id">
                <span class="editor__confirm">Delete this environment?</span>
                <Button variant="danger" size="sm" @click="confirmDelete(environment.id)">
                  Confirm delete
                </Button>
                <Button variant="ghost" size="sm" @click="confirmingDeleteId = null">Cancel</Button>
              </template>
              <template v-else>
                <Button variant="secondary" size="sm" @click="rename(environment.id)">Rename</Button>
                <Button variant="ghost" size="sm" @click="toggleLocation(environment.id)">
                  Location
                </Button>
                <Button variant="ghost" size="sm" @click="confirmingDeleteId = environment.id">
                  Delete
                </Button>
              </template>
            </div>
          </div>

          <div v-if="expandedLocationId === environment.id" class="editor__location">
            <EnvironmentLocationPicker :key="environment.id" v-model="originDrafts[environment.id]" />
            <p v-if="locationError" class="editor__error">{{ locationError }}</p>
            <div class="editor__location-actions">
              <Button variant="primary" size="sm" @click="saveLocation(environment.id)">
                Save location
              </Button>
              <Button
                v-if="hasStoredCoordinates(environment)"
                variant="secondary"
                size="sm"
                icon="plus"
                :loading="filling === environment.id"
                @click="fill(environment.id)"
              >
                Fill with nearby restaurants
              </Button>
            </div>
          </div>
        </li>
      </ul>
      <p v-else class="editor__empty">You have no environments yet.</p>

      <div class="editor__create">
        <Input v-model="newName" label="New environment" placeholder="Work" size="sm" />
        <Input
          v-model="newDescription"
          label="Description"
          placeholder="Optional"
          size="sm"
          multiline
          :rows="2"
        />

        <Button variant="ghost" size="sm" @click="toggleLocation('new')">
          {{ expandedLocationId === 'new' ? 'Hide location' : 'Add location' }}
        </Button>
        <div v-if="expandedLocationId === 'new'" class="editor__location">
          <EnvironmentLocationPicker key="new" v-model="newOrigin" />
          <p v-if="locationError" class="editor__error">{{ locationError }}</p>
        </div>

        <Button variant="primary" size="sm" icon="plus" :disabled="!newName.trim()" @click="create">
          Create
        </Button>
      </div>
    </div>

    <template #footer>
      <Button variant="ghost" @click="close">Close</Button>
    </template>
  </Dialog>
</template>

<style scoped>
.editor {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.editor__error {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--status-danger);
}

.editor__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin: 0;
  padding: 0;
  list-style: none;
}

.editor__row {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.editor__row-main {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.editor__row-main :deep(.ds-input) {
  flex: 1;
}

.editor__row-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-shrink: 0;
}

.editor__confirm {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.editor__location {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-3) 0 var(--space-1);
}

.editor__location-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.editor__empty {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.editor__create {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding-top: var(--space-5);
  border-top: 1px solid var(--border-subtle);
}
</style>
