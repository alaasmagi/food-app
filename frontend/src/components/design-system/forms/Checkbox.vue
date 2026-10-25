<script setup lang="ts">
import Icon from '../Icon.vue'

// Ported from the design system's Checkbox.d.ts. React checked/onChange -> Vue v-model.
withDefaults(defineProps<{ label?: string; disabled?: boolean }>(), {
  disabled: false,
})

const model = defineModel<boolean>({ default: false })
</script>

<template>
  <label class="ds-checkbox" :class="{ 'ds-checkbox--disabled': disabled }">
    <input v-model="model" type="checkbox" class="ds-checkbox__input" :disabled="disabled" />
    <span class="ds-checkbox__box">
      <Icon v-if="model" name="check" :size="14" :stroke-width="2.5" color="var(--text-on-accent)" />
    </span>
    <span v-if="label" class="ds-checkbox__label">{{ label }}</span>
  </label>
</template>

<style scoped>
/* Figma "Checkbox": 20px box, 2px border/strong, accent fill when checked, Body/Default label. */
.ds-checkbox { display: inline-flex; align-items: center; gap: var(--space-2); min-height: 44px; cursor: pointer; font-family: var(--font-body); font-size: 16px; line-height: 24px; color: var(--color-text-primary); }
.ds-checkbox__input { position: absolute; opacity: 0; width: 1px; height: 1px; pointer-events: none; }
.ds-checkbox__box { display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; width: 20px; height: 20px; box-sizing: border-box; border: var(--border-thick) solid var(--color-border-strong); border-radius: var(--radius-xs); background: var(--color-bg-surface); transition: background-color var(--duration-fast) var(--ease-standard), border-color var(--duration-fast) var(--ease-standard); }
.ds-checkbox__input:checked + .ds-checkbox__box { background: var(--color-accent-solid); border-color: var(--color-accent-solid); }
.ds-checkbox__input:focus-visible + .ds-checkbox__box { outline: var(--border-thick) solid var(--color-focus-ring); outline-offset: 2px; }
.ds-checkbox--disabled { cursor: not-allowed; color: var(--color-text-disabled); }
</style>
