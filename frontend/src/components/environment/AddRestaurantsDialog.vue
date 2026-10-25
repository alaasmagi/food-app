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
  { immediate: true },
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
            icon="bookmark"
            icon-only
            disabled
            class="picker__added"
          >
            Added
          </Button>
          <Button
            v-else
            variant="ghost"
            icon="bookmark"
            icon-only
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
/* Figma "06 Add restaurants": rows with a bookmark toggle (filled = already in the place). */
.picker { display: flex; flex-direction: column; gap: var(--space-3); }
.picker__error { margin: 0; padding: var(--space-3) var(--space-4); border: var(--border-thin) solid var(--color-status-danger-border); border-radius: var(--radius-md); background: var(--color-status-danger-subtle); color: var(--color-status-danger-text); font-size: 14px; line-height: 20px; }
.picker__list { display: flex; flex-direction: column; margin: 0; padding: 0; list-style: none; }
.picker__row { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); padding: var(--space-1) 0; border-bottom: var(--border-thin) solid var(--color-border-subtle); }
.picker__titles { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-2); min-width: 0; }
.picker__name { font-size: 14px; line-height: 20px; font-weight: var(--weight-semibold); color: var(--color-text-primary); }
.picker__empty { margin: 0; padding: var(--space-4) 0; font-size: 14px; line-height: 20px; color: var(--color-text-muted); }
/* "Added": the bookmark is filled with the accent instead of looking disabled. */
.picker__added:disabled { background: transparent; color: var(--color-accent-solid); cursor: default; }
.picker__added :deep(svg) { fill: var(--color-accent-solid); }
</style>
