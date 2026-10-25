<script setup lang="ts">
import Icon, { type IconName } from '../Icon.vue'

// Prop contract ported 1:1 from the design system's Badge.d.ts.
withDefaults(
  defineProps<{
    tone?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger'
    icon?: IconName
  }>(),
  {
    tone: 'neutral',
  },
)
</script>

<template>
  <span class="ds-badge" :class="`ds-badge--${tone}`">
    <Icon v-if="icon" :name="icon" :size="10" />
    <slot />
  </span>
</template>

<style scoped>
/* Figma "Badge": pill, Label 12/16 500, tone border + subtle fill. */
.ds-badge { display: inline-flex; align-items: center; gap: var(--space-1); padding: var(--space-0-5) var(--space-2); border: var(--border-thin) solid; border-radius: var(--radius-full); font-family: var(--font-body); font-size: 12px; line-height: 16px; font-weight: var(--weight-medium); letter-spacing: 0.005em; white-space: nowrap; }
.ds-badge--neutral { background: var(--color-bg-sunken); border-color: var(--color-border-default); color: var(--color-text-secondary); }
.ds-badge--accent { background: var(--color-accent-subtle); border-color: var(--color-accent-border); color: var(--color-accent-text); }
.ds-badge--success { background: var(--color-status-success-subtle); border-color: var(--color-status-success-border); color: var(--color-status-success-text); }
.ds-badge--warning { background: var(--color-status-warning-subtle); border-color: var(--color-status-warning-border); color: var(--color-status-warning-text); }
.ds-badge--danger { background: var(--color-status-danger-subtle); border-color: var(--color-status-danger-border); color: var(--color-status-danger-text); }
</style>
