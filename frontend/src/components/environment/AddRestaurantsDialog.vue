<script setup lang="ts">
import { ref, watch } from 'vue'
import Dialog from '../design-system/feedback/Dialog.vue'
import Input from '../design-system/forms/Input.vue'
import Button from '../design-system/forms/Button.vue'
import Tag from '../design-system/data-display/Tag.vue'
import RestaurantPager from '../restaurant/RestaurantPager.vue'
import { useEnvironmentsStore } from '../../stores/environments'
import { useRestaurantSearch } from '../../composables/useRestaurantSearch'

const props = defineProps<{ open: boolean; environmentId: string; environmentName: string }>()
const emit = defineEmits<{ close: [] }>()

const environments = useEnvironmentsStore()
// Paged, searchable picker — no full-catalog fetch. Rows already in this environment are shown as
// "Added" rather than filtered out, so a page never appears empty just because it is all members.
const { items, page, totalPages, searchInput, loading, error: loadError, load, goToPage, reset } =
  useRestaurantSearch()

const addError = ref<string | null>(null)

watch(
  () => props.open,
  (open) => {
    if (!open) return
    addError.value = null
    reset()
    load()
  },
)

function isMember(restaurantId: string): boolean {
  const members = environments.membershipByEnv[props.environmentId] ?? {}
  return Boolean(members[restaurantId])
}

async function add(restaurantId: string): Promise<void> {
  addError.value = null
  try {
    await environments.addRestaurant(restaurantId)
  } catch {
    addError.value = 'The restaurant could not be added. Please try again.'
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
      <p v-if="addError" class="picker__error">{{ addError }}</p>

      <Input v-model="searchInput" icon="search" placeholder="Search restaurants" size="sm" />

      <p v-if="loading" class="picker__empty">Loading restaurants…</p>
      <p v-else-if="loadError" class="picker__empty">Restaurants could not be loaded.</p>
      <ul v-else-if="items.length" class="picker__list">
        <li v-for="restaurant in items" :key="restaurant.id" class="picker__row">
          <div class="picker__titles">
            <span class="picker__name">{{ restaurant.name }}</span>
            <Tag>{{ restaurant.city }}</Tag>
          </div>
          <Button
            v-if="isMember(restaurant.id)"
            variant="ghost"
            size="sm"
            icon="check"
            disabled
          >
            Added
          </Button>
          <Button
            v-else
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
      <p v-else class="picker__empty">No restaurants match your search.</p>

      <RestaurantPager :page="page" :total-pages="totalPages" @go="goToPage" />
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
