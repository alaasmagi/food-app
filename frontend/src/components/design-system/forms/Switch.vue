<script setup lang="ts">
// Ported from the design system's Switch.d.ts. React checked/onChange -> Vue v-model.
withDefaults(defineProps<{ label?: string; disabled?: boolean }>(), {
  disabled: false,
})

const model = defineModel<boolean>({ default: false })
</script>

<template>
  <label class="ds-switch" :class="{ 'ds-switch--disabled': disabled }">
    <input
      v-model="model"
      type="checkbox"
      role="switch"
      class="ds-switch__input"
      :disabled="disabled"
    />
    <span class="ds-switch__track">
      <span class="ds-switch__thumb" />
    </span>
    <span v-if="label" class="ds-switch__label">{{ label }}</span>
  </label>
</template>

<style scoped>
/* Figma "Switch": 40x24 track, accent when on, 20px thumb; Label/Default. */
.ds-switch { display: inline-flex; align-items: center; gap: var(--space-2-5); min-height: 44px; cursor: pointer; font-family: var(--font-body); font-size: 14px; line-height: 20px; font-weight: var(--weight-semibold); color: var(--color-text-primary); }
.ds-switch__input { position: absolute; opacity: 0; width: 1px; height: 1px; pointer-events: none; }
.ds-switch__track { position: relative; flex-shrink: 0; width: 40px; height: 24px; border-radius: var(--radius-full); background: var(--color-border-strong); transition: background-color var(--duration-normal) var(--ease-standard); }
.ds-switch__thumb { position: absolute; top: 2px; left: 2px; width: 20px; height: 20px; border-radius: var(--radius-full); background: var(--color-bg-surface); box-shadow: var(--shadow-sm); transition: left var(--duration-normal) var(--ease-standard), background-color var(--duration-normal); }
.ds-switch__input:checked + .ds-switch__track { background: var(--color-accent-solid); }
.ds-switch__input:checked + .ds-switch__track .ds-switch__thumb { left: 18px; background: var(--color-text-on-accent); }
.ds-switch__input:focus-visible + .ds-switch__track { outline: var(--border-thick) solid var(--color-focus-ring); outline-offset: 2px; }
.ds-switch--disabled { cursor: not-allowed; color: var(--color-text-disabled); }
</style>
