<script setup lang="ts">
import { computed, h, nextTick, onMounted, onUnmounted, ref, render, watch } from 'vue'
import L from 'leaflet'
import Button from '../design-system/forms/Button.vue'
import MapDot from '../design-system/map/MapDot.vue'
import MapHint from '../design-system/map/MapHint.vue'
import MapLegend from '../design-system/map/MapLegend.vue'
import MapMarker from '../design-system/map/MapMarker.vue'
import OfferList from './OfferList.vue'
import { useRestaurantsStore } from '../../stores/restaurants'
import { useTheme } from '../../composables/useTheme'
import type { Bounds, Restaurant } from '../../types/restaurant'
import { collapsedIds, hasCoordinates, markerableRestaurants, type MarkerBox } from './mapMarkers'
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
let userDotEl: HTMLElement | null = null
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

// Leaflet positions a zero-size icon element on the coordinate; the design-system marker rendered into it
// places itself around that point (tail tip for a pill, centre for a dot).
interface MarkerEntry {
  restaurant: Restaurant
  el: HTMLElement
  collapsed: boolean
}
const markerEntries = new Map<string, MarkerEntry>()
let selectedId: string | null = null

function iconFor(el: HTMLElement): L.DivIcon {
  return L.divIcon({ className: 'restaurant-map__icon', html: el, iconSize: [0, 0] })
}

function paintMarker({ restaurant, el, collapsed }: MarkerEntry): void {
  const selected = restaurant.id === selectedId
  render(
    collapsed && !selected
      ? h(MapDot, { kind: 'place', x: 0, y: 0, label: restaurant.name })
      : h(MapMarker, { name: restaurant.name, offers: restaurant.hasOffers, selected, x: 0, y: 0 }),
    el,
  )
}

// Every marker is measured as a full pill, so a collapsed one expands again as soon as its pill fits.
function collapseOverlapping(): void {
  const entries = [...markerEntries.values()]
  for (const entry of entries) {
    entry.collapsed = false
    paintMarker(entry)
  }
  const boxes: MarkerBox[] = []
  for (const { restaurant, el } of entries) {
    const pill = el.firstElementChild
    if (!pill) continue
    boxes.push({
      id: restaurant.id,
      rect: pill.getBoundingClientRect(),
      offers: restaurant.hasOffers,
      selected: restaurant.id === selectedId,
    })
  }
  for (const id of collapsedIds(boxes)) {
    const entry = markerEntries.get(id)
    if (!entry) continue
    entry.collapsed = true
    paintMarker(entry)
  }
}

function clearMarkers(): void {
  for (const { el } of markerEntries.values()) render(null, el)
  markerEntries.clear()
  markerLayer?.clearLayers()
}

async function openPopupFor(restaurant: Restaurant, latlng: L.LatLng): Promise<void> {
  if (!map || !popup) return
  selectedRestaurant.value = restaurant
  offersExpanded.value = false
  selectedId = restaurant.id
  collapseOverlapping()
  // Leaflet sizes and centres the popup at open time, so wait for Vue to teleport the real content in.
  await nextTick()
  if (!map || !popup) return
  // The pill sits above the coordinate, so lift the popup tip (default offset 7) above the pill.
  const height = markerEntries.get(restaurant.id)?.el.firstElementChild?.getBoundingClientRect().height ?? 0
  popup.options.offset = L.point(0, 7 - height)
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
  clearMarkers()
  for (const restaurant of markerable.value) {
    const latlng = L.latLng(restaurant.latitude, restaurant.longitude)
    const entry: MarkerEntry = { restaurant, el: document.createElement('div'), collapsed: false }
    markerEntries.set(restaurant.id, entry)
    paintMarker(entry)
    const marker = L.marker(latlng, { icon: iconFor(entry.el), title: restaurant.name })
    marker.on('click', () => openPopupFor(restaurant, latlng))
    marker.addTo(markerLayer)
  }
  collapseOverlapping()
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
      if (userDotEl) render(null, userDotEl)
      userDotEl = document.createElement('div')
      render(h(MapDot, { kind: 'user', x: 0, y: 0, label: 'Your location' }), userDotEl)
      userMarker = L.marker(latlng, {
        icon: iconFor(userDotEl),
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
    selectedId = null
    collapseOverlapping()
  })
  map.on('moveend', onUserMove)
  map.on('zoomend', onUserMove)
  // Zooming changes how far apart markers sit on screen, so re-run the overlap check after it.
  map.on('zoomend', collapseOverlapping)

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
  clearMarkers()
  if (userDotEl) render(null, userDotEl)
  userDotEl = null
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

    <div class="restaurant-map__overlays">
      <div v-if="truncated" class="restaurant-map__hint" role="status">
        <MapHint>Showing the closest restaurants. Zoom in to see more.</MapHint>
      </div>
      <div class="restaurant-map__legend" role="group" aria-label="Legend">
        <MapLegend />
      </div>
    </div>
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
.restaurant-map__overlays { position: absolute; left: var(--space-4); right: var(--space-4); bottom: var(--space-4); z-index: 500; display: flex; flex-wrap: wrap; align-items: flex-end; gap: var(--space-2); pointer-events: none; }
.restaurant-map__legend { margin-left: auto; }
:deep(.restaurant-map__icon:focus-visible) { outline: none; }
:deep(.restaurant-map__icon:focus-visible .ds-map-marker), :deep(.restaurant-map__icon:focus-visible .ds-map-dot) { outline: var(--border-thick) solid var(--color-focus-ring); outline-offset: 2px; }
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
