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
.ds-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 7px;
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  font-weight: var(--weight-medium);
  letter-spacing: var(--tracking-wide);
  /* Deliberate uppercase treatment - the one sanctioned exception to sentence case. */
  text-transform: uppercase;
  border-radius: var(--radius-sm);
}

.ds-badge--neutral {
  color: var(--text-primary);
  background: var(--neutral-3);
}

.ds-badge--accent {
  color: var(--accent-9);
  background: var(--accent-2);
}

.ds-badge--success {
  color: var(--status-success);
  background: var(--status-success-bg);
}

.ds-badge--warning {
  color: var(--status-warning);
  background: var(--status-warning-bg);
}

.ds-badge--danger {
  color: var(--status-danger);
  background: var(--status-danger-bg);
}
</style>
