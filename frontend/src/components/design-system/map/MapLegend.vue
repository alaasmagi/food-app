<script setup lang="ts">
import MapMarker from './MapMarker.vue'

// Ported 1:1 from the design system's MapLegend (Map.tsx): marker legend panel.
withDefaults(
  defineProps<{
    offersLabel?: string
    noOffersLabel?: string
  }>(),
  {
    offersLabel: 'Lunch offers today',
    noOffersLabel: 'No offers today',
  },
)
</script>

<template>
  <div class="ds-map-panel ds-map-panel--legend">
    <MapMarker :name="offersLabel" offers-label="" />
    <MapMarker :name="noOffersLabel" :offers="false" />
  </div>
</template>

<style scoped>
.ds-map-panel { display: flex; align-items: center; padding: var(--space-2) var(--space-3); background: var(--color-bg-raised); border: var(--border-thin) solid var(--color-border-subtle); border-radius: var(--radius-md); box-shadow: var(--shadow-sm); font-family: var(--font-body); }
.ds-map-panel--legend { gap: var(--space-3); }
</style>
