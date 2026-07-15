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
.ds-switch {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-family: var(--font-body);
  font-size: var(--text-sm);
  color: var(--text-primary);
  cursor: pointer;
}

.ds-switch--disabled {
  color: var(--text-disabled);
  cursor: not-allowed;
}

.ds-switch__input {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}

.ds-switch__track {
  position: relative;
  flex-shrink: 0;
  width: 34px;
  height: 20px;
  background: var(--neutral-4);
  border-radius: var(--radius-full);
  transition: background var(--duration-normal) var(--ease-standard);
}

.ds-switch__thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  background: var(--neutral-9);
  border-radius: var(--radius-full);
  transition: left var(--duration-normal) var(--ease-standard);
}

.ds-switch__input:checked ~ .ds-switch__track {
  background: var(--accent-7);
}

.ds-switch__input:checked ~ .ds-switch__track .ds-switch__thumb {
  left: 16px;
}

.ds-switch__input:focus-visible ~ .ds-switch__track {
  box-shadow: var(--shadow-focus-ring);
}

.ds-switch--disabled .ds-switch__track {
  background: var(--neutral-3);
}
</style>
