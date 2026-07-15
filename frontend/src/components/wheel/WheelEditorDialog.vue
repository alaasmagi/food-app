<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import Dialog from '../design-system/feedback/Dialog.vue'
import Input from '../design-system/forms/Input.vue'
import Checkbox from '../design-system/forms/Checkbox.vue'
import Switch from '../design-system/forms/Switch.vue'
import Button from '../design-system/forms/Button.vue'
import { useWheelsStore } from '../../stores/wheels'
import { useRestaurantsStore } from '../../stores/restaurants'
import { useToastsStore } from '../../stores/toasts'
import type { UserWheel } from '../../types/wheel'

const props = defineProps<{ open: boolean; wheel?: UserWheel | null }>()
const emit = defineEmits<{ close: [] }>()

const wheels = useWheelsStore()
const restaurants = useRestaurantsStore()
const toasts = useToastsStore()

const name = ref('')
const isPublic = ref(false)
const search = ref('')
// Checked restaurant ids (stable keys); resolved to names only on save.
const checkedIds = reactive<Set<string>>(new Set())
const saving = ref(false)

watch(
  () => props.open,
  (open) => {
    if (!open) return
    const wheel = props.wheel
    name.value = wheel?.name ?? ''
    isPublic.value = wheel?.isPublic ?? false
    search.value = ''
    checkedIds.clear()
    if (wheel) {
      const names = new Set(wheel.restaurantNames)
      for (const restaurant of restaurants.list) {
        if (names.has(restaurant.name)) checkedIds.add(restaurant.id)
      }
    }
  },
)

const filtered = computed(() => {
  const query = search.value.trim().toLowerCase()
  if (!query) return restaurants.list
  return restaurants.list.filter((restaurant) => restaurant.name.toLowerCase().includes(query))
})

const checkedCount = computed(() => checkedIds.size)
// At least 2 restaurants make a meaningful wheel; a name is required.
const valid = computed(() => name.value.trim().length > 0 && checkedIds.size >= 2)

function toggle(id: string, checked: boolean): void {
  if (checked) checkedIds.add(id)
  else checkedIds.delete(id)
}

async function save(): Promise<void> {
  if (!valid.value || saving.value) return
  saving.value = true
  try {
    const restaurantNames = restaurants.list
      .filter((restaurant) => checkedIds.has(restaurant.id))
      .map((restaurant) => restaurant.name)
    const input = { name: name.value.trim(), restaurantNames, isPublic: isPublic.value }
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
          <span class="wheel-editor__label">Restaurants ({{ checkedCount }} selected)</span>
        </div>
        <Input v-model="search" placeholder="Search restaurants" icon="search" size="sm" />
        <ul class="wheel-editor__list">
          <li v-for="restaurant in filtered" :key="restaurant.id" class="wheel-editor__row">
            <Checkbox
              :model-value="checkedIds.has(restaurant.id)"
              :label="restaurant.name"
              @update:model-value="toggle(restaurant.id, $event)"
            />
          </li>
        </ul>
        <p v-if="checkedCount < 2" class="wheel-editor__hint">Select at least 2 restaurants.</p>
      </div>

      <Switch v-model="isPublic" label="Public" />
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
