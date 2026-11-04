<script lang="ts">
// Auto-fill origin edited by the picker; a null radius means the backend applies its 500 m default.
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
import { useTheme } from '../../composables/useTheme'
import { useElementResize } from '../../composables/useElementResize'
import { TILE_URL } from '../restaurant/basemap'

const model = defineModel<AutoFillOrigin>({ required: true })

const { theme } = useTheme()

const DEFAULT_CENTER: L.LatLngTuple = [59.437, 24.7536]
const DEFAULT_ZOOM = 12
const LOCATED_ZOOM = 14
// Radius used for the circle preview when no radius is entered, matching the backend default.
const DEFAULT_RADIUS_METERS = 500

const mapEl = ref<HTMLElement | null>(null)
const radiusText = ref(model.value.radiusMeters != null ? String(model.value.radiusMeters) : '')

const searchQuery = ref('')
const searching = ref(false)
const searchMessage = ref<string | null>(null)

let map: L.Map | null = null
let tileLayer: L.TileLayer | null = null
let marker: L.Marker | null = null
let circle: L.Circle | null = null

const originIcon = L.divIcon({
  className: 'env-location-picker__marker',
  html: '<span class="env-location-picker__dot"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

function hasLocation(): boolean {
  return model.value.latitude != null && model.value.longitude != null
}

function effectiveRadius(): number {
  return model.value.radiusMeters ?? DEFAULT_RADIUS_METERS
}

function setPoint(lat: number, lng: number): void {
  model.value = { ...model.value, latitude: lat, longitude: lng }
}

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

// Nominatim is third-party, so it gets a plain fetch, never the bearer-token apiFetch wrapper.
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

watch(radiusText, (value) => {
  const cleaned = value.replace(/[^\d]/g, '')
  if (cleaned !== value) {
    radiusText.value = cleaned
    return
  }
  model.value = { ...model.value, radiusMeters: cleaned === '' ? null : Number(cleaned) }
  renderCircle()
})

watch(
  () => [model.value.latitude, model.value.longitude, model.value.radiusMeters],
  () => renderPoint(),
)

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
  map.on('click', (event: L.LeafletMouseEvent) => setPoint(event.latlng.lat, event.latlng.lng))

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

// The canvas can grow with the page layout (New place), not just the window.
useElementResize(mapEl, () => map?.invalidateSize({ pan: false }))

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
  /* Trap Leaflet's pane/control z-indexes so they never paint over the dialog. */
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
  flex: 1;
  min-height: 240px;
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

<!-- Leaflet's own DOM is outside this component's scope, so it is themed with unscoped rules under the picker's class. -->
<style>
.env-location-picker .leaflet-container {
  background: var(--surface-app);
  font-family: var(--font-body);
}

/* The dark CARTO basemap is too low-contrast; lift only the tile pane. */
:root[data-theme='dark'] .env-location-picker .leaflet-tile-pane {
  filter: brightness(1.8) contrast(1.25) saturate(1.1);
}

/* CSS wins over Leaflet's stroke/fill presentation attributes, so the token colours apply. */
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
