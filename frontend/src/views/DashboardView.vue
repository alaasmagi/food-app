<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRestaurantsStore } from '../stores/restaurants'
import { useEnvironmentsStore } from '../stores/environments'
import { useFavouritesStore } from '../stores/favourites'
import RestaurantCard from '../components/restaurant/RestaurantCard.vue'
import EnvironmentTabs from '../components/environment/EnvironmentTabs.vue'
import EnvironmentEditorDialog from '../components/environment/EnvironmentEditorDialog.vue'
import Button from '../components/design-system/forms/Button.vue'

const store = useRestaurantsStore()
const environments = useEnvironmentsStore()
const favourites = useFavouritesStore()
const { list, listLoading, listError, listLoaded } = storeToRefs(store)

const editorOpen = ref(false)

onMounted(() => {
  store.loadRestaurants()
  environments.loadEnvironments()
  environments.loadMembership()
  favourites.loadFavourites()
})

// Client-side filter of the already-loaded catalog by the selected environment.
// "All" (null selection) shows the full catalog with no extra fetch.
const visibleRestaurants = computed(() => {
  if (environments.selectedEnvironmentId === null) return list.value
  return list.value.filter((restaurant) => environments.isMember(restaurant.id))
})
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

    <p v-if="listLoading" class="dashboard__status">Loading restaurants.</p>
    <p v-else-if="listError" class="dashboard__status dashboard__status--error">
      Restaurants could not be loaded.
    </p>
    <p v-else-if="listLoaded && !visibleRestaurants.length" class="dashboard__status">
      No restaurants in this environment.
    </p>
    <div v-else class="dashboard__list">
      <RestaurantCard
        v-for="restaurant in visibleRestaurants"
        :key="restaurant.id"
        :restaurant="restaurant"
      />
    </div>

    <EnvironmentEditorDialog :open="editorOpen" @close="editorOpen = false" />
  </section>
</template>

<style scoped>
.dashboard {
  max-width: 720px;
  margin: 0 auto;
  padding: var(--space-8) var(--space-6);
}

.dashboard__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-5);
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
  margin-bottom: var(--space-6);
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
