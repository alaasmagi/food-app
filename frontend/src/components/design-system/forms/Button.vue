<script setup lang="ts">
import { computed, useSlots } from 'vue'
import Icon, { type IconName } from '../Icon.vue'

// Prop contract ported 1:1 from the design system's Button.d.ts.
const props = withDefaults(
  defineProps<{
    /** Visual style. Default "primary". */
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
    /** Default "md". */
    size?: 'sm' | 'md' | 'lg'
    /** Optional leading/trailing icon glyph. */
    icon?: IconName
    iconPosition?: 'left' | 'right'
    /** Shows spinner in place of icon, disables interaction. */
    loading?: boolean
    disabled?: boolean
    fullWidth?: boolean
    type?: 'button' | 'submit' | 'reset'
    /** Figma Icon button: square 44px, the label stays available to screen readers only. */
    iconOnly?: boolean
  }>(),
  {
    variant: 'primary',
    size: 'md',
    iconPosition: 'left',
    loading: false,
    disabled: false,
    fullWidth: false,
    type: 'button',
    iconOnly: false,
  },
)

const emit = defineEmits<{ click: [e: MouseEvent] }>()

const slots = useSlots()
const hasLabel = computed(() => !!slots.default)

const isDisabled = computed(() => props.disabled || props.loading)

// Icon pixel size per button size, matching the design system's SIZE map.
// Figma Button has a single size; `size` is kept for API compatibility and no longer changes the look.
const iconSize = computed(() => 18)

function onClick(e: MouseEvent) {
  if (isDisabled.value) return
  emit('click', e)
}
</script>

<template>
  <button
    :type="type"
    :disabled="isDisabled"
    :aria-busy="loading || undefined"
    class="ds-button"
    :class="[`ds-button--${variant}`, `ds-button--${size}`, { 'ds-button--full': fullWidth, 'ds-button--icon-only': iconOnly || !hasLabel }]"
    @click="onClick"
  >
    <Icon v-if="loading" name="spinner" :size="iconSize" />
    <!-- Figma: the icon always leads the label (iconPosition is accepted but no longer moves it). -->
    <Icon v-else-if="icon" :name="icon" :size="iconSize" />
    <span v-if="hasLabel" :class="{ 'visually-hidden': iconOnly }"><slot /></span>
  </button>
</template>

<style scoped>
/* Figma "Button": one size (44px), radius/md, Label/Default; icon (18px) always leads the label. */
.ds-button {
  display: inline-flex; align-items: center; justify-content: center; gap: var(--space-2);
  min-height: 44px; padding: var(--space-3) var(--space-5);
  border: var(--border-thin) solid transparent; border-radius: var(--radius-md); background: transparent;
  font-family: var(--font-body); font-size: 14px; line-height: 20px; font-weight: var(--weight-semibold);
  white-space: nowrap; cursor: pointer;
  transition: background-color var(--duration-fast) var(--ease-standard), border-color var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard);
}
.ds-button:focus-visible { outline: var(--border-thick) solid var(--color-focus-ring); outline-offset: 2px; }
.ds-button--full { display: flex; width: 100%; }
.ds-button--icon-only { width: 44px; padding: 0; }
.ds-button--primary { background: var(--color-accent-solid); color: var(--color-text-on-accent); }
.ds-button--primary:hover:not(:disabled) { background: var(--color-accent-solid-hover); }
.ds-button--secondary { background: var(--color-bg-surface); border-color: var(--color-border-strong); color: var(--color-text-primary); }
.ds-button--ghost { color: var(--color-text-primary); }
.ds-button--ghost.ds-button--icon-only { color: var(--color-text-secondary); }
.ds-button--secondary:hover:not(:disabled), .ds-button--ghost:hover:not(:disabled) { background-image: linear-gradient(var(--color-bg-hover), var(--color-bg-hover)); color: var(--color-text-primary); }
.ds-button--danger { background: var(--color-status-danger-solid); color: var(--color-text-on-accent); }
.ds-button--danger:hover:not(:disabled) { background-image: linear-gradient(var(--color-bg-pressed), var(--color-bg-pressed)); }
.ds-button:disabled { cursor: not-allowed; background: var(--color-bg-sunken); border-color: transparent; color: var(--color-text-disabled); }
.ds-button--ghost:disabled { background: transparent; }
</style>
