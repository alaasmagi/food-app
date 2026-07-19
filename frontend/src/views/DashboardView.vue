<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRestaurantsStore } from '../stores/restaurants'
import { useEnvironmentsStore } from '../stores/environments'
import { useFavouritesStore } from '../stores/favourites'
import RestaurantCard from '../components/restaurant/RestaurantCard.vue'
import RestaurantMap from '../components/restaurant/RestaurantMap.vue'
import EnvironmentTabs from '../components/environment/EnvironmentTabs.vue'
import EnvironmentEditorDialog from '../components/environment/EnvironmentEditorDialog.vue'
import AddRestaurantsDialog from '../components/environment/AddRestaurantsDialog.vue'
import Button from '../components/design-system/forms/Button.vue'
import Input from '../components/design-system/forms/Input.vue'
import type { TabItem } from '../components/design-system/navigation/Tabs.vue'
import type { Bounds, Restaurant } from '../types/restaurant'
import { useEnvironmentFilteredRestaurants } from '../composables/useEnvironmentFilteredRestaurants'
import { debounce } from '../utils/debounce'

const store = useRestaurantsStore()
const environments = useEnvironmentsStore()
const favourites = useFavouritesStore()
const {
  listLoading,
  listError,
  areaList,
  areaTruncated,
  pagedList,
  pagedTotal,
  pagedLoading,
  pagedError,
} = storeToRefs(store)

const PAGE_SIZE = 20

const editorOpen = ref(false)
const addOpen = ref(false)

// List vs map are two views of the same viewport-scoped set. Map is the default:
// discovery is map-first, and the map drives the viewport fetch. Typed as a plain
// string to match the Tabs v-model contract (see EnvironmentTabs).
const view = ref('map')
const viewTabs: TabItem[] = [
  { value: 'list', label: 'List' },
  { value: 'map', label: 'Map' },
]

onMounted(() => {
  // The map fetches its own viewport on mount, and the list fetches its page on demand — so there's
  // nothing to pre-fetch here. The full catalog is loaded lazily only when an environment is
  // selected (see the watch below).
  environments.loadEnvironments()
  environments.loadMembership()
  favourites.loadFavourites()
})

// "All" is viewport-scoped; a specific environment shows its full member set, so ensure the whole
// catalog is loaded when one is selected (no-op once cached). Under an environment, adding
// restaurants is a deliberate action via the "Add restaurants" picker rather than an inline toggle
// on every catalog card, so the tab reads as a curated list of that environment's restaurants.
const isAllView = computed(() => environments.selectedEnvironmentId === null)

watch(
  () => environments.selectedEnvironmentId,
  (envId) => {
    if (envId !== null) store.loadRestaurants()
  },
)

// List and map differ under "All": the list shows the paged/searchable set, the map shows the
// viewport set. Under an environment both show its members (see the composable).
const listRestaurants = useEnvironmentFilteredRestaurants(pagedList)
const mapRestaurants = useEnvironmentFilteredRestaurants(areaList)

// Server-side search + pagination for the "All" list. `searchInput` is the raw field; a debounce
// commits it to `search` (resetting to page 1) so we don't fetch on every keystroke.
const searchInput = ref('')
const search = ref('')
const listPage = ref(1)
const totalPages = computed(() => Math.max(1, Math.ceil(pagedTotal.value / PAGE_SIZE)))

const commitSearch = debounce((value: string) => {
  search.value = value.trim()
  listPage.value = 1
}, 300)
watch(searchInput, (value) => commitSearch(value))

// Load a page whenever the "All" list is active and its page or search term changes.
watch(
  [view, isAllView, listPage, search],
  () => {
    if (isAllView.value && view.value === 'list') {
      store.loadPage({ page: listPage.value, pageSize: PAGE_SIZE, search: search.value })
    }
  },
)

function goToPage(page: number): void {
  listPage.value = Math.min(Math.max(1, page), totalPages.value)
}

// "Show on map" from a list row: remember the target and switch to the map, which centres on it.
const focusRestaurant = ref<Restaurant | null>(null)
function focusOnMap(restaurant: Restaurant): void {
  focusRestaurant.value = restaurant
  view.value = 'map'
}
// Manually toggling the view clears any pending focus so the map returns to normal viewport mode.
function selectView(next: string): void {
  focusRestaurant.value = null
  view.value = next
}

// Loading/error for the LIST view only. The map is never gated by loading — it must stay mounted
// across viewport fetches, or every pan/zoom would unmount it, reset it to the default view (zoom
// out), and re-emit bounds in a refetch loop. Under "All" the list reads the paged fetch state; under
// an environment it reads the full-catalog load state.
const loading = computed(() => (isAllView.value ? pagedLoading.value : listLoading.value))
const loadError = computed(() => (isAllView.value ? pagedError.value : listError.value))

function onBoundsChange(bounds: Bounds): void {
  store.loadInBounds(bounds)
}

// The currently selected environment object (null under "All"), used to label
// the empty state and the "Add restaurants" picker.
const selectedEnvironment = computed(() =>
  environments.list.find((environment) => environment.id === environments.selectedEnvironmentId) ??
  null,
)
</script>

<template>
  <section class="dashboard">
    <div class="dashboard__header">
      <h1 class="dashboard__title">Restaurants</h1>
      <Button variant="secondary" size="sm" @click="editorOpen = true">
        Manage environments
      </Button>
    </div>

    <EnvironmentTabs class="dashboard__tabs" />

    <div class="dashboard__toolbar">
      <div class="dashboard__view-toggle" role="tablist">
        <button
          v-for="tab in viewTabs"
          :key="tab.value"
          type="button"
          role="tab"
          class="dashboard__view-btn"
          :class="{ 'dashboard__view-btn--active': view === tab.value }"
          :aria-selected="view === tab.value"
          @click="selectView(tab.value)"
        >
          {{ tab.label }}
        </button>
      </div>

      <Button
        v-if="selectedEnvironment && view === 'list'"
        variant="primary"
        size="sm"
        icon="plus"
        @click="addOpen = true"
      >
        Add restaurants
      </Button>
    </div>

    <!-- Map view. Rendered independently of loading so a viewport fetch never unmounts it. -->
    <RestaurantMap
      v-if="view === 'map'"
      :restaurants="mapRestaurants"
      :truncated="isAllView && areaTruncated"
      :auto-fit="!isAllView"
      :focus-restaurant="focusRestaurant"
      class="dashboard__map"
      @bounds-change="onBoundsChange"
    />

    <!-- List view. Its content can safely swap for a loading/empty placeholder. -->
    <template v-else>
      <Input
        v-if="isAllView"
        v-model="searchInput"
        icon="search"
        size="sm"
        placeholder="Search restaurants by name or city"
        class="dashboard__search"
      />

      <p v-if="loading" class="dashboard__status">Loading restaurants.</p>
      <p v-else-if="loadError" class="dashboard__status dashboard__status--error">
        Restaurants could not be loaded.
      </p>
      <p v-else-if="!listRestaurants.length" class="dashboard__status">
        <template v-if="selectedEnvironment">
          No restaurants in {{ selectedEnvironment.name }} yet — use “Add restaurants” to build it up.
        </template>
        <template v-else-if="search">No restaurants match “{{ search }}”.</template>
        <template v-else>No restaurants found.</template>
      </p>
      <div v-else class="dashboard__list">
        <RestaurantCard
          v-for="restaurant in listRestaurants"
          :key="restaurant.id"
          :restaurant="restaurant"
          @show-on-map="focusOnMap"
        />
      </div>

      <!-- Pagination for the "All" list. -->
      <div v-if="isAllView && totalPages > 1" class="dashboard__pager">
        <Button variant="secondary" size="sm" :disabled="listPage <= 1" @click="goToPage(listPage - 1)">
          Previous
        </Button>
        <span class="dashboard__pager-label">Page {{ listPage }} of {{ totalPages }}</span>
        <Button
          variant="secondary"
          size="sm"
          icon="arrow-right"
          iconPosition="right"
          :disabled="listPage >= totalPages"
          @click="goToPage(listPage + 1)"
        >
          Next
        </Button>
      </div>
    </template>

    <EnvironmentEditorDialog :open="editorOpen" @close="editorOpen = false" />
    <AddRestaurantsDialog
      v-if="selectedEnvironment"
      :open="addOpen"
      :environment-id="selectedEnvironment.id"
      :environment-name="selectedEnvironment.name"
      @close="addOpen = false"
    />
  </section>
</template>

<style scoped>
.dashboard {
  max-width: 720px;
  margin: 0 auto;
  padding: var(--space-10) var(--space-6) var(--space-16);
}

.dashboard__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.dashboard__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: var(--weight-semibold);
  letter-spacing: var(--tracking-tight);
  color: var(--text-primary);
}

.dashboard__tabs {
  margin-bottom: var(--space-5);
}

.dashboard__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  min-height: 32px;
  margin-bottom: var(--space-8);
}

/* Segmented control: visually distinct from the environment underline tabs, so
   the two selectors no longer read as one duplicated bar. */
.dashboard__view-toggle {
  display: inline-flex;
  gap: 2px;
  padding: 2px;
  background: var(--neutral-2);
  border-radius: var(--radius-md);
}

.dashboard__view-btn {
  padding: 5px 14px;
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--text-secondary);
  background: none;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition:
    color var(--duration-fast) var(--ease-standard),
    background var(--duration-fast) var(--ease-standard);
}

.dashboard__view-btn:hover:not(.dashboard__view-btn--active) {
  color: var(--text-primary);
}

.dashboard__view-btn--active {
  color: var(--text-primary);
  background: var(--surface-raised);
  box-shadow: var(--shadow-sm);
}

.dashboard__search {
  margin-bottom: var(--space-6);
}

.dashboard__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.dashboard__pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  margin-top: var(--space-6);
}

.dashboard__pager-label {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.dashboard__status {
  margin: 0;
  font-family: var(--font-body);
  font-size: var(--text-base);
  color: var(--text-secondary);
}

.dashboard__status--error {
  color: var(--status-danger);
}
</style>
