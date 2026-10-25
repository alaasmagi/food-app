<script setup lang="ts">
import Icon from '../Icon.vue'

// Ported from the design system's Tag.d.ts. React's `onRemove` callback is
// translated the Vue-idiomatic way: a `removable` prop shows the remove
// affordance and a native `remove` event is emitted (analogous to Button's
// onClick -> @click).
withDefaults(
  defineProps<{
    /** Accent-tinted "selected" look, e.g. active filter. */
    selected?: boolean
    /** Shows an x that emits `remove` when clicked (removable chip). */
    removable?: boolean
  }>(),
  {
    selected: false,
    removable: false,
  },
)

const emit = defineEmits<{ remove: [] }>()
</script>

<template>
  <span class="ds-tag" :class="{ 'ds-tag--selected': selected }">
    <slot />
    <button
      v-if="removable"
      type="button"
      class="ds-tag__remove"
      aria-label="Remove"
      @click="emit('remove')"
    >
      <Icon name="x" :size="11" />
    </button>
  </span>
</template>

<style scoped>
/* Figma "Tag": Off = surface + default border, On (selected) = accent subtle. */
.ds-tag { display: inline-flex; align-items: center; gap: var(--space-1); min-height: 28px; padding: var(--space-1) var(--space-3); border: var(--border-thin) solid var(--color-border-default); border-radius: var(--radius-full); background: var(--color-bg-surface); color: var(--color-text-secondary); font-family: var(--font-body); font-size: 14px; line-height: 20px; font-weight: var(--weight-medium); white-space: nowrap; }
.ds-tag--selected { background: var(--color-accent-subtle); border-color: var(--color-accent-border); color: var(--color-accent-text); }
.ds-tag__remove { display: inline-flex; padding: 0; border: 0; background: none; color: inherit; cursor: pointer; }
</style>
