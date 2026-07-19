<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
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
import { useEnvironmentFilteredRestaurants } from '../composables/useEnvironmentFilteredRestaurants'

const store = useRestaurantsStore()
const environments = useEnvironmentsStore()
const favourites = useFavouritesStore()
const { listLoading, listError, listLoaded } = storeToRefs(store)

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
  store.loadRestaurants()
  environments.loadEnvironments()
  environments.loadMembership()
  favourites.loadFavourites()
})

// Both views honour the environment filter: "All" shows the full catalog, a
// specific environment shows its members only. Under an environment, adding
// restaurants is a deliberate action via the "Add restaurants" picker rather
// than an inline toggle on every catalog card, so the tab reads as a curated
// list of that environment's restaurants.
const visibleRestaurants = useEnvironmentFilteredRestaurants()
const mapRestaurants = visibleRestaurants

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

    <p v-if="listLoading" class="dashboard__status">Loading restaurants.</p>
    <p v-else-if="listError" class="dashboard__status dashboard__status--error">
      Restaurants could not be loaded.
    </p>
    <template v-else-if="view === 'list'">
      <p v-if="listLoaded && !visibleRestaurants.length" class="dashboard__status">
        <template v-if="selectedEnvironment">
          No restaurants in {{ selectedEnvironment.name }} yet — use “Add restaurants” to build it up.
        </template>
        <template v-else>No restaurants available.</template>
      </p>
      <div v-else class="dashboard__list">
        <RestaurantCard
          v-for="restaurant in visibleRestaurants"
          :key="restaurant.id"
          :restaurant="restaurant"
        />
      </div>
    </template>
    <RestaurantMap v-else :restaurants="mapRestaurants" class="dashboard__map" />

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
