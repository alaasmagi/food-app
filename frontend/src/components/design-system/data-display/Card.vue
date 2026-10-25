<script setup lang="ts">
// Prop contract ported 1:1 from the design system's Card.d.ts.
withDefaults(
  defineProps<{
    padding?: string
    /** Darkens surface + brightens border on hover - use for clickable cards. */
    hoverable?: boolean
  }>(),
  {
    padding: '24px',
    hoverable: false,
  },
)
</script>

<template>
  <div class="ds-card" :class="{ 'ds-card--hoverable': hoverable }" :style="{ padding }">
    <slot />
  </div>
</template>

<style scoped>
/* Figma "Card": bg/surface, border/subtle, radius/lg. */
.ds-card { display: flex; flex-direction: column; gap: var(--space-4); background: var(--color-bg-surface); border: var(--border-thin) solid var(--color-border-subtle); border-radius: var(--radius-lg); }
.ds-card--hoverable { cursor: pointer; transition: border-color var(--duration-fast) var(--ease-standard); }
.ds-card--hoverable:hover { border-color: var(--color-border-strong); background-image: linear-gradient(var(--color-bg-hover), var(--color-bg-hover)); }
</style>
