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
.ds-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  font-family: var(--font-body);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  color: var(--text-primary);
  background: var(--surface-hover);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-full);
}

.ds-tag--selected {
  color: var(--accent-9);
  background: var(--accent-2);
  border-color: var(--accent-3);
}

.ds-tag__remove {
  display: flex;
  align-items: center;
  padding: 0;
  color: inherit;
  background: none;
  border: none;
  cursor: pointer;
  opacity: 0.7;
}

.ds-tag__remove:hover {
  opacity: 1;
}
</style>
