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
const DEFAULT_ZOOM = 17

// Zoom level to snap to when focusing a single restaurant from the list.
const FOCUS_ZOOM = 16

let map: L.Map | null = null
let markerLayer: L.LayerGroup | null = null
let popup: L.Popup | null = null
let tileLayer: L.TileLayer | null = null
// Marker for the user's own location, set once geolocation resolves on mount. Kept separate from the
// restaurant markerLayer so viewport re-fetches (which clear that layer) never remove it.
let userMarker: L.Marker | null = null
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

// A marker is the green dot plus a small name label above it. The icon is built per restaurant (not
// shared) because each carries its own name; the dot stays anchored on the coordinate and the label
// floats above it via CSS, so iconSize/iconAnchor only account for the dot.
function markerIconFor(name: string): L.DivIcon {
  return L.divIcon({
    className: 'restaurant-map__marker',
    html:
      '<span class="restaurant-map__marker-dot"></span>' +
      `<span class="restaurant-map__marker-label">${escapeHtml(name)}</span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  })
}

// Visually distinct pin for the user's own location (a haloed dot), so it doesn't read as a restaurant.
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
    const marker = L.marker(latlng, { icon: markerIconFor(restaurant.name), title: restaurant.name })
    marker.on('click', () => openPopupFor(restaurant, latlng))
    marker.addTo(markerLayer)
  }
  declutterLabels()
}

// Hide name labels that would overlap. Greedy: walk the markers in order, keep a label only if its
// box clears every label already kept, otherwise hide it (the dot always stays). Depends on the
// icons being in the DOM, so it runs after markers are added and again on zoom (which changes how far
// apart the markers sit on screen). Uses visibility, not display, so hidden labels keep their layout
// box and the pass stays cheap.
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

// Try to centre the initial view on the user's location, then load that area. Falls back to the
// default (Tallinn) view when geolocation is unsupported, denied, times out, or otherwise fails.
// Viewport mode only — autoFit and focus modes set their own initial view. Because the callbacks
// fire after the mount's programmatic window has closed, the move is re-wrapped so it never raises
// the "Search this area" prompt, and the viewport fetch is deferred until the position resolves (or
// fails) to avoid a Tallinn fetch immediately followed by a second fetch of the user's area.
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
  // Zooming changes how far apart markers sit on screen, so re-run label decluttering after it.
  map.on('zoomend', declutterLabels)

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
    // Centre on the user's location if they allow it (falling back to Tallinn), then load that
    // viewport; later moves use the "Search this area" button.
    centreOnUserLocation()
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
  userMarker = null
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
  /* Leaflet gives its panes/controls z-indexes up to 1000. Without an isolated stacking context
     those leak into the page and paint over higher-level UI like modals (whose overlay is z-index
     100). isolate traps all of Leaflet's z-indexes inside the map. */
  isolation: isolate;
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

/* Token-styled marker, replacing Leaflet's default PNG icon. The label floats above the dot, so the
   marker box stays centred on the dot and the label is allowed to overflow it. */
:deep(.restaurant-map__marker) {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;
}

/* Small name label sitting above the dot. Centred on the dot, one line, with a subtle pill
   background so it stays legible over the map tiles. pointer-events:none so it never intercepts the
   dot's click. */
:deep(.restaurant-map__marker-label) {
  position: absolute;
  bottom: calc(100% + 3px);
  left: 50%;
  transform: translateX(-50%);
  max-width: 140px;
  padding: 1px var(--space-2);
  overflow: hidden;
  font-family: var(--font-body);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  line-height: var(--leading-snug);
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--text-primary);
  background: var(--surface-overlay);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-full);
  box-shadow: var(--shadow-sm);
  pointer-events: none;
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

/* User's own location: a blue dot with a soft halo. The design system has no blue (restaurant
   markers are teal accent), so this uses an explicit blue — the universal "you are here" convention —
   harmonized to the neutrals' hue (~250) so it still sits with the palette. */
:deep(.restaurant-map__user) {
  --user-location: oklch(60% 0.18 255);
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.restaurant-map__user-dot) {
  display: block;
  width: 14px;
  height: 14px;
  border-radius: var(--radius-full);
  background: var(--user-location);
  border: 2px solid var(--surface-app);
  box-shadow:
    0 0 0 4px color-mix(in srgb, var(--user-location) 30%, transparent),
    var(--shadow-sm);
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

/* The dark CARTO basemap is very low-contrast on its own — streets and place names barely read.
   Lift only the tile pane (the "undermap"); markers, labels and popups live in other panes and are
   untouched. Light theme needs no correction. */
:root[data-theme='dark'] .restaurant-map .leaflet-tile-pane {
  filter: brightness(1.55) contrast(1.1) saturate(1.08);
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
