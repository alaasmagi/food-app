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
      <Icon v-if="model" name="check" :size="11" :stroke-width="2.5" color="var(--text-on-accent)" />
    </span>
    <span v-if="label" class="ds-checkbox__label">{{ label }}</span>
  </label>
</template>

<style scoped>
.ds-checkbox {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-body);
  font-size: var(--text-sm);
  color: var(--text-primary);
  cursor: pointer;
}

.ds-checkbox--disabled {
  color: var(--text-disabled);
  cursor: not-allowed;
}

.ds-checkbox__input {
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

.ds-checkbox__box {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  background: var(--surface-card);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  transition:
    background var(--duration-fast) var(--ease-standard),
    border-color var(--duration-fast) var(--ease-standard);
}

.ds-checkbox__input:checked ~ .ds-checkbox__box {
  background: var(--accent-7);
  border-color: var(--accent-7);
}

.ds-checkbox__input:focus-visible ~ .ds-checkbox__box {
  box-shadow: var(--shadow-focus-ring);
}

.ds-checkbox--disabled .ds-checkbox__box {
  background: var(--neutral-1);
}
</style>
