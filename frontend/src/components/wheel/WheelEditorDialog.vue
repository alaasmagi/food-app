<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import Dialog from '../design-system/feedback/Dialog.vue'
import Input from '../design-system/forms/Input.vue'
import Checkbox from '../design-system/forms/Checkbox.vue'
import Switch from '../design-system/forms/Switch.vue'
import Button from '../design-system/forms/Button.vue'
import Select, { type SelectOption } from '../design-system/forms/Select.vue'
import RestaurantPager from '../restaurant/RestaurantPager.vue'
import { useWheelsStore } from '../../stores/wheels'
import { useToastsStore } from '../../stores/toasts'
import { useEnvironmentsStore } from '../../stores/environments'
import { useRestaurantsStore } from '../../stores/restaurants'
import { useShareWheelLink } from '../../composables/useShareWheelLink'
import { useRestaurantSearch } from '../../composables/useRestaurantSearch'
import type { UserWheel } from '../../types/wheel'

const props = defineProps<{ open: boolean; wheel?: UserWheel | null }>()
const emit = defineEmits<{ close: [] }>()

const wheels = useWheelsStore()
const toasts = useToastsStore()
// Import-from-environment reads environment membership (restaurant ids) and the restaurant catalog
// (id -> name) — both already cached client-side. No backend call is involved.
const environments = useEnvironmentsStore()
const restaurants = useRestaurantsStore()
const { copyShareLink } = useShareWheelLink()
// Paged, searchable restaurant picker — never loads the whole catalog into the dialog.
const { items, page, totalPages, searchInput, loading, error, load, goToPage, reset } = useRestaurantSearch()

// A share link is meaningful only once the wheel is saved (has an id) and public.
const canShare = computed(() => Boolean(props.wheel?.id) && isPublic.value)

const name = ref('')
const isPublic = ref(false)
// Wheels are stored by restaurant NAME, so selection is tracked by name. This survives paging and
// search (the picker only ever holds one page) and pre-fills straight from an edited wheel without
// needing the full catalog to map names back to ids.
const selected = reactive<Set<string>>(new Set())
const saving = ref(false)
// Transient: the environment chosen in the import control. It only triggers one import and is reset
// afterward — the wheel records names, never which environment they came from.
const importEnvId = ref('')

watch(
  () => props.open,
  (open) => {
    if (!open) return
    name.value = props.wheel?.name ?? ''
    isPublic.value = props.wheel?.isPublic ?? false
    selected.clear()
    for (const restaurantName of props.wheel?.restaurantNames ?? []) selected.add(restaurantName)
    importEnvId.value = ''
    reset()
    load()
    // Ensure the datasets the import resolves against are loaded (each is cached/no-op if already).
    environments.loadEnvironments()
    environments.loadMembership()
    restaurants.loadRestaurants()
  },
  { immediate: true },
)

// Environments offered by the import control; empty when the user has none.
const environmentOptions = computed<SelectOption[]>(() =>
  environments.list.map((environment) => ({ value: environment.id, label: environment.name })),
)

// At least 2 restaurants make a meaningful wheel; a name is required.
const valid = computed(() => name.value.trim().length > 0 && selected.size >= 2)

function toggle(restaurantName: string, checked: boolean): void {
  if (checked) selected.add(restaurantName)
  else selected.delete(restaurantName)
}

// Merge an environment's current restaurants into the selection, by name. Additive and
// de-duplicating: existing selections are kept and no name is added twice. Membership ids that no
// longer resolve to a catalog restaurant (deleted since) are skipped. Reports the number newly added.
function importFromEnvironment(envId: string): void {
  importEnvId.value = '' // reset the control so the same environment can be imported again
  const membership = environments.membershipByEnv[envId]
  const nameById = new Map(restaurants.list.map((restaurant) => [restaurant.id, restaurant.name]))
  let added = 0
  for (const restaurantId of Object.keys(membership ?? {})) {
    const restaurantName = nameById.get(restaurantId)
    if (!restaurantName) continue // membership references a restaurant no longer in the catalog
    if (selected.has(restaurantName)) continue // already selected — never duplicate
    selected.add(restaurantName)
    added += 1
  }
  toasts.push({
    tone: 'success',
    title:
      added === 0
        ? 'No new restaurants added'
        : added === 1
          ? 'Added 1 restaurant'
          : `Added ${added} restaurants`,
  })
}

// Choosing an environment in the control triggers one import; the empty reset value is ignored.
watch(importEnvId, (envId) => {
  if (envId) importFromEnvironment(envId)
})

async function save(): Promise<void> {
  if (!valid.value || saving.value) return
  saving.value = true
  try {
    const input = { name: name.value.trim(), restaurantNames: [...selected], isPublic: isPublic.value }
    if (props.wheel) {
      await wheels.updateWheel(props.wheel.id, input)
    } else {
      await wheels.createWheel(input)
    }
    toasts.push({ title: props.wheel ? 'Wheel updated' : 'Wheel created', tone: 'success' })
    emit('close')
  } catch {
    toasts.push({ title: 'Could not save wheel', description: 'Please try again.', tone: 'danger' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <Dialog :open="open" :title="wheel ? 'Edit wheel' : 'New wheel'" width="520px" @close="emit('close')">
    <div class="wheel-editor">
      <Input v-model="name" label="Name" placeholder="Lunch picks" size="sm" />

      <div class="wheel-editor__restaurants">
        <div class="wheel-editor__restaurants-head">
          <span class="wheel-editor__label">Restaurants ({{ selected.size }} selected)</span>
        </div>

        <Select
          v-if="environmentOptions.length"
          v-model="importEnvId"
          label="Import from environment"
          placeholder="Choose an environment"
          :options="environmentOptions"
        />
        <p v-else class="wheel-editor__hint">
          Create an environment to import its restaurants here.
        </p>

        <Input v-model="searchInput" placeholder="Search restaurants" icon="search" size="sm" />

        <p v-if="loading" class="wheel-editor__hint">Loading restaurants…</p>
        <p v-else-if="error" class="wheel-editor__hint">Restaurants could not be loaded.</p>
        <ul v-else-if="items.length" class="wheel-editor__list">
          <li v-for="restaurant in items" :key="restaurant.id" class="wheel-editor__row">
            <Checkbox
              :model-value="selected.has(restaurant.name)"
              :label="restaurant.name"
              @update:model-value="toggle(restaurant.name, $event)"
            />
          </li>
        </ul>
        <p v-else class="wheel-editor__hint">No restaurants match your search.</p>

        <RestaurantPager :page="page" :total-pages="totalPages" @go="goToPage" />

        <p v-if="selected.size < 2" class="wheel-editor__hint">Select at least 2 restaurants.</p>
      </div>

      <div class="wheel-editor__public">
        <Switch v-model="isPublic" label="Public" />
        <Button
          v-if="canShare"
          variant="ghost"
          size="sm"
          icon="link"
          @click="copyShareLink(props.wheel!.id)"
        >
          Copy share link
        </Button>
      </div>
    </div>

    <template #footer>
      <Button variant="ghost" @click="emit('close')">Cancel</Button>
      <Button variant="primary" :disabled="!valid" :loading="saving" @click="save">Save</Button>
    </template>
  </Dialog>
</template>

<style scoped>
.wheel-editor {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.wheel-editor__restaurants {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.wheel-editor__public {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.wheel-editor__label {
  font-family: var(--font-body);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  color: var(--text-secondary);
}

.wheel-editor__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  max-height: 240px;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  list-style: none;
}

.wheel-editor__hint {
  margin: 0;
  font-size: var(--text-2xs);
  color: var(--text-secondary);
}
</style>
