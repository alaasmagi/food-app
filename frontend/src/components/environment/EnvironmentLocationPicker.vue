<script lang="ts">
// The auto-fill origin the picker edits: a map point plus an optional radius (meters). Latitude and
// longitude are set together (both null when no location); radiusMeters is null until the user types
// one, in which case the backend applies its 500 m default at run time. Exported so the editor
// dialog can type its drafts.
export interface AutoFillOrigin {
  latitude: number | null
  longitude: number | null
  radiusMeters: number | null
}
</script>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import L from 'leaflet'
import Input from '../design-system/forms/Input.vue'
import Button from '../design-system/forms/Button.vue'
import { useTheme, type Theme } from '../../composables/useTheme'

const model = defineModel<AutoFillOrigin>({ required: true })

const { theme } = useTheme()

// CARTO basemaps matched to the app theme, mirroring RestaurantMap so the picker reads the same.
const TILE_URL: Record<Theme, string> = {
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
}

// Fallback view (Tallinn, where the catalog lives) when the origin has no coordinates yet.
const DEFAULT_CENTER: L.LatLngTuple = [59.437, 24.7536]
const DEFAULT_ZOOM = 12
// Zoom to snap to when a location is set or a search resolves.
const LOCATED_ZOOM = 14
// Radius used for the circle preview when no radius is entered, matching the backend default.
const DEFAULT_RADIUS_METERS = 500

const mapEl = ref<HTMLElement | null>(null)
// Radius text is kept as a string for the Input; digits only, empty means "unset" (defaults to 500).
const radiusText = ref(model.value.radiusMeters != null ? String(model.value.radiusMeters) : '')

const searchQuery = ref('')
const searching = ref(false)
const searchMessage = ref<string | null>(null)

let map: L.Map | null = null
let tileLayer: L.TileLayer | null = null
let marker: L.Marker | null = null
let circle: L.Circle | null = null

// A single teardrop-free dot marks the chosen origin; distinct from restaurant markers by its accent
// ring. Draggable so the user can nudge the point after placing it.
const originIcon = L.divIcon({
  className: 'env-location-picker__marker',
  html: '<span class="env-location-picker__dot"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

function hasLocation(): boolean {
  return model.value.latitude != null && model.value.longitude != null
}

// The radius the circle overlay should preview: the entered value, or the 500 m default when empty.
function effectiveRadius(): number {
  return model.value.radiusMeters ?? DEFAULT_RADIUS_METERS
}

// Write a new point into the model, preserving the current radius. Both axes move together.
function setPoint(lat: number, lng: number): void {
  model.value = { ...model.value, latitude: lat, longitude: lng }
}

// Remove the location entirely: no point, no radius. Clears the radius input too.
function clearLocation(): void {
  model.value = { latitude: null, longitude: null, radiusMeters: null }
  radiusText.value = ''
}

function renderCircle(): void {
  if (!map) return
  if (!hasLocation()) {
    circle?.remove()
    circle = null
    return
  }
  const latlng = L.latLng(model.value.latitude!, model.value.longitude!)
  const radius = effectiveRadius()
  if (!circle) {
    circle = L.circle(latlng, {
      radius,
      className: 'env-location-picker__circle',
      interactive: false,
    }).addTo(map)
  } else {
    circle.setLatLng(latlng)
    circle.setRadius(radius)
  }
}

// Reflect the model's point in the map: place/move the draggable marker, or remove it when cleared.
function renderPoint(): void {
  if (!map) return
  if (!hasLocation()) {
    marker?.remove()
    marker = null
    renderCircle()
    return
  }
  const latlng = L.latLng(model.value.latitude!, model.value.longitude!)
  if (!marker) {
    marker = L.marker(latlng, { icon: originIcon, draggable: true }).addTo(map)
    marker.on('dragend', () => {
      const p = marker!.getLatLng()
      setPoint(p.lat, p.lng)
    })
  } else {
    marker.setLatLng(latlng)
  }
  renderCircle()
}

// Geocode the typed address client-side via Nominatim. This is a third-party service, not our
// backend, so it uses a plain fetch (never the bearer-token apiFetch wrapper) and is best-effort:
// on no result or failure it shows a message and leaves the marker and view untouched.
async function runSearch(): Promise<void> {
  const query = searchQuery.value.trim()
  if (!query || searching.value) return
  searching.value = true
  searchMessage.value = null
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`
    const response = await fetch(url, { headers: { Accept: 'application/json' } })
    if (!response.ok) throw new Error(`Search failed (${response.status})`)
    const results = (await response.json()) as Array<{ lat: string; lon: string }>
    if (!results.length) {
      searchMessage.value = 'No results found for that search.'
      return
    }
    const { lat, lon } = results[0]
    map?.setView([Number(lat), Number(lon)], LOCATED_ZOOM)
  } catch {
    searchMessage.value = 'Search is unavailable right now. Pick a point on the map instead.'
  } finally {
    searching.value = false
  }
}

// Radius input drives the model. Strip non-digits so the value is always a positive integer or
// empty; empty means "unset" and the overlay falls back to the 500 m preview.
watch(radiusText, (value) => {
  const cleaned = value.replace(/[^\d]/g, '')
  if (cleaned !== value) {
    radiusText.value = cleaned
    return
  }
  model.value = { ...model.value, radiusMeters: cleaned === '' ? null : Number(cleaned) }
  renderCircle()
})

// External model changes (parent seeds the origin, our click/drag handlers) re-render the map layers.
watch(
  () => [model.value.latitude, model.value.longitude, model.value.radiusMeters],
  () => renderPoint(),
)

// Swap the basemap in place when the app theme changes, matching RestaurantMap.
watch(theme, (value) => {
  tileLayer?.setUrl(TILE_URL[value])
})

onMounted(async () => {
  if (!mapEl.value) return
  map = L.map(mapEl.value, { zoomControl: true, attributionControl: true })
  tileLayer = L.tileLayer(TILE_URL[theme.value], {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20,
  }).addTo(map)
  // Clicking the map sets (or moves) the origin point.
  map.on('click', (event: L.LeafletMouseEvent) => setPoint(event.latlng.lat, event.latlng.lng))

  // Centre on the existing point if there is one, else the default view.
  if (hasLocation()) {
    map.setView([model.value.latitude!, model.value.longitude!], LOCATED_ZOOM)
  } else {
    map.setView(DEFAULT_CENTER, DEFAULT_ZOOM)
  }
  renderPoint()

  // The dialog may have just become visible; give the container a laid-out size before measuring.
  await nextTick()
  if (!map) return
  map.invalidateSize({ pan: false })
})

onUnmounted(() => {
  map?.remove()
  map = null
  tileLayer = null
  marker = null
  circle = null
})
</script>

<template>
  <div class="env-location-picker">
    <form class="env-location-picker__search" @submit.prevent="runSearch">
      <Input
        v-model="searchQuery"
        placeholder="Search for an address"
        icon="search"
        size="sm"
        aria-label="Search for an address"
      />
      <Button type="submit" variant="secondary" size="sm" :loading="searching">Search</Button>
    </form>
    <p v-if="searchMessage" class="env-location-picker__message" role="status">
      {{ searchMessage }}
    </p>

    <div
      ref="mapEl"
      class="env-location-picker__canvas"
      role="application"
      aria-label="Pick a location"
    />

    <p v-if="!hasLocation()" class="env-location-picker__hint">
      Click the map or search for an address to set a location. Auto-fill is unavailable until a
      location is set.
    </p>

    <template v-else>
      <div class="env-location-picker__radius">
        <Input v-model="radiusText" label="Radius (meters)" placeholder="500" size="sm" />
        <Button variant="ghost" size="sm" icon="x" @click="clearLocation">Clear location</Button>
      </div>
      <p v-if="radiusText === ''" class="env-location-picker__hint">Defaults to 500 m.</p>
    </template>
  </div>
</template>

<style scoped>
.env-location-picker {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  /* Trap Leaflet's pane/control z-indexes so they never paint over the dialog, matching the
     restaurant map. */
  isolation: isolate;
}

.env-location-picker__search {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
}

.env-location-picker__search :deep(.ds-input) {
  flex: 1;
}

.env-location-picker__canvas {
  height: 240px;
  width: 100%;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  background: var(--surface-card);
  overflow: hidden;
}

.env-location-picker__radius {
  display: flex;
  align-items: flex-end;
  gap: var(--space-3);
}

.env-location-picker__radius :deep(.ds-input) {
  flex: 1;
}

.env-location-picker__message {
  margin: 0;
  font-family: var(--font-body);
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.env-location-picker__hint {
  margin: 0;
  font-family: var(--font-body);
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

/* Origin dot: an accent dot with a soft halo, distinct from restaurant markers. */
:deep(.env-location-picker__marker) {
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.env-location-picker__dot) {
  display: block;
  width: 14px;
  height: 14px;
  border-radius: var(--radius-full);
  background: var(--accent-7);
  border: 2px solid var(--surface-app);
  box-shadow:
    0 0 0 4px color-mix(in srgb, var(--accent-7) 30%, transparent),
    var(--shadow-sm);
  cursor: grab;
}
</style>

<!--
  The Leaflet radius circle and map chrome live in Leaflet's own DOM outside this component's scope,
  so they are themed with unscoped rules referencing the design tokens, scoped under the picker's
  class so they never leak. Mirrors the approach in RestaurantMap.
-->
<style>
.env-location-picker .leaflet-container {
  background: var(--surface-app);
  font-family: var(--font-body);
}

/* The dark CARTO basemap is very low-contrast on its own; lift only the tile pane so streets and
   place names read. Light theme needs no correction. */
:root[data-theme='dark'] .env-location-picker .leaflet-tile-pane {
  filter: brightness(1.8) contrast(1.25) saturate(1.1);
}

/* The radius overlay, styled with tokens. CSS wins over Leaflet's stroke/fill presentation
   attributes, so the accent colour applies. */
.env-location-picker__circle {
  stroke: var(--accent-7);
  stroke-width: 2;
  fill: var(--accent-7);
  fill-opacity: 0.12;
}

.env-location-picker .leaflet-control-zoom a {
  background: var(--surface-raised);
  color: var(--text-primary);
  border-color: var(--border-subtle);
}

.env-location-picker .leaflet-control-zoom a:hover {
  background: var(--surface-hover);
}

.env-location-picker .leaflet-control-attribution {
  background: var(--surface-overlay);
  color: var(--text-secondary);
}

.env-location-picker .leaflet-control-attribution a {
  color: var(--text-link);
}
</style>
