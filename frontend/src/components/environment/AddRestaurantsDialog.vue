<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Dialog from '../design-system/feedback/Dialog.vue'
import Input from '../design-system/forms/Input.vue'
import Button from '../design-system/forms/Button.vue'
import Tag from '../design-system/data-display/Tag.vue'
import { useRestaurantsStore } from '../../stores/restaurants'
import { useEnvironmentsStore } from '../../stores/environments'

const props = defineProps<{ open: boolean; environmentId: string; environmentName: string }>()
const emit = defineEmits<{ close: [] }>()

const restaurants = useRestaurantsStore()
const environments = useEnvironmentsStore()

const query = ref('')
const error = ref<string | null>(null)

// Reset the search each time the dialog is (re)opened.
watch(
  () => props.open,
  (open) => {
    if (open) {
      query.value = ''
      error.value = null
    }
  },
)

// Restaurants not yet in this environment. Reactive to membership, so a row
// vanishes the moment it is added.
const candidates = computed(() => {
  const members = environments.membershipByEnv[props.environmentId] ?? {}
  return restaurants.list.filter((restaurant) => !members[restaurant.id])
})

const filtered = computed(() => {
  const term = query.value.trim().toLowerCase()
  if (!term) return candidates.value
  return candidates.value.filter(
    (restaurant) =>
      restaurant.name.toLowerCase().includes(term) ||
      restaurant.city.toLowerCase().includes(term),
  )
})

async function add(restaurantId: string): Promise<void> {
  error.value = null
  try {
    await environments.addRestaurant(restaurantId)
  } catch {
    error.value = 'The restaurant could not be added. Please try again.'
  }
}
</script>

<template>
  <Dialog
    :open="open"
    :title="`Add restaurants to ${environmentName}`"
    width="480px"
    @close="emit('close')"
  >
    <div class="picker">
      <p v-if="error" class="picker__error">{{ error }}</p>

      <Input v-model="query" icon="search" placeholder="Search restaurants" size="sm" />

      <ul v-if="filtered.length" class="picker__list">
        <li v-for="restaurant in filtered" :key="restaurant.id" class="picker__row">
          <div class="picker__titles">
            <span class="picker__name">{{ restaurant.name }}</span>
            <Tag>{{ restaurant.city }}</Tag>
          </div>
          <Button
            variant="secondary"
            size="sm"
            icon="plus"
            :loading="environments.isPending(restaurant.id)"
            @click="add(restaurant.id)"
          >
            Add
          </Button>
        </li>
      </ul>
      <p v-else-if="candidates.length" class="picker__empty">
        No restaurants match your search.
      </p>
      <p v-else class="picker__empty">
        Every restaurant is already in {{ environmentName }}.
      </p>
    </div>

    <template #footer>
      <Button variant="ghost" @click="emit('close')">Done</Button>
    </template>
  </Dialog>
</template>

<style scoped>
.picker {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.picker__error {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--status-danger);
}

.picker__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  max-height: 320px;
  overflow-y: auto;
  list-style: none;
}

.picker__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-2) 0;
}

.picker__titles {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-2);
  min-width: 0;
}

.picker__name {
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--text-primary);
}

.picker__empty {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--text-secondary);
}
</style>
