<script setup lang="ts">
import Icon from '../Icon.vue'

// Ported 1:1 from the design system's MapHint (Map.tsx): info hint panel.
</script>

<template>
  <div class="ds-map-panel ds-map-panel--hint">
    <Icon name="info" :size="16" />
    <span><slot /></span>
  </div>
</template>

<style scoped>
.ds-map-panel { display: flex; align-items: center; padding: var(--space-2) var(--space-3); background: var(--color-bg-raised); border: var(--border-thin) solid var(--color-border-subtle); border-radius: var(--radius-md); box-shadow: var(--shadow-sm); font-family: var(--font-body); }
.ds-map-panel--hint { gap: var(--space-2); font-size: 14px; line-height: 20px; color: var(--color-text-secondary); }
.ds-map-panel--hint > .ds-icon { color: var(--color-status-info-text); }
</style>
