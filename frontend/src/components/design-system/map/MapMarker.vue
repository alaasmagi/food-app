<script setup lang="ts">
import { computed } from 'vue'
import Icon from '../Icon.vue'
import { at, type MapCoord } from './mapCoord'

// Prop contract ported 1:1 from the design system's MapMarker (Map.tsx). The tail tip sits on the coordinate.
const props = withDefaults(
  defineProps<{
    name: string
    offers?: boolean
    selected?: boolean
    x?: MapCoord
    y?: MapCoord
    onClick?: () => void
    offersLabel?: string
  }>(),
  {
    offers: true,
    offersLabel: ', lunch offers today',
  },
)

const placed = computed(() => props.x !== undefined && props.y !== undefined)
const style = computed(() => (props.x !== undefined && props.y !== undefined ? at(props.x, props.y) : undefined))
</script>

<template>
  <component
    :is="onClick ? 'button' : 'span'"
    :type="onClick ? 'button' : undefined"
    class="ds-map-marker"
    :class="[
      offers ? 'ds-map-marker--offers' : 'ds-map-marker--plain',
      { 'ds-map-marker--selected': selected, 'ds-map-marker--placed': placed },
    ]"
    :style="style"
    :aria-expanded="onClick ? !!selected : undefined"
    @click="onClick?.()"
  >
    <span class="ds-map-marker__pill">
      <Icon v-if="offers" name="utensils" :size="14" />
      {{ name }}
      <span v-if="offers && offersLabel" class="visually-hidden">{{ offersLabel }}</span>
    </span>
    <span class="ds-map-marker__tail" aria-hidden="true" />
  </component>
</template>

<style scoped>
.ds-map-marker { display: inline-flex; flex-direction: column; align-items: center; padding: 0; border: 0; background: none; font: inherit; font-family: var(--font-body); border-radius: var(--radius-full); }
button.ds-map-marker { cursor: pointer; }
.ds-map-marker:focus-visible { outline: var(--border-thick) solid var(--color-focus-ring); outline-offset: 2px; }
.ds-map-marker--placed { position: absolute; z-index: 1; transform: translate(-50%, -100%); }
.ds-map-marker--placed.ds-map-marker--selected { z-index: 2; }
.ds-map-marker__pill { display: inline-flex; align-items: center; gap: var(--space-1-5); padding: var(--space-1) var(--space-2-5); border-radius: var(--radius-full); background: var(--marker-bg); color: var(--marker-fg); box-shadow: var(--shadow-sm); font-size: 12px; line-height: 16px; font-weight: var(--weight-medium); letter-spacing: 0.005em; white-space: nowrap; }
.ds-map-marker__tail { width: 10px; height: 6px; background: var(--marker-tail); clip-path: polygon(0 0, 100% 0, 50% 100%); }
.ds-map-marker--offers { --marker-bg: var(--color-accent-solid); --marker-fg: var(--color-text-on-accent); --marker-tail: var(--color-accent-solid); }
.ds-map-marker--offers .ds-map-marker__pill { padding-left: var(--space-2); }
.ds-map-marker--offers.ds-map-marker--selected { --marker-bg: var(--color-accent-solid-hover); --marker-tail: var(--color-accent-solid-hover); }
.ds-map-marker--offers.ds-map-marker--selected .ds-map-marker__pill { box-shadow: inset 0 0 0 var(--border-thick) var(--color-bg-surface), var(--shadow-md); }
.ds-map-marker--plain { --marker-bg: var(--color-bg-raised); --marker-fg: var(--color-text-secondary); --marker-tail: var(--color-border-strong); }
.ds-map-marker--plain .ds-map-marker__pill { border: var(--border-thin) solid var(--color-border-default); }
.ds-map-marker--plain.ds-map-marker--selected { --marker-fg: var(--color-text-primary); --marker-tail: var(--color-accent-solid); }
.ds-map-marker--plain.ds-map-marker--selected .ds-map-marker__pill { border: var(--border-thick) solid var(--color-accent-solid); box-shadow: var(--shadow-md); }
</style>
