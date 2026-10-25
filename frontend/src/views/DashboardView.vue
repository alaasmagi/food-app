<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useRestaurantsStore } from '../stores/restaurants'
import { useEnvironmentsStore } from '../stores/environments'
import { useFavouritesStore } from '../stores/favourites'
import RestaurantCard from '../components/restaurant/RestaurantCard.vue'
import RestaurantMap from '../components/restaurant/RestaurantMap.vue'
import EnvironmentTabs from '../components/environment/EnvironmentTabs.vue'
import AddRestaurantsDialog from '../components/environment/AddRestaurantsDialog.vue'
import Button from '../components/design-system/forms/Button.vue'
import Input from '../components/design-system/forms/Input.vue'
import Select from '../components/design-system/forms/Select.vue'
import Tag from '../components/design-system/data-display/Tag.vue'
import Card from '../components/design-system/data-display/Card.vue'
import Icon from '../components/design-system/Icon.vue'
import { hasCoordinates } from '../components/restaurant/mapMarkers'
import { distanceMeters, formatDistance } from '../utils/distance'
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
const listPage = ref(1)

const addOpen = ref(false)

// List vs map are two views of the same viewport-scoped set. Map is the default:
// discovery is map-first, and the map drives the viewport fetch. Typed as a plain
// string to match the Tabs v-model contract (see EnvironmentTabs).
const view = ref('map')
const viewTabs: TabItem[] = [
  { value: 'list', label: 'List' },
  { value: 'map', label: 'Map' },
]

// Router is optional here: the view is also mounted on its own in unit tests.
const route = useRoute() as ReturnType<typeof useRoute> | undefined
const router = useRouter() as ReturnType<typeof useRouter> | undefined

// First run: no places yet. Tracked locally because the store keeps its loaded flag private.
const placesChecked = ref(false)
const browseAll = ref(false)
const firstRun = computed(() => placesChecked.value && !browseAll.value && environments.list.length === 0)

onMounted(() => {
  // The map fetches its own viewport on mount, and the list fetches its page on demand — so there's
  // nothing to pre-fetch here. The full catalog is loaded lazily only when an environment is
  // selected (see the watch below).
  Promise.resolve(environments.loadEnvironments())
    .then(() => (placesChecked.value = true))
    .catch(() => {})
  environments.loadMembership()
  favourites.loadFavourites()
  focusFromQuery()
})

// "Show on map" from another page (e.g. a wheel winner) arrives as ?focus=<restaurant name>.
async function focusFromQuery(): Promise<void> {
  const name = route?.query?.focus
  if (typeof name !== 'string' || !name) return
  await store.loadRestaurants()
  const match = store.list.find((r) => r.name === name)
  if (match) focusOnMap(match)
}

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
// "Load more" for the All list: pages are appended instead of replaced (page 1 resets the set).
const allLoaded = ref<Restaurant[]>([])
watch(
  pagedList,
  (items) => {
    if (listPage.value <= 1) {
      allLoaded.value = [...items]
      return
    }
    const seen = new Set(allLoaded.value.map((r) => r.id))
    allLoaded.value = [...allLoaded.value, ...items.filter((r) => !seen.has(r.id))]
  },
  { immediate: true },
)
const listRestaurants = useEnvironmentFilteredRestaurants(allLoaded)
const mapRestaurants = useEnvironmentFilteredRestaurants(areaList)

// Server-side search + pagination for the "All" list. `searchInput` is the raw field; a debounce
// commits it to `search` (resetting to page 1) so we don't fetch on every keystroke.
const searchInput = ref('')
const search = ref('')
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

// ---- Quick filters and sorting (client-side, over the restaurants already loaded) ----
const offersOnly = ref(false)
const fastFoodOnly = ref(false)
const ratedOnly = ref(false)
const sortBy = ref('name')

// Distance needs a starting point: the selected place's saved location.
const origin = computed(() => {
  const env = selectedEnvironment.value
  if (!env || env.autoFillLatitude == null || env.autoFillLongitude == null) return null
  return { lat: env.autoFillLatitude, lon: env.autoFillLongitude }
})
const sortOptions = computed(() => [
  { value: 'name', label: 'Sort: Name' },
  { value: 'rating', label: 'Sort: Rating' },
  ...(origin.value ? [{ value: 'distance', label: 'Sort: Distance' }] : []),
])
watch(origin, (value) => {
  if (!value && sortBy.value === 'distance') sortBy.value = 'name'
})

function metersTo(r: Restaurant): number | null {
  if (!origin.value || !hasCoordinates(r)) return null
  return distanceMeters(origin.value.lat, origin.value.lon, r.latitude, r.longitude)
}
function distanceLabel(r: Restaurant): string | null {
  const m = metersTo(r)
  return m == null ? null : formatDistance(m)
}

const visibleRestaurants = computed(() => {
  const rating = (r: Restaurant) => favourites.favouriteFor(r.id)?.rating ?? 0
  const filtered = listRestaurants.value.filter(
    (r) =>
      (!offersOnly.value || r.hasOffers) &&
      (!fastFoodOnly.value || r.isFastFood) &&
      (!ratedOnly.value || rating(r) >= 4),
  )
  const sorted = [...filtered]
  if (sortBy.value === 'rating') sorted.sort((a, b) => rating(b) - rating(a) || a.name.localeCompare(b.name))
  else if (sortBy.value === 'distance')
    sorted.sort((a, b) => (metersTo(a) ?? Infinity) - (metersTo(b) ?? Infinity))
  else if (!isAllView.value) sorted.sort((a, b) => a.name.localeCompare(b.name))
  return sorted
})
const filtersActive = computed(() => offersOnly.value || fastFoodOnly.value || ratedOnly.value)
const resultLabel = computed(() => {
  const n = visibleRestaurants.value.length
  const base = isAllView.value && !filtersActive.value ? pagedTotal.value || n : n
  return `${base} ${base === 1 ? 'restaurant' : 'restaurants'}${offersOnly.value ? ' with offers today' : ''}`
})

function spinPlace(): void {
  if (!selectedEnvironment.value) return
  router?.push({ name: 'wheel', query: { place: selectedEnvironment.value.id } })
}
</script>

<template>
  <section class="dashboard">
    <div class="dashboard__header">
      <h1 class="dashboard__title">Restaurants</h1>
      <Button variant="secondary" @click="router?.push('/places')">Manage places</Button>
    </div>

    <!-- First run: no places yet (Figma "13 First run"). -->
    <Card v-if="firstRun" class="dashboard__first-run">
      <span class="dashboard__tile"><Icon name="map-pin" :size="24" /></span>
      <h2 class="dashboard__first-title">Where do you usually have lunch?</h2>
      <p class="dashboard__first-text">
        Add a place like Work or Home and we’ll fill it with the restaurants nearby. Then let the wheel decide.
      </p>
      <ol class="dashboard__steps">
        <li><span>1</span>Pick a location</li>
        <li><span>2</span>Choose a radius</li>
        <li><span>3</span>Spin</li>
      </ol>
      <div class="dashboard__first-actions">
        <Button variant="primary" icon="plus" @click="router?.push('/places/new')">Add your first place</Button>
        <Button variant="ghost" @click="browseAll = true">Browse all restaurants</Button>
      </div>
    </Card>

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
      <div class="dashboard__toolbar-actions">
        <Button
          v-if="selectedEnvironment && view === 'list'"
          variant="secondary"
          icon="plus"
          @click="addOpen = true"
        >
          Add restaurants
        </Button>
        <Button v-if="selectedEnvironment" variant="primary" icon="pie-chart" @click="spinPlace">
          Spin {{ selectedEnvironment.name }}
        </Button>
      </div>
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
      <div class="dashboard__filters">
        <Input
          v-if="isAllView"
          v-model="searchInput"
          icon="search"
          placeholder="Search restaurants by name or city"
          class="dashboard__search"
        />
        <div class="dashboard__chips" role="group" aria-label="Filters">
          <button type="button" class="dashboard__chip" :aria-pressed="offersOnly" @click="offersOnly = !offersOnly">
            <Tag :selected="offersOnly">Offers today</Tag>
          </button>
          <button type="button" class="dashboard__chip" :aria-pressed="fastFoodOnly" @click="fastFoodOnly = !fastFoodOnly">
            <Tag :selected="fastFoodOnly">Fast food</Tag>
          </button>
          <button type="button" class="dashboard__chip" :aria-pressed="ratedOnly" @click="ratedOnly = !ratedOnly">
            <Tag :selected="ratedOnly">Rated 4★+</Tag>
          </button>
        </div>
        <div class="dashboard__sort">
          <Select v-model="sortBy" :options="sortOptions" />
        </div>
      </div>
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
      <p v-else-if="!visibleRestaurants.length" class="dashboard__status">
        No restaurants match these filters.
      </p>
      <template v-else>
        <p class="dashboard__count">{{ resultLabel }}</p>
        <div class="dashboard__list">
          <RestaurantCard
            v-for="restaurant in visibleRestaurants"
            :key="restaurant.id"
            :restaurant="restaurant"
            :distance="distanceLabel(restaurant)"
            @show-on-map="focusOnMap"
          />
        </div>
      </template>
      <!-- "Load more" for the All list (pages are appended). -->
      <div v-if="isAllView && listPage < totalPages && listRestaurants.length" class="dashboard__pager">
        <Button variant="secondary" :loading="pagedLoading" @click="goToPage(listPage + 1)">
          Load more restaurants
        </Button>
      </div>
    </template>
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
/* Figma "Desktop / 02–04 Restaurants" and "13 First run". */
.dashboard { display: flex; flex-direction: column; gap: var(--space-6); max-width: 960px; }
.dashboard__header { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--space-4); }
.dashboard__title { margin: 0; font-family: var(--font-display); font-size: 36px; line-height: 44px; font-weight: var(--weight-bold); letter-spacing: -0.015em; color: var(--color-text-primary); }
.dashboard__toolbar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--space-3); }
.dashboard__toolbar-actions { display: flex; flex-wrap: wrap; gap: var(--space-3); }
/* View switch = Figma Segmented control. */
.dashboard__view-toggle { display: inline-flex; gap: var(--space-1); padding: var(--space-1); border-radius: var(--radius-md); background: var(--color-bg-sunken); }
.dashboard__view-btn { padding: var(--space-2) var(--space-3); border: var(--border-thin) solid transparent; border-radius: var(--radius-sm); background: none; color: var(--color-text-secondary); font-family: var(--font-body); font-size: 14px; line-height: 20px; font-weight: var(--weight-semibold); cursor: pointer; }
.dashboard__view-btn:hover { color: var(--color-text-primary); }
.dashboard__view-btn--active { background: var(--color-bg-surface); border-color: var(--color-accent-border); color: var(--color-text-primary); box-shadow: var(--shadow-sm); }
.dashboard__filters { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-2); }
.dashboard__search { flex: 1 1 280px; }
.dashboard__chips { display: flex; flex-wrap: wrap; gap: var(--space-2); }
.dashboard__chip { padding: 0; border: 0; background: none; border-radius: var(--radius-full); cursor: pointer; }
.dashboard__chip:focus-visible { outline: var(--border-thick) solid var(--color-focus-ring); outline-offset: 2px; }
.dashboard__sort { width: 200px; margin-left: auto; }
.dashboard__count { margin: 0; font-size: 14px; line-height: 20px; color: var(--color-text-muted); }
.dashboard__list { display: flex; flex-direction: column; gap: var(--space-4); }
.dashboard__status { margin: 0; padding: var(--space-8) 0; font-size: 16px; line-height: 24px; color: var(--color-text-secondary); }
.dashboard__status--error { color: var(--color-status-danger-text); }
.dashboard__pager { display: flex; justify-content: center; }
.dashboard__first-run { align-items: center; padding: var(--space-8); text-align: center; }
.dashboard__tile { display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; border-radius: var(--radius-md); background: var(--color-accent-subtle); color: var(--color-accent-text); }
.dashboard__first-title { margin: 0; font-size: 28px; line-height: 34px; font-weight: var(--weight-bold); letter-spacing: -0.015em; color: var(--color-text-primary); }
.dashboard__first-text { margin: 0; max-width: 560px; font-size: 16px; line-height: 24px; color: var(--color-text-secondary); }
.dashboard__steps { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--space-4); margin: 0; padding: 0; list-style: none; font-size: 14px; line-height: 20px; color: var(--color-text-secondary); }
.dashboard__steps li { display: flex; align-items: center; gap: var(--space-2); }
.dashboard__steps span { padding: var(--space-0-5) var(--space-2); border: var(--border-thin) solid var(--color-accent-border); border-radius: var(--radius-sm); background: var(--color-accent-subtle); color: var(--color-accent-text); font-weight: var(--weight-semibold); }
.dashboard__first-actions { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--space-2); }
@media (max-width: 599px) {
  .dashboard__title { font-size: 28px; line-height: 34px; }
  .dashboard__sort { width: 100%; margin-left: 0; }
}
</style>