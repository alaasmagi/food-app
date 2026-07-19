<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import L from 'leaflet'
import Button from '../design-system/forms/Button.vue'
import OfferList from './OfferList.vue'
import { useRestaurantsStore } from '../../stores/restaurants'
import { useTheme, type Theme } from '../../composables/useTheme'
import type { Bounds, Restaurant } from '../../types/restaurant'
import { hasCoordinates, markerableRestaurants } from './mapMarkers'

// The map renders whatever set it is given; it does not fetch restaurants itself. Two modes:
//  - viewport (default): fetches the initial viewport once, then — rather than refetching on every
//    pan/zoom — shows a "Search this area" button the user taps to load the new viewport. This keeps
//    request volume low and the view stable (no reshuffle while the user is still looking around).
//  - autoFit: a pure viewer over a fixed, fully-loaded set (e.g. an environment's members) — it fits
//    the view to those markers and does not drive fetching.
// `focusRestaurant` (set when the user clicks "Show on map" in the list) centres/zooms on one
// restaurant and opens its popup — the one intentional exception to viewport mode's "don't move" rule.
const props = defineProps<{
  restaurants: Restaurant[]
  truncated?: boolean
  autoFit?: boolean
  focusRestaurant?: Restaurant | null
}>()
const emit = defineEmits<{ boundsChange: [bounds: Bounds] }>()

const store = useRestaurantsStore()
const { theme } = useTheme()

// CARTO basemaps matched to the app theme, so the map reads with the rest of the UI.
const TILE_URL: Record<Theme, string> = {
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
}

const mapEl = ref<HTMLElement | null>(null)
// Restaurants that carry a usable location; the rest are silently excluded.
const markerable = computed(() => markerableRestaurants(props.restaurants))

// Fallback view when nothing has coordinates (Tallinn, where the catalog lives).
const DEFAULT_CENTER: L.LatLngTuple = [59.437, 24.7536]
const DEFAULT_ZOOM = 11

// Zoom level to snap to when focusing a single restaurant from the list.
const FOCUS_ZOOM = 16

let map: L.Map | null = null
let markerLayer: L.LayerGroup | null = null
let popup: L.Popup | null = null
let tileLayer: L.TileLayer | null = null
// Id of the restaurant whose focus popup should be preserved across marker re-renders (the viewport
// re-fetch that focusing triggers would otherwise rebuild the markers and close the popup). Cleared
// when the popup closes.
let focusId: string | null = null
// True while WE move the map (initial view, focus). Programmatic moves must not surface the
// "Search this area" prompt — only a user's own pan/zoom should.
let programmaticMove = false

// Whether the "Search this area" button is showing: set when the user moves the map away from the
// last-searched viewport, cleared once they search (or we search for them).
const searchAreaVisible = ref(false)

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

async function openPopupFor(restaurant: Restaurant, latlng: L.LatLng): Promise<void> {
  if (!map || !popup) return
  selectedRestaurant.value = restaurant
  offersExpanded.value = false
  // Wait for Vue to teleport the body into the host so Leaflet measures the real
  // content - it sizes and centres the popup on the host's width at open time.
  await nextTick()
  if (!map || !popup) return
  popup.setLatLng(latlng).setContent(popupHost).openOn(map)
}

async function toggleOffers(): Promise<void> {
  const restaurant = selectedRestaurant.value
  if (!restaurant) return
  offersExpanded.value = !offersExpanded.value
  // Re-measure/re-position after the height change from expanding or collapsing.
  await nextTick()
  popup?.update()
  if (offersExpanded.value) {
    await store.loadOffers(restaurant.id)
    await nextTick()
    popup?.update()
  }
}

function renderMarkers(): void {
  if (!map || !markerLayer) return
  // Preserve an open focus popup: focusing triggers a viewport re-fetch, which lands here — closing
  // the popup would undo the "show on map" the user just asked for. Any other re-render clears stale popups.
  const preserveFocusPopup = focusId !== null && markerable.value.some((r) => r.id === focusId)
  if (!preserveFocusPopup) map.closePopup()
  markerLayer.clearLayers()
  for (const restaurant of markerable.value) {
    const latlng = L.latLng(restaurant.latitude, restaurant.longitude)
    const marker = L.marker(latlng, { icon: markerIcon, title: restaurant.name })
    marker.on('click', () => openPopupFor(restaurant, latlng))
    marker.addTo(markerLayer)
  }
}

// Run a map move that must NOT trigger the "Search this area" prompt. Uses animate:false so the
// move's moveend/zoomend fire synchronously and stay inside the programmatic window.
function withProgrammaticMove(move: () => void): void {
  programmaticMove = true
  try {
    move()
  } finally {
    programmaticMove = false
  }
}

// Centre and zoom on one restaurant, load its area, and open its popup (from "Show on map").
async function focusOn(restaurant: Restaurant): Promise<void> {
  if (!map || !hasCoordinates(restaurant)) return
  focusId = restaurant.id
  const latlng = L.latLng(restaurant.latitude, restaurant.longitude)
  withProgrammaticMove(() => map!.setView(latlng, FOCUS_ZOOM, { animate: false }))
  requestSearch() // auto-load the focused area (no button — the user asked to go here)
  await openPopupFor(restaurant, latlng)
}

// Fit the view to the current markers (autoFit mode only). Falls back to the default view when the
// set has no located restaurants.
function fitToMarkers(): void {
  if (!map) return
  const points = markerable.value.map((r) => L.latLng(r.latitude, r.longitude))
  if (points.length) {
    map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 15 })
  } else {
    map.setView(DEFAULT_CENTER, DEFAULT_ZOOM)
  }
}

// Ask the parent to fetch the current viewport, and dismiss the "Search this area" button. No-op in
// autoFit mode, where the map is a pure viewer and must not trigger fetches.
function requestSearch(): void {
  if (!map || props.autoFit) return
  const b = map.getBounds()
  const sw = b.getSouthWest()
  const ne = b.getNorthEast()
  emit('boundsChange', { minLat: sw.lat, minLon: sw.lng, maxLat: ne.lat, maxLon: ne.lng })
  searchAreaVisible.value = false
}

// A user pan/zoom (not one of ours) means the visible area no longer matches what's loaded — offer
// to search it. We don't auto-fetch, to keep requests down and the results stable while browsing.
function onUserMove(): void {
  if (programmaticMove || props.autoFit) return
  searchAreaVisible.value = true
}

onMounted(async () => {
  if (!mapEl.value) return
  map = L.map(mapEl.value, { zoomControl: true, attributionControl: true })
  tileLayer = L.tileLayer(TILE_URL[theme.value], {
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
    focusId = null
  })
  // A user pan/zoom offers "Search this area" rather than auto-fetching.
  map.on('moveend', onUserMove)
  map.on('zoomend', onUserMove)

  // Everything below moves the map ourselves (default view, initial fetch, focus) and must not raise
  // the "Search this area" prompt — keep it inside the programmatic window.
  programmaticMove = true
  // Start at the default view (Tallinn). In viewport mode we deliberately do NOT fit to markers.
  map.setView(DEFAULT_CENTER, DEFAULT_ZOOM, { animate: false })
  renderMarkers()
  // The container may have just become visible via v-if; give it a laid-out size.
  await nextTick()
  // The component may have unmounted during the await (fast view toggles); bail if so.
  if (!map) {
    programmaticMove = false
    return
  }
  // pan:false so re-measuring the container never animates a recenter (which would fire an async
  // moveend after the programmatic window and spuriously raise the "Search this area" button).
  map.invalidateSize({ pan: false })
  if (props.autoFit) {
    fitToMarkers()
  } else if (props.focusRestaurant) {
    // Arrived here via "Show on map": centre on the restaurant (which also fetches its area).
    focusOn(props.focusRestaurant)
  } else {
    // Auto-load the first viewport so the map isn't empty; later moves use the button.
    requestSearch()
  }
  programmaticMove = false
})

// New data: redraw the markers. In autoFit mode also re-fit to them; in viewport mode never move
// the map (the user's chosen viewport is what drove the fetch).
watch(markerable, () => {
  renderMarkers()
  if (props.autoFit) fitToMarkers()
})

// Switching between modes (e.g. selecting/clearing an environment) with the map already open.
watch(
  () => props.autoFit,
  (autoFit) => {
    if (autoFit) fitToMarkers()
    else requestSearch() // entering viewport mode: load the current area once
  },
)

// Focus a restaurant requested while the map is already mounted (e.g. clicking another list row's
// "Show on map" without the map unmounting in between).
watch(
  () => props.focusRestaurant,
  (restaurant) => {
    if (restaurant) focusOn(restaurant)
  },
)

// Swap the basemap in place when the app theme changes.
watch(theme, (value) => {
  tileLayer?.setUrl(TILE_URL[value])
})

onUnmounted(() => {
  map?.remove()
  map = null
  markerLayer = null
  popup = null
  tileLayer = null
})
</script>

<template>
  <div class="restaurant-map">
    <div ref="mapEl" class="restaurant-map__canvas" role="application" aria-label="Restaurant map" />

    <!-- Appears after the user moves the map; fetching is deferred to this deliberate tap. -->
    <div v-if="searchAreaVisible" class="restaurant-map__search-area">
      <Button variant="primary" size="sm" icon="search" @click="requestSearch">
        Search this area
      </Button>
    </div>

    <p v-if="truncated" class="restaurant-map__hint" role="status">
      Showing the closest restaurants — zoom in to see more.
    </p>
    <p v-if="!markerable.length" class="restaurant-map__empty">
      No restaurants have a location to show in this area.
    </p>

    <Teleport v-if="selectedRestaurant" :to="popupHost">
      <div class="restaurant-map__popup-body">
        <h3 class="restaurant-map__popup-name">{{ selectedRestaurant.name }}</h3>
        <Button
          variant="secondary"
          size="sm"
          full-width
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

/* Floating "Search this area" button, centred near the top of the map (above Leaflet panes). */
.restaurant-map__search-area {
  position: absolute;
  top: var(--space-3);
  left: 50%;
  transform: translateX(-50%);
  z-index: 500;
}

/* Cap hint floats at the bottom so it never collides with the search-area button up top. */
.restaurant-map__hint {
  position: absolute;
  bottom: var(--space-3);
  left: 50%;
  transform: translateX(-50%);
  z-index: 500;
  margin: 0;
  padding: var(--space-2) var(--space-4);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  color: var(--text-secondary);
  background: var(--surface-overlay);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-full);
  box-shadow: var(--shadow-sm);
  pointer-events: none;
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
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
}

.restaurant-map__popup-wrap .leaflet-popup-tip {
  background: var(--surface-raised);
  border: 1px solid var(--border-subtle);
}

.restaurant-map__popup-wrap .leaflet-popup-content {
  margin: var(--space-4);
}

.restaurant-map__popup-wrap a.leaflet-popup-close-button {
  top: var(--space-2);
  right: var(--space-2);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  color: var(--text-secondary);
  font-size: var(--text-md);
  border-radius: var(--radius-sm);
  transition:
    color var(--duration-fast) var(--ease-standard),
    background var(--duration-fast) var(--ease-standard);
}

.restaurant-map__popup-wrap a.leaflet-popup-close-button:hover {
  color: var(--text-primary);
  background: var(--surface-hover);
}

.restaurant-map__popup-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  min-width: 176px;
}

/* Keep the action label on one line even in the narrow popup column. */
.restaurant-map__popup-body button {
  white-space: nowrap;
}

.restaurant-map__popup-name {
  margin: 0;
  padding-right: var(--space-5);
  font-family: var(--font-display);
  font-size: var(--text-md);
  font-weight: var(--weight-semibold);
  letter-spacing: var(--tracking-tight);
  line-height: var(--leading-snug);
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
