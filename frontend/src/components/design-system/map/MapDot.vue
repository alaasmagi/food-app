<script setup lang="ts">
import { at, type MapCoord } from './mapCoord'

// Prop contract ported 1:1 from the design system's MapDot (Map.tsx).
withDefaults(
  defineProps<{
    kind?: 'user' | 'location' | 'place'
    x: MapCoord
    y: MapCoord
    label?: string
  }>(),
  {
    kind: 'place',
  },
)
</script>

<template>
  <span
    class="ds-map-dot"
    :class="`ds-map-dot--${kind}`"
    :style="at(x, y)"
    :role="label ? 'img' : undefined"
    :aria-label="label"
    :aria-hidden="label ? undefined : true"
  />
</template>

<style scoped>
.ds-map-dot { position: absolute; z-index: 1; transform: translate(-50%, -50%); border: var(--border-thick) solid var(--color-bg-surface); border-radius: var(--radius-full); background: var(--color-accent-solid); }
.ds-map-dot--user { width: 18px; height: 18px; background: var(--color-status-info-solid); }
.ds-map-dot--location { width: 18px; height: 18px; }
.ds-map-dot--place { width: 12px; height: 12px; }
</style>
