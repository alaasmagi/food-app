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
  | 'map-pin'
  | 'star'
  | 'bookmark'
  | 'pie-chart'
  | 'menu'
  | 'pencil'
  | 'trash'
  | 'refresh'
  | 'arrow-left'
  | 'home'
  | 'settings'
  | 'log-out'
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
  'map-pin':
    '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" /><circle cx="12" cy="10" r="3" />',
  'star':
    '<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />',
  'bookmark':
    '<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />',
  'pie-chart':
    '<path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" />',
  'menu':
    '<path d="M4 12h16" /><path d="M4 6h16" /><path d="M4 18h16" />',
  'pencil':
    '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" /><path d="m15 5 4 4" />',
  'trash':
    '<path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />',
  'refresh':
    '<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" />',
  'arrow-left':
    '<path d="m12 19-7-7 7-7" /><path d="M19 12H5" />',
  'home':
    '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" /><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />',
  'settings':
    '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" />',
  'log-out':
    '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" />',
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
