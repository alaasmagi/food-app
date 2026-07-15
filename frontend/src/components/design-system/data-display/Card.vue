<script setup lang="ts">
// Prop contract ported 1:1 from the design system's Card.d.ts.
withDefaults(
  defineProps<{
    padding?: string
    /** Darkens surface + brightens border on hover - use for clickable cards. */
    hoverable?: boolean
  }>(),
  {
    padding: '20px',
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
.ds-card {
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  transition:
    background var(--duration-fast) var(--ease-standard),
    border-color var(--duration-fast) var(--ease-standard);
}

.ds-card--hoverable:hover {
  background: var(--surface-hover);
  border-color: var(--border-strong);
}
</style>
