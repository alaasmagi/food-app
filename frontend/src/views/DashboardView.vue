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
import type { TabItem } from '../components/design-system/navigation/Tabs.vue'
import type { Bounds } from '../types/restaurant'
import { useEnvironmentFilteredRestaurants } from '../composables/useEnvironmentFilteredRestaurants'

const store = useRestaurantsStore()
const environments = useEnvironmentsStore()
const favourites = useFavouritesStore()
const { listLoading, listError, areaLoading, areaError, areaTruncated } = storeToRefs(store)

// Seed the "All" view from Tallinn (matching the map's default view) so the List tab has data
// before the map mounts; the map then refines this by viewport as the user pans/zooms.
const DEFAULT_TALLINN_BOUNDS: Bounds = { minLat: 59.3, minLon: 24.55, maxLat: 59.58, maxLon: 24.95 }

const editorOpen = ref(false)
const addOpen = ref(false)

// List vs map are two views of the same already-loaded catalog. Typed as a
// plain string to match the Tabs v-model contract (see EnvironmentTabs).
const view = ref('list')
const viewTabs: TabItem[] = [
  { value: 'list', label: 'List' },
  { value: 'map', label: 'Map' },
]

onMounted(() => {
  // "All" view: fetch the default (Tallinn) viewport. The full catalog is loaded lazily only when
  // an environment is selected (see the watch below).
  store.loadInBounds(DEFAULT_TALLINN_BOUNDS)
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

const visibleRestaurants = useEnvironmentFilteredRestaurants()
const mapRestaurants = visibleRestaurants

// "All" reads viewport-fetch state; an environment reads the full-catalog load state.
const loading = computed(() => (isAllView.value ? areaLoading.value : listLoading.value))
const loadError = computed(() => (isAllView.value ? areaError.value : listError.value))

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
          @click="view = tab.value"
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

    <p v-if="loading" class="dashboard__status">Loading restaurants.</p>
    <p v-else-if="loadError" class="dashboard__status dashboard__status--error">
      Restaurants could not be loaded.
    </p>
    <template v-else-if="view === 'list'">
      <p v-if="!visibleRestaurants.length" class="dashboard__status">
        <template v-if="selectedEnvironment">
          No restaurants in {{ selectedEnvironment.name }} yet — use “Add restaurants” to build it up.
        </template>
        <template v-else>No restaurants in this area — pan or zoom the map to explore.</template>
      </p>
      <div v-else class="dashboard__list">
        <RestaurantCard
          v-for="restaurant in visibleRestaurants"
          :key="restaurant.id"
          :restaurant="restaurant"
        />
      </div>
    </template>
    <RestaurantMap
      v-else
      :restaurants="mapRestaurants"
      :truncated="isAllView && areaTruncated"
      :auto-fit="!isAllView"
      class="dashboard__map"
      @bounds-change="onBoundsChange"
    />

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

.dashboard__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
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
