<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import L from 'leaflet'
import Button from '../design-system/forms/Button.vue'
import OfferList from './OfferList.vue'
import { useRestaurantsStore } from '../../stores/restaurants'
import { useTheme } from '../../composables/useTheme'
import type { Bounds, Restaurant } from '../../types/restaurant'
import { hasCoordinates, markerableRestaurants } from './mapMarkers'
import { TILE_URL } from './basemap'

// Leaflet map over the given restaurants. Viewport mode asks the parent to fetch via "Search this area";
// autoFit mode only fits the view to a fixed set and never drives fetching.
const props = defineProps<{
  restaurants: Restaurant[]
  truncated?: boolean
  autoFit?: boolean
  focusRestaurant?: Restaurant | null
}>()
const emit = defineEmits<{ boundsChange: [bounds: Bounds] }>()

const store = useRestaurantsStore()
const { theme } = useTheme()

const mapEl = ref<HTMLElement | null>(null)
const markerable = computed(() => markerableRestaurants(props.restaurants))

const DEFAULT_CENTER: L.LatLngTuple = [59.437, 24.7536]
const DEFAULT_ZOOM = 17

const FOCUS_ZOOM = 16

let map: L.Map | null = null
let markerLayer: L.LayerGroup | null = null
let popup: L.Popup | null = null
let tileLayer: L.TileLayer | null = null
// Kept outside markerLayer so viewport re-fetches (which clear that layer) never remove it.
let userMarker: L.Marker | null = null
// Focused restaurant whose popup must survive the marker re-render triggered by its own viewport fetch.
let focusId: string | null = null
// Set while we move the map ourselves, so only a user's own pan/zoom raises "Search this area".
let programmaticMove = false

const searchAreaVisible = ref(false)

// Vue owns the popup body; Leaflet only displays this detached host element.
const popupHost = document.createElement('div')
popupHost.className = 'restaurant-map__popup'
const selectedRestaurant = ref<Restaurant | null>(null)
const offersExpanded = ref(false)

// Restaurant names come from data and go into marker HTML, so escape them to avoid injection.
const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}
function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char])
}

// Built per restaurant because each carries its name; the label is positioned by CSS, so iconSize/iconAnchor cover only the dot.
function markerIconFor(name: string, hasOffers = true): L.DivIcon {
  return L.divIcon({
    className: hasOffers ? 'restaurant-map__marker' : 'restaurant-map__marker restaurant-map__marker--no-offers',
    html:
      '<span class="restaurant-map__marker-dot"></span>' +
      `<span class="restaurant-map__marker-label">${escapeHtml(name)}</span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  })
}

const userIcon = L.divIcon({
  className: 'restaurant-map__user',
  html: '<span class="restaurant-map__user-dot"></span>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

async function openPopupFor(restaurant: Restaurant, latlng: L.LatLng): Promise<void> {
  if (!map || !popup) return
  selectedRestaurant.value = restaurant
  offersExpanded.value = false
  // Leaflet sizes and centres the popup at open time, so wait for Vue to teleport the real content in.
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
  // Focusing triggers a viewport re-fetch that lands here; closing its popup would undo "Show on map".
  const preserveFocusPopup = focusId !== null && markerable.value.some((r) => r.id === focusId)
  if (!preserveFocusPopup) map.closePopup()
  markerLayer.clearLayers()
  for (const restaurant of markerable.value) {
    const latlng = L.latLng(restaurant.latitude, restaurant.longitude)
    const marker = L.marker(latlng, { icon: markerIconFor(restaurant.name, restaurant.hasOffers), title: restaurant.name })
    marker.on('click', () => openPopupFor(restaurant, latlng))
    marker.addTo(markerLayer)
  }
  declutterLabels()
}

// Uses visibility, not display, so hidden labels keep their layout box and can still be measured.
function declutterLabels(): void {
  if (!markerLayer) return
  const labels: HTMLElement[] = []
  markerLayer.eachLayer((layer) => {
    const icon = (layer as L.Marker & { _icon?: HTMLElement })._icon
    const label = icon?.querySelector<HTMLElement>('.restaurant-map__marker-label')
    if (!label) return
    label.style.visibility = '' // reset from any previous pass before measuring
    labels.push(label)
  })
  const placed: DOMRect[] = []
  for (const label of labels) {
    const rect = label.getBoundingClientRect()
    const overlaps = placed.some(
      (p) => rect.left < p.right && rect.right > p.left && rect.top < p.bottom && rect.bottom > p.top,
    )
    if (overlaps) label.style.visibility = 'hidden'
    else placed.push(rect)
  }
}

// Callers pass animate:false so moveend/zoomend fire synchronously, inside the programmatic window.
function withProgrammaticMove(move: () => void): void {
  programmaticMove = true
  try {
    move()
  } finally {
    programmaticMove = false
  }
}

async function focusOn(restaurant: Restaurant): Promise<void> {
  if (!map || !hasCoordinates(restaurant)) return
  focusId = restaurant.id
  const latlng = L.latLng(restaurant.latitude, restaurant.longitude)
  withProgrammaticMove(() => map!.setView(latlng, FOCUS_ZOOM, { animate: false }))
  requestSearch() // auto-load the focused area (no button — the user asked to go here)
  await openPopupFor(restaurant, latlng)
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

// The fetch waits for the position (or its failure) to avoid a Tallinn fetch followed by the user's area.
function centreOnUserLocation(): void {
  if (!('geolocation' in navigator)) {
    requestSearch()
    return
  }
  navigator.geolocation.getCurrentPosition(
    (position) => {
      if (!map) return
      const latlng = L.latLng(position.coords.latitude, position.coords.longitude)
      userMarker?.remove()
      userMarker = L.marker(latlng, {
        icon: userIcon,
        title: 'Your location',
        interactive: false,
        keyboard: false,
      }).addTo(map)
      withProgrammaticMove(() => map!.setView(latlng, DEFAULT_ZOOM, { animate: false }))
      requestSearch()
    },
    () => {
      if (!map) return
      requestSearch() // keep the default Tallinn view already set on mount
    },
    { timeout: 8000 },
  )
}

function requestSearch(): void {
  if (!map || props.autoFit) return
  const b = map.getBounds()
  const sw = b.getSouthWest()
  const ne = b.getNorthEast()
  emit('boundsChange', { minLat: sw.lat, minLon: sw.lng, maxLat: ne.lat, maxLon: ne.lng })
  searchAreaVisible.value = false
}

// No auto-fetch on user moves, to keep requests down and results stable while browsing.
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
  map.on('moveend', onUserMove)
  map.on('zoomend', onUserMove)
  // Zooming changes how far apart markers sit on screen, so re-run label decluttering after it.
  map.on('zoomend', declutterLabels)

  // Everything below moves the map ourselves and must not raise the "Search this area" prompt.
  programmaticMove = true
  // Viewport mode deliberately starts at the default view instead of fitting to markers.
  map.setView(DEFAULT_CENTER, DEFAULT_ZOOM, { animate: false })
  renderMarkers()
  // The container may have just become visible via v-if; give it a laid-out size.
  await nextTick()
  // The component may have unmounted during the await (fast view toggles); bail if so.
  if (!map) {
    programmaticMove = false
    return
  }
  // pan:false: an animated recenter would fire moveend after the programmatic window and raise the prompt.
  map.invalidateSize({ pan: false })
  if (props.autoFit) {
    fitToMarkers()
  } else if (props.focusRestaurant) {
    focusOn(props.focusRestaurant)
  } else {
    centreOnUserLocation()
  }
  programmaticMove = false
})

watch(markerable, () => {
  renderMarkers()
  if (props.autoFit) fitToMarkers()
})

watch(
  () => props.autoFit,
  (autoFit) => {
    if (autoFit) fitToMarkers()
    else requestSearch()
  },
)

watch(
  () => props.focusRestaurant,
  (restaurant) => {
    if (restaurant) focusOn(restaurant)
  },
)

watch(theme, (value) => {
  tileLayer?.setUrl(TILE_URL[value])
})

onUnmounted(() => {
  map?.remove()
  map = null
  markerLayer = null
  popup = null
  tileLayer = null
  userMarker = null
})
</script>

<template>
  <div class="restaurant-map">
    <div ref="mapEl" class="restaurant-map__canvas" role="application" aria-label="Restaurant map" />

    <div v-if="searchAreaVisible" class="restaurant-map__search-area">
      <Button variant="primary" size="sm" icon="search" @click="requestSearch">
        Search this area
      </Button>
    </div>

    <p v-if="truncated" class="restaurant-map__hint" role="status">
      Showing the closest restaurants — zoom in to see more.
    </p>
    <ul class="restaurant-map__legend" aria-label="Legend">
      <li><span class="restaurant-map__legend-dot" />Offers today</li>
      <li><span class="restaurant-map__legend-dot restaurant-map__legend-dot--none" />No offers today</li>
    </ul>
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
  /* Trap Leaflet's pane/control z-indexes (up to 1000) so they don't paint over modals. */
  isolation: isolate;
}
.restaurant-map__canvas { height: 640px; width: 100%; border: var(--border-thin) solid var(--color-border-subtle); border-radius: var(--radius-lg); background: var(--color-bg-sunken); overflow: hidden; }
.restaurant-map__empty { margin: var(--space-4) 0 0; font-family: var(--font-body); font-size: 16px; line-height: 24px; color: var(--color-text-secondary); }
.restaurant-map__search-area { position: absolute; top: var(--space-4); left: 50%; transform: translateX(-50%); z-index: 500; }
.restaurant-map__hint, .restaurant-map__legend { position: absolute; bottom: var(--space-4); z-index: 500; margin: 0; padding: var(--space-2) var(--space-3); background: var(--color-bg-raised); border: var(--border-thin) solid var(--color-border-subtle); border-radius: var(--radius-md); box-shadow: var(--shadow-sm); font-family: var(--font-body); pointer-events: none; }
.restaurant-map__hint { left: var(--space-4); right: 220px; max-width: max-content; font-size: 14px; line-height: 20px; color: var(--color-text-secondary); }
.restaurant-map__legend { right: var(--space-4); display: flex; gap: var(--space-4); list-style: none; font-size: 12px; line-height: 16px; color: var(--color-text-secondary); }
.restaurant-map__legend li { display: flex; align-items: center; gap: var(--space-1-5); }
.restaurant-map__legend-dot { width: 10px; height: 10px; border-radius: var(--radius-full); background: var(--color-accent-solid); border: var(--border-thick) solid var(--color-bg-surface); box-shadow: 0 0 0 1px var(--color-accent-solid); }
.restaurant-map__legend-dot--none { background: var(--color-bg-surface); }
:deep(.restaurant-map__marker) { display: flex; align-items: center; justify-content: center; overflow: visible; }
:deep(.restaurant-map__marker-label) { position: absolute; left: calc(100% + 4px); top: 50%; transform: translateY(-50%); max-width: 160px; padding: var(--space-0-5) var(--space-2); overflow: hidden; font-family: var(--font-body); font-size: 12px; line-height: 16px; font-weight: var(--weight-medium); white-space: nowrap; text-overflow: ellipsis; color: var(--color-text-primary); background: var(--color-bg-raised); border: var(--border-thin) solid var(--color-border-subtle); border-radius: var(--radius-full); box-shadow: var(--shadow-sm); pointer-events: none; }
:deep(.restaurant-map__marker-dot) { display: block; width: 16px; height: 16px; box-sizing: border-box; border-radius: var(--radius-full); background: var(--color-accent-solid); border: var(--border-thick) solid var(--color-bg-surface); box-shadow: var(--shadow-sm); }
:deep(.restaurant-map__marker--no-offers .restaurant-map__marker-dot) { background: var(--color-bg-surface); border-color: var(--color-accent-solid); }
:deep(.restaurant-map__marker--no-offers .restaurant-map__marker-label) { color: var(--color-text-secondary); }
:deep(.restaurant-map__user) { display: flex; align-items: center; justify-content: center; }
:deep(.restaurant-map__user-dot) { display: block; width: 18px; height: 18px; box-sizing: border-box; border-radius: var(--radius-full); background: var(--color-status-info-solid); border: var(--border-thick) solid var(--color-bg-surface); box-shadow: 0 0 0 4px var(--color-status-info-subtle), var(--shadow-sm); }
</style>

<!-- Leaflet's own DOM is outside this component's scope, so it is themed with unscoped rules. -->
<style>
.leaflet-container {
  background: var(--surface-app);
  font-family: var(--font-body);
}

/* The dark CARTO basemap is too low-contrast; lift only the tile pane so markers and popups are untouched. */
:root[data-theme='dark'] .restaurant-map .leaflet-tile-pane {
  filter: brightness(1.8) contrast(1.25) saturate(1.1);
}

.restaurant-map__popup-wrap .leaflet-popup-content-wrapper {
  background: var(--color-bg-raised);
  color: var(--color-text-primary);
  border: var(--border-thin) solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  padding: 0;
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

.restaurant-map__popup-body button {
  white-space: nowrap;
}

.restaurant-map__popup-name {
  margin: 0;
  font-family: var(--font-display);
  font-size: 18px;
  line-height: 24px;
  font-weight: var(--weight-semibold);
  color: var(--color-text-primary);
  /* Reserve the corner the absolutely positioned close button occupies so long names wrap before it. */
  padding-right: calc(22px + var(--space-2));
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
