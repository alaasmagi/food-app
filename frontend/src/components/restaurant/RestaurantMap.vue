<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import L from 'leaflet'
import Button from '../design-system/forms/Button.vue'
import OfferList from './OfferList.vue'
import { useRestaurantsStore } from '../../stores/restaurants'
import type { Restaurant } from '../../types/restaurant'
import { markerableRestaurants } from './mapMarkers'

// The map is a pure viewer: it renders whatever set it is given and never
// fetches restaurants itself.
const props = defineProps<{ restaurants: Restaurant[] }>()

const store = useRestaurantsStore()

const mapEl = ref<HTMLElement | null>(null)
// Restaurants that carry a usable location; the rest are silently excluded.
const markerable = computed(() => markerableRestaurants(props.restaurants))

// Fallback view when nothing has coordinates (Tallinn, where the catalog lives).
const DEFAULT_CENTER: L.LatLngTuple = [59.437, 24.7536]
const DEFAULT_ZOOM = 11

let map: L.Map | null = null
let markerLayer: L.LayerGroup | null = null
let popup: L.Popup | null = null

// Vue owns the popup body; Leaflet just displays this detached host element, so
// the "See offers" action reuses the same store and OfferList as RestaurantCard.
const popupHost = document.createElement('div')
popupHost.className = 'restaurant-map__popup'
const selectedRestaurant = ref<Restaurant | null>(null)
const offersExpanded = ref(false)

const markerIcon = L.divIcon({
  className: 'restaurant-map__marker',
  html: '<span class="restaurant-map__marker-dot"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

function openPopupFor(restaurant: Restaurant, latlng: L.LatLng): void {
  if (!map || !popup) return
  selectedRestaurant.value = restaurant
  offersExpanded.value = false
  popup.setLatLng(latlng).setContent(popupHost).openOn(map)
}

async function toggleOffers(): Promise<void> {
  const restaurant = selectedRestaurant.value
  if (!restaurant) return
  offersExpanded.value = !offersExpanded.value
  if (offersExpanded.value) {
    await store.loadOffers(restaurant.id)
  }
}

function renderMarkers(): void {
  if (!map || !markerLayer) return
  map.closePopup()
  markerLayer.clearLayers()
  for (const restaurant of markerable.value) {
    const latlng = L.latLng(restaurant.latitude, restaurant.longitude)
    const marker = L.marker(latlng, { icon: markerIcon, title: restaurant.name })
    marker.on('click', () => openPopupFor(restaurant, latlng))
    marker.addTo(markerLayer)
  }
}

function fitToMarkers(): void {
  if (!map) return
  const points = markerable.value.map((r) => L.latLng(r.latitude, r.longitude))
  if (points.length) {
    map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 15 })
  } else {
    map.setView(DEFAULT_CENTER, DEFAULT_ZOOM)
  }
}

onMounted(async () => {
  if (!mapEl.value) return
  map = L.map(mapEl.value, { zoomControl: true, attributionControl: true })
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20,
  }).addTo(map)
  markerLayer = L.layerGroup().addTo(map)
  popup = L.popup({ className: 'restaurant-map__popup-wrap', autoPan: true })
  map.on('popupclose', () => {
    selectedRestaurant.value = null
    offersExpanded.value = false
  })

  renderMarkers()
  // The container may have just become visible via v-if; give it a laid-out size.
  await nextTick()
  map.invalidateSize()
  fitToMarkers()
})

watch(markerable, () => {
  renderMarkers()
  fitToMarkers()
})

onUnmounted(() => {
  map?.remove()
  map = null
  markerLayer = null
  popup = null
})
</script>

<template>
  <div class="restaurant-map">
    <div ref="mapEl" class="restaurant-map__canvas" role="application" aria-label="Restaurant map" />
    <p v-if="!markerable.length" class="restaurant-map__empty">
      No restaurants have a location to show on the map.
    </p>

    <Teleport v-if="selectedRestaurant" :to="popupHost">
      <div class="restaurant-map__popup-body">
        <h3 class="restaurant-map__popup-name">{{ selectedRestaurant.name }}</h3>
        <Button
          variant="secondary"
          size="sm"
          :icon="offersExpanded ? 'chevron-up' : 'chevron-down'"
          iconPosition="right"
          @click="toggleOffers"
        >
          {{ offersExpanded ? 'Hide offers' : 'See offers' }}
        </Button>
        <OfferList v-if="offersExpanded" :restaurant-id="selectedRestaurant.id" />
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.restaurant-map {
  position: relative;
}

.restaurant-map__canvas {
  height: 480px;
  width: 100%;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  background: var(--surface-card);
  overflow: hidden;
}

.restaurant-map__empty {
  margin: var(--space-4) 0 0;
  font-family: var(--font-body);
  font-size: var(--text-base);
  color: var(--text-secondary);
}

/* Token-styled marker, replacing Leaflet's default PNG icon. */
:deep(.restaurant-map__marker) {
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.restaurant-map__marker-dot) {
  display: block;
  width: 14px;
  height: 14px;
  border-radius: var(--radius-full);
  background: var(--accent-7);
  border: 2px solid var(--surface-app);
  box-shadow: var(--shadow-sm);
}
</style>

<!--
  Map chrome (tiles, popup, controls, attribution) lives in Leaflet's own DOM
  outside this component's scope, so it is themed with unscoped rules that
  reference the design tokens. Kept in this file to stay colocated with the map.
-->
<style>
.leaflet-container {
  background: var(--surface-app);
  font-family: var(--font-body);
}

.restaurant-map__popup-wrap .leaflet-popup-content-wrapper {
  background: var(--surface-raised);
  color: var(--text-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
}

.restaurant-map__popup-wrap .leaflet-popup-tip {
  background: var(--surface-raised);
  border: 1px solid var(--border-subtle);
}

.restaurant-map__popup-wrap .leaflet-popup-content {
  margin: var(--space-3) var(--space-4);
}

.restaurant-map__popup-wrap a.leaflet-popup-close-button {
  color: var(--text-secondary);
}

.restaurant-map__popup-name {
  margin: 0 0 var(--space-3);
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: var(--weight-semibold);
  letter-spacing: var(--tracking-tight);
  color: var(--text-primary);
}

.leaflet-control-zoom a {
  background: var(--surface-raised);
  color: var(--text-primary);
  border-color: var(--border-subtle);
}

.leaflet-control-zoom a:hover {
  background: var(--surface-hover);
}

.leaflet-control-attribution {
  background: var(--surface-overlay);
  color: var(--text-secondary);
}

.leaflet-control-attribution a {
  color: var(--text-link);
}
</style>
