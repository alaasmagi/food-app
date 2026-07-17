<script lang="ts">
// Authoritative prop contract, ported 1:1 from the design system's Icon.d.ts.
// Exported from a plain <script> block so other components (Button, ...) can
// import the union type.
export type IconName =
  | 'chevron-down'
  | 'chevron-right'
  | 'chevron-up'
  | 'check'
  | 'x'
  | 'plus'
  | 'minus'
  | 'search'
  | 'info'
  | 'alert-triangle'
  | 'alert-circle'
  | 'check-circle'
  | 'arrow-right'
  | 'spinner'
  | 'link'
</script>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    /** Which glyph to render. */
    name: IconName
    /** Pixel size (square). Default 16. */
    size?: number
    /** Stroke width. Default 2. */
    strokeWidth?: number
    /** Stroke color. Default currentColor - set via parent's color. */
    color?: string
  }>(),
  {
    size: 16,
    strokeWidth: 2,
    color: 'currentColor',
  },
)

// Minimal geometric line-icon set on a 24x24 grid, stroke-based with round
// caps/joins. Glyph geometry copied verbatim from the design system's Icon.jsx.
const PATHS: Record<IconName, string> = {
  'chevron-down': '<polyline points="6 9 12 15 18 9" />',
  'chevron-right': '<polyline points="9 18 15 12 9 6" />',
  'chevron-up': '<polyline points="18 15 12 9 6 15" />',
  check: '<polyline points="20 6 9 17 4 12" />',
  x: '<line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />',
  plus: '<line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />',
  minus: '<line x1="5" y1="12" x2="19" y2="12" />',
  search: '<circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />',
  info: '<circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="11" /><line x1="12" y1="8" x2="12" y2="8" />',
  'alert-triangle':
    '<path d="M12 3 L21.5 20 H2.5 Z" /><line x1="12" y1="10" x2="12" y2="14" /><line x1="12" y1="17.5" x2="12" y2="17.5" />',
  'alert-circle':
    '<circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12.5" /><line x1="12" y1="16" x2="12" y2="16" />',
  'check-circle': '<circle cx="12" cy="12" r="10" /><polyline points="8 12.5 11 15.5 16 9" />',
  'arrow-right': '<line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />',
  spinner: '<circle cx="12" cy="12" r="9" opacity="0.25" /><path d="M21 12a9 9 0 0 0-9-9" />',
  link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />',
}

const glyph = computed(() => PATHS[props.name])
const isSpinner = computed(() => props.name === 'spinner')
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    :stroke="color"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="ds-icon"
    :class="{ 'ds-icon--spin': isSpinner }"
    v-html="glyph"
  />
</template>

<style scoped>
.ds-icon {
  display: block;
  flex-shrink: 0;
}

.ds-icon--spin {
  animation: ds-icon-spin 0.8s linear infinite;
}

@keyframes ds-icon-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
