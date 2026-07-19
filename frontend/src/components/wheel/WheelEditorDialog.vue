<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import Dialog from '../design-system/feedback/Dialog.vue'
import Input from '../design-system/forms/Input.vue'
import Checkbox from '../design-system/forms/Checkbox.vue'
import Switch from '../design-system/forms/Switch.vue'
import Button from '../design-system/forms/Button.vue'
import RestaurantPager from '../restaurant/RestaurantPager.vue'
import { useWheelsStore } from '../../stores/wheels'
import { useToastsStore } from '../../stores/toasts'
import { useShareWheelLink } from '../../composables/useShareWheelLink'
import { useRestaurantSearch } from '../../composables/useRestaurantSearch'
import type { UserWheel } from '../../types/wheel'

const props = defineProps<{ open: boolean; wheel?: UserWheel | null }>()
const emit = defineEmits<{ close: [] }>()

const wheels = useWheelsStore()
const toasts = useToastsStore()
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

watch(
  () => props.open,
  (open) => {
    if (!open) return
    name.value = props.wheel?.name ?? ''
    isPublic.value = props.wheel?.isPublic ?? false
    selected.clear()
    for (const restaurantName of props.wheel?.restaurantNames ?? []) selected.add(restaurantName)
    reset()
    load()
  },
  { immediate: true },
)

// At least 2 restaurants make a meaningful wheel; a name is required.
const valid = computed(() => name.value.trim().length > 0 && selected.size >= 2)

function toggle(restaurantName: string, checked: boolean): void {
  if (checked) selected.add(restaurantName)
  else selected.delete(restaurantName)
}

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
