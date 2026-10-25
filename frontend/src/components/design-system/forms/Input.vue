<script setup lang="ts">
import Icon, { type IconName } from '../Icon.vue'

// Prop contract ported 1:1 from the design system's Input.d.ts. React's
// value/onChange are translated to Vue v-model.
withDefaults(
  defineProps<{
    label?: string
    placeholder?: string
    type?: string
    icon?: IconName
    error?: string
    hint?: string
    disabled?: boolean
    size?: 'sm' | 'md'
    /** Renders a <textarea> instead of <input>. Default false. */
    multiline?: boolean
    rows?: number
  }>(),
  {
    type: 'text',
    disabled: false,
    size: 'md',
    multiline: false,
    rows: 3,
  },
)

const model = defineModel<string>({ default: '' })
</script>

<template>
  <div class="ds-input">
    <label v-if="label" class="ds-input__label">{{ label }}</label>
    <div class="ds-input__wrap">
      <span v-if="icon && !multiline" class="ds-input__icon">
        <Icon :name="icon" :size="20" />
      </span>
      <textarea
        v-if="multiline"
        v-model="model"
        class="ds-input__field ds-input__field--textarea"
        :class="[`ds-input__field--${size}`, { 'ds-input__field--error': error }]"
        :placeholder="placeholder"
        :rows="rows"
        :disabled="disabled"
      />
      <input
        v-else
        v-model="model"
        class="ds-input__field"
        :class="[
          `ds-input__field--${size}`,
          { 'ds-input__field--error': error, 'ds-input__field--with-icon': icon },
        ]"
        :type="type"
        :placeholder="placeholder"
        :disabled="disabled"
      />
    </div>
    <span v-if="error || hint" class="ds-input__msg" :class="{ 'ds-input__msg--error': error }">
      {{ error || hint }}
    </span>
  </div>
</template>

<style scoped>
/* Figma "Input" / "Textarea": label Label/Default, 44px field on bg/sunken, accent focus ring. */
.ds-input { display: flex; flex-direction: column; gap: var(--space-1-5); width: 100%; }
.ds-input__label { font-family: var(--font-body); font-size: 14px; line-height: 20px; font-weight: var(--weight-semibold); color: var(--color-text-secondary); }
.ds-input__wrap { position: relative; display: flex; align-items: center; }
.ds-input__icon { position: absolute; left: var(--space-3); display: inline-flex; color: var(--color-text-muted); pointer-events: none; }
.ds-input__field { width: 100%; min-height: 44px; box-sizing: border-box; padding: var(--space-2-5) var(--space-3); background: var(--color-bg-sunken); border: var(--border-thin) solid var(--color-border-default); border-radius: var(--radius-md); font-family: var(--font-body); font-size: 16px; line-height: 24px; color: var(--color-text-primary); transition: border-color var(--duration-fast) var(--ease-standard), background-color var(--duration-fast) var(--ease-standard); }
.ds-input__field::placeholder { color: var(--color-text-muted); opacity: 1; }
.ds-input__field--with-icon { padding-left: 40px; }
.ds-input__field--textarea { min-height: 0; resize: vertical; }
.ds-input__field:focus { outline: none; background: var(--color-bg-surface); border-color: var(--color-accent-solid); box-shadow: 0 0 0 1px var(--color-accent-solid); }
.ds-input__field--error { border-color: var(--color-status-danger-solid); box-shadow: 0 0 0 1px var(--color-status-danger-solid); }
.ds-input__field:disabled { background: var(--color-bg-canvas); border-color: var(--color-border-subtle); color: var(--color-text-disabled); cursor: not-allowed; }
.ds-input__msg { font-family: var(--font-body); font-size: 12px; line-height: 16px; color: var(--color-text-muted); }
.ds-input__msg--error { color: var(--color-status-danger-text); }
</style>
