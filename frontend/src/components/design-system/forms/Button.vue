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
  }>(),
  {
    variant: 'primary',
    size: 'md',
    iconPosition: 'left',
    loading: false,
    disabled: false,
    fullWidth: false,
    type: 'button',
  },
)

const emit = defineEmits<{ click: [e: MouseEvent] }>()

const slots = useSlots()
const hasLabel = computed(() => !!slots.default)

const isDisabled = computed(() => props.disabled || props.loading)

// Icon pixel size per button size, matching the design system's SIZE map.
const iconSize = computed(() => (props.size === 'sm' ? 14 : props.size === 'lg' ? 16 : 15))

function onClick(e: MouseEvent) {
  if (isDisabled.value) return
  emit('click', e)
}
</script>

<template>
  <button
    :type="type"
    :disabled="isDisabled"
    class="ds-button"
    :class="[`ds-button--${variant}`, `ds-button--${size}`, { 'ds-button--full': fullWidth }]"
    @click="onClick"
  >
    <Icon v-if="loading" name="spinner" :size="iconSize" />
    <Icon
      v-else-if="icon && iconPosition === 'left'"
      :name="icon"
      :size="iconSize"
    />
    <span v-if="hasLabel"><slot /></span>
    <Icon
      v-if="!loading && icon && iconPosition === 'right'"
      :name="icon"
      :size="iconSize"
    />
  </button>
</template>

<style scoped>
.ds-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-body);
  font-weight: var(--weight-medium);
  letter-spacing: var(--tracking-normal);
  cursor: pointer;
  transition:
    background var(--duration-fast) var(--ease-standard),
    border-color var(--duration-fast) var(--ease-standard);
}

.ds-button--full {
  width: 100%;
}

/* ---- Sizes ---- */
.ds-button--sm {
  gap: 6px;
  padding: 6px 10px;
  font-size: var(--text-xs);
  border-radius: var(--radius-sm);
}

.ds-button--md {
  gap: 7px;
  padding: 9px 14px;
  font-size: var(--text-sm);
  border-radius: var(--radius-md);
}

.ds-button--lg {
  gap: 8px;
  padding: 12px 18px;
  font-size: var(--text-base);
  border-radius: var(--radius-md);
}

/* ---- Variants ---- */
.ds-button--primary {
  color: var(--action-primary-text);
  background: var(--action-primary);
  border: 1px solid transparent;
}

.ds-button--primary:hover:not(:disabled) {
  background: var(--action-primary-hover);
}

.ds-button--primary:active:not(:disabled) {
  background: var(--action-primary-press);
}

.ds-button--secondary {
  color: var(--text-primary);
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
}

.ds-button--secondary:hover:not(:disabled) {
  background: var(--surface-hover);
}

.ds-button--secondary:active:not(:disabled) {
  background: var(--neutral-4);
}

.ds-button--ghost {
  color: var(--text-primary);
  background: transparent;
  border: 1px solid transparent;
}

.ds-button--ghost:hover:not(:disabled) {
  background: var(--surface-hover);
}

.ds-button--ghost:active:not(:disabled) {
  background: var(--neutral-4);
}

.ds-button--danger {
  color: var(--status-danger);
  background: var(--status-danger-bg);
  border: 1px solid var(--status-danger-bg);
}

.ds-button--danger:hover:not(:disabled) {
  background: var(--status-danger-bg);
}

.ds-button--danger:active:not(:disabled) {
  background: var(--status-danger-bg);
}

/* ---- Focus ---- */
.ds-button:focus-visible {
  outline: none;
  box-shadow: var(--shadow-focus-ring);
}

/* ---- Disabled ---- */
.ds-button:disabled {
  color: var(--text-disabled);
  background: var(--neutral-2);
  border: 1px solid var(--border-subtle);
  cursor: not-allowed;
}
</style>
